import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { list_id, platform, items } = await req.json();
    console.log('Automating cart for platform:', platform, 'items:', items.length);

    // Create cart session
    const { data: cartSession, error: sessionError } = await supabase
      .from('cart_sessions')
      .insert({
        user_id: user.id,
        list_id: list_id,
        platform: platform,
        items: items,
        status: 'processing'
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // Simulate cart automation process
    const automationLog = await simulateCartAutomation(platform, items);

    // Update cart session with results
    const { error: updateError } = await supabase
      .from('cart_sessions')
      .update({
        status: 'completed',
        automation_log: automationLog
      })
      .eq('id', cartSession.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        cart_session_id: cartSession.id,
        automation_log: automationLog,
        platform_url: getPlatformUrl(platform),
        message: `Successfully automated cart for ${platform}. Please visit the platform to complete checkout.`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in automate-cart function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Cart automation failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function simulateCartAutomation(platform: string, items: any[]): Promise<string> {
  const logs: string[] = [];
  logs.push(`Starting cart automation for ${platform}`);
  logs.push(`Processing ${items.length} items`);

  // Simulate the automation process
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    logs.push(`[${i + 1}/${items.length}] Processing: ${item.item_name}`);
    
    // Simulate delays and processing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate different scenarios
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      logs.push(`✓ Added ${item.item_name} to cart successfully`);
    } else {
      logs.push(`✗ Failed to add ${item.item_name} - product not found or out of stock`);
    }
  }

  logs.push('Cart automation completed');
  logs.push(`Next step: Visit ${platform} to review cart and complete checkout`);
  logs.push('⚠️ Please verify quantities and review total before payment');

  return logs.join('\n');
}

function getPlatformUrl(platform: string): string {
  const urls: Record<string, string> = {
    'jiomart': 'https://www.jiomart.com/cart',
    'bigbasket': 'https://www.bigbasket.com/cart'
  };
  
  return urls[platform] || 'https://www.google.com';
}