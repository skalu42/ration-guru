import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleVisionApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ExtractedItem {
  item_name: string;
  quantity: string;
  unit: string;
  normalized_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { image_data, list_id } = await req.json();
    console.log('Processing OCR for list:', list_id);

    // Update list status to processing
    await supabase
      .from('ration_lists')
      .update({ status: 'processing' })
      .eq('id', list_id)
      .eq('user_id', user.id);

    // Call Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleVisionApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: image_data.split(',')[1], // Remove data:image/jpeg;base64, prefix
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();
    console.log('Vision API response:', JSON.stringify(visionData, null, 2));

    if (visionData.responses?.[0]?.error) {
      throw new Error(`Vision API error: ${visionData.responses[0].error.message}`);
    }

    const extractedText = visionData.responses?.[0]?.textAnnotations?.[0]?.description || '';
    console.log('Extracted text:', extractedText);

    // Process and normalize the extracted text
    const extractedItems = processExtractedText(extractedText);
    console.log('Processed items:', extractedItems);

    // Update the database with OCR results
    const { error: updateError } = await supabase
      .from('ration_lists')
      .update({
        raw_ocr_text: extractedText,
        extracted_items: extractedItems,
        status: 'completed'
      })
      .eq('id', list_id)
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted_text: extractedText,
        extracted_items: extractedItems,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-ocr function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'OCR processing failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function processExtractedText(text: string): ExtractedItem[] {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const items: ExtractedItem[] = [];
  
  // Common Hindi-English ration items mapping
  const itemMapping: Record<string, string> = {
    'आटा': 'wheat flour',
    'चावल': 'rice',
    'चीनी': 'sugar',
    'चना': 'chickpea',
    'दाल': 'lentils',
    'तेल': 'oil',
    'नमक': 'salt',
    'प्याज': 'onion',
    'आलू': 'potato',
    'टमाटर': 'tomato',
    'दूध': 'milk',
    'अंडा': 'eggs',
    'मांस': 'meat',
    'मछली': 'fish',
    'सब्जी': 'vegetables',
    'फल': 'fruits',
    'atta': 'wheat flour',
    'rice': 'rice',
    'sugar': 'sugar',
    'chana': 'chickpea',
    'dal': 'lentils',
    'oil': 'oil',
    'salt': 'salt',
    'onion': 'onion',
    'potato': 'potato',
    'tomato': 'tomato',
    'milk': 'milk',
    'egg': 'eggs',
    'meat': 'meat',
    'fish': 'fish',
    'vegetable': 'vegetables',
    'fruit': 'fruits'
  };

  // Unit mapping
  const unitMapping: Record<string, string> = {
    'किलो': 'kg',
    'कग': 'kg',
    'लीटर': 'ltr',
    'ग्राम': 'g',
    'पैक': 'pack',
    'बोतल': 'bottle',
    'kg': 'kg',
    'kilo': 'kg',
    'kilogram': 'kg',
    'liter': 'ltr',
    'litre': 'ltr',
    'gram': 'g',
    'pack': 'pack',
    'packet': 'pack',
    'bottle': 'bottle'
  };

  for (const line of lines) {
    const trimmedLine = line.trim().toLowerCase();
    
    // Skip if line is too short or contains only numbers
    if (trimmedLine.length < 2 || /^\d+$/.test(trimmedLine)) {
      continue;
    }

    // Extract quantity and unit using regex
    const quantityMatch = trimmedLine.match(/(\d+(?:\.\d+)?)\s*([a-zA-Zा-ह]+)/);
    let quantity = '';
    let unit = '';
    let itemText = trimmedLine;

    if (quantityMatch) {
      quantity = quantityMatch[1];
      unit = unitMapping[quantityMatch[2]] || quantityMatch[2];
      itemText = trimmedLine.replace(quantityMatch[0], '').trim();
    }

    // Find the best matching item name
    let normalizedName = '';
    for (const [key, value] of Object.entries(itemMapping)) {
      if (itemText.includes(key.toLowerCase())) {
        normalizedName = value;
        break;
      }
    }

    // If no exact match found, use fuzzy matching
    if (!normalizedName) {
      const words = itemText.split(/\s+/);
      for (const word of words) {
        for (const [key, value] of Object.entries(itemMapping)) {
          if (word.includes(key.toLowerCase()) || key.toLowerCase().includes(word)) {
            normalizedName = value;
            break;
          }
        }
        if (normalizedName) break;
      }
    }

    // Default to cleaned item text if no mapping found
    if (!normalizedName) {
      normalizedName = itemText.replace(/[^\w\s]/g, '').trim();
    }

    if (normalizedName) {
      items.push({
        item_name: line.trim(),
        quantity: quantity || '1',
        unit: unit || 'pack',
        normalized_name: normalizedName
      });
    }
  }

  return items;
}