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

interface ScrapedPrice {
  platform: string;
  product_name: string;
  pack_size: string;
  price: number;
  product_url: string;
}

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

    const { list_id, items } = await req.json();
    console.log('Scraping prices for list:', list_id, 'items:', items);

    const priceComparisons = [];

    for (const item of items) {
      console.log('Processing item:', item.normalized_name);
      
      try {
        // Check cache first
        const { data: cachedPrices } = await supabase
          .from('price_cache')
          .select('*')
          .eq('item_name', item.normalized_name)
          .gte('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24 hours cache

        let jioMartPrice: ScrapedPrice | null = null;
        let bigBasketPrice: ScrapedPrice | null = null;

        if (cachedPrices?.length) {
          const jioMartCached = cachedPrices.find(p => p.platform === 'jiomart');
          const bigBasketCached = cachedPrices.find(p => p.platform === 'bigbasket');
          
          if (jioMartCached) {
            jioMartPrice = {
              platform: 'jiomart',
              product_name: jioMartCached.product_name,
              pack_size: jioMartCached.pack_size || '',
              price: parseFloat(jioMartCached.price.toString()),
              product_url: jioMartCached.product_url || ''
            };
          }
          
          if (bigBasketCached) {
            bigBasketPrice = {
              platform: 'bigbasket',
              product_name: bigBasketCached.product_name,
              pack_size: bigBasketCached.pack_size || '',
              price: parseFloat(bigBasketCached.price.toString()),
              product_url: bigBasketCached.product_url || ''
            };
          }
        }

        // If not in cache, simulate scraping with realistic prices
        if (!jioMartPrice) {
          jioMartPrice = await scrapeJioMart(item.normalized_name);
          // Cache the result
          if (jioMartPrice) {
            await supabase.from('price_cache').insert({
              item_name: item.normalized_name,
              platform: 'jiomart',
              product_name: jioMartPrice.product_name,
              pack_size: jioMartPrice.pack_size,
              price: jioMartPrice.price,
              product_url: jioMartPrice.product_url
            });
          }
        }

        if (!bigBasketPrice) {
          bigBasketPrice = await scrapeBigBasket(item.normalized_name);
          // Cache the result
          if (bigBasketPrice) {
            await supabase.from('price_cache').insert({
              item_name: item.normalized_name,
              platform: 'bigbasket',
              product_name: bigBasketPrice.product_name,
              pack_size: bigBasketPrice.pack_size,
              price: bigBasketPrice.price,
              product_url: bigBasketPrice.product_url
            });
          }
        }

        // Determine best choice and savings
        let recommendedPlatform = 'jiomart';
        let savings = 0;

        if (jioMartPrice && bigBasketPrice) {
          if (bigBasketPrice.price < jioMartPrice.price) {
            recommendedPlatform = 'bigbasket';
            savings = jioMartPrice.price - bigBasketPrice.price;
          } else {
            savings = bigBasketPrice.price - jioMartPrice.price;
          }
        }

        const comparison = {
          list_id,
          item_name: item.item_name,
          quantity: item.quantity,
          jiomart_price: jioMartPrice?.price || null,
          jiomart_product_name: jioMartPrice?.product_name || null,
          jiomart_url: jioMartPrice?.product_url || null,
          bigbasket_price: bigBasketPrice?.price || null,
          bigbasket_product_name: bigBasketPrice?.product_name || null,
          bigbasket_url: bigBasketPrice?.product_url || null,
          recommended_platform: recommendedPlatform,
          savings: Math.max(0, savings)
        };

        priceComparisons.push(comparison);

        // Add small delay to avoid overwhelming the servers
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (itemError) {
        console.error(`Error processing item ${item.normalized_name}:`, itemError);
        // Continue with next item
      }
    }

    // Insert all comparisons into database
    if (priceComparisons.length > 0) {
      const { error: insertError } = await supabase
        .from('price_comparisons')
        .insert(priceComparisons);

      if (insertError) {
        console.error('Error inserting price comparisons:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        comparisons: priceComparisons
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in scrape-prices function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Price scraping failed' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function scrapeJioMart(itemName: string): Promise<ScrapedPrice | null> {
  console.log('Scraping JioMart for:', itemName);
  
  // In production, this would use Playwright to scrape real data
  // For now, returning realistic mock data based on item type
  const priceMap: Record<string, { name: string; price: number; pack: string; url: string }> = {
    'wheat flour': { name: 'Aashirvaad Atta', price: 240, pack: '5kg', url: 'https://jiomart.com/atta' },
    'rice': { name: 'India Gate Basmati Rice', price: 520, pack: '10kg', url: 'https://jiomart.com/rice' },
    'sugar': { name: 'Dhampure Sugar', price: 90, pack: '2kg', url: 'https://jiomart.com/sugar' },
    'oil': { name: 'Fortune Sunflower Oil', price: 180, pack: '1L', url: 'https://jiomart.com/oil' },
    'lentils': { name: 'Toor Dal', price: 120, pack: '1kg', url: 'https://jiomart.com/dal' },
    'chickpea': { name: 'Chana Dal', price: 100, pack: '1kg', url: 'https://jiomart.com/chana' },
    'onion': { name: 'Fresh Onions', price: 40, pack: '2kg', url: 'https://jiomart.com/onion' },
    'potato': { name: 'Fresh Potatoes', price: 35, pack: '3kg', url: 'https://jiomart.com/potato' },
    'tomato': { name: 'Fresh Tomatoes', price: 45, pack: '1kg', url: 'https://jiomart.com/tomato' },
    'milk': { name: 'Amul Milk', price: 60, pack: '1L', url: 'https://jiomart.com/milk' },
    'eggs': { name: 'Farm Fresh Eggs', price: 180, pack: '30 pieces', url: 'https://jiomart.com/eggs' }
  };

  const itemData = priceMap[itemName.toLowerCase()] || {
    name: `${itemName} - JioMart`,
    price: Math.floor(Math.random() * 200) + 50,
    pack: '1kg',
    url: `https://jiomart.com/${itemName.replace(/\s+/g, '-')}`
  };

  return {
    platform: 'jiomart',
    product_name: itemData.name,
    pack_size: itemData.pack,
    price: itemData.price,
    product_url: itemData.url
  };
}

async function scrapeBigBasket(itemName: string): Promise<ScrapedPrice | null> {
  console.log('Scraping BigBasket for:', itemName);
  
  // In production, this would use Playwright to scrape real data
  // For now, returning realistic mock data with slight price variations
  const priceMap: Record<string, { name: string; price: number; pack: string; url: string }> = {
    'wheat flour': { name: 'Pillsbury Atta', price: 235, pack: '5kg', url: 'https://bigbasket.com/atta' },
    'rice': { name: 'Dawat Basmati Rice', price: 540, pack: '10kg', url: 'https://bigbasket.com/rice' },
    'sugar': { name: 'More Sugar', price: 95, pack: '2kg', url: 'https://bigbasket.com/sugar' },
    'oil': { name: 'Saffola Gold Oil', price: 185, pack: '1L', url: 'https://bigbasket.com/oil' },
    'lentils': { name: 'Organic Toor Dal', price: 130, pack: '1kg', url: 'https://bigbasket.com/dal' },
    'chickpea': { name: 'Organic Chana Dal', price: 95, pack: '1kg', url: 'https://bigbasket.com/chana' },
    'onion': { name: 'Farm Fresh Onions', price: 38, pack: '2kg', url: 'https://bigbasket.com/onion' },
    'potato': { name: 'Fresh Potatoes', price: 42, pack: '3kg', url: 'https://bigbasket.com/potato' },
    'tomato': { name: 'Organic Tomatoes', price: 55, pack: '1kg', url: 'https://bigbasket.com/tomato' },
    'milk': { name: 'Nandini Milk', price: 55, pack: '1L', url: 'https://bigbasket.com/milk' },
    'eggs': { name: 'Country Eggs', price: 190, pack: '30 pieces', url: 'https://bigbasket.com/eggs' }
  };

  const itemData = priceMap[itemName.toLowerCase()] || {
    name: `${itemName} - BigBasket`,
    price: Math.floor(Math.random() * 200) + 45,
    pack: '1kg',
    url: `https://bigbasket.com/${itemName.replace(/\s+/g, '-')}`
  };

  return {
    platform: 'bigbasket',
    product_name: itemData.name,
    pack_size: itemData.pack,
    price: itemData.price,
    product_url: itemData.url
  };
}