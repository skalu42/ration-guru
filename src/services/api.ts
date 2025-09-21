import { supabase } from '@/integrations/supabase/client';

export interface RationList {
  id: string;
  title: string;
  image_url?: string;
  raw_ocr_text?: string;
  extracted_items?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface PriceComparison {
  id: string;
  item: string;
  quantity: string;
  jioMartPrice: number;
  bigBasketPrice: number;
  recommendedPlatform: 'jiomart' | 'bigbasket';
  savings: number;
}

export interface CartSession {
  id: string;
  platform: 'jiomart' | 'bigbasket';
  items: any[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  automation_log?: string;
  created_at: string;
}

class APIService {
  async createRationList(title: string): Promise<RationList> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('ration_lists')
      .insert([{ title, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data as RationList;
  }

  async getRationLists(): Promise<RationList[]> {
    const { data, error } = await supabase
      .from('ration_lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as RationList[];
  }

  async uploadImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `ration-lists/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async processOCR(imageData: string, listId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('process-ocr', {
      body: {
        image_data: imageData,
        list_id: listId
      }
    });

    if (error) throw error;
    return data;
  }

  async scrapePrices(listId: string, items: any[]): Promise<PriceComparison[]> {
    const { data, error } = await supabase.functions.invoke('scrape-prices', {
      body: {
        list_id: listId,
        items: items
      }
    });

    if (error) throw error;
    return data.comparisons;
  }

  async getPriceComparisons(listId: string): Promise<PriceComparison[]> {
    const { data, error } = await supabase
      .from('price_comparisons')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((comp: any) => ({
      id: comp.id,
      item: comp.item_name,
      quantity: comp.quantity || '',
      jioMartPrice: comp.jiomart_price || 0,
      bigBasketPrice: comp.bigbasket_price || 0,
      recommendedPlatform: comp.recommended_platform as 'jiomart' | 'bigbasket',
      savings: comp.savings || 0
    }));
  }

  async automateCart(listId: string, platform: 'jiomart' | 'bigbasket', items: any[]): Promise<CartSession> {
    const { data, error } = await supabase.functions.invoke('automate-cart', {
      body: {
        list_id: listId,
        platform: platform,
        items: items
      }
    });

    if (error) throw error;
    return data;
  }

  async getRationList(id: string): Promise<RationList> {
    const { data, error } = await supabase
      .from('ration_lists')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as RationList;
  }
}

export const apiService = new APIService();