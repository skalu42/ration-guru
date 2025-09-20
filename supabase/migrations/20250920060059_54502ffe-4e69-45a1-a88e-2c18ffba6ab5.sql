-- Create users profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create ration lists table
CREATE TABLE public.ration_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Ration List',
  image_url TEXT,
  raw_ocr_text TEXT,
  extracted_items JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ration_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for ration lists
CREATE POLICY "Users can view their own lists" 
ON public.ration_lists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lists" 
ON public.ration_lists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" 
ON public.ration_lists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" 
ON public.ration_lists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create price cache table
CREATE TABLE public.price_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('jiomart', 'bigbasket')),
  product_name TEXT NOT NULL,
  pack_size TEXT,
  price DECIMAL(10,2) NOT NULL,
  product_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read access for price data)
ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for price cache
CREATE POLICY "Price cache is readable by authenticated users" 
ON public.price_cache 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create price comparisons table
CREATE TABLE public.price_comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.ration_lists(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity TEXT,
  jiomart_price DECIMAL(10,2),
  jiomart_product_name TEXT,
  jiomart_url TEXT,
  bigbasket_price DECIMAL(10,2),
  bigbasket_product_name TEXT,
  bigbasket_url TEXT,
  recommended_platform TEXT CHECK (recommended_platform IN ('jiomart', 'bigbasket')),
  savings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.price_comparisons ENABLE ROW LEVEL SECURITY;

-- Create policies for price comparisons
CREATE POLICY "Users can view price comparisons for their lists" 
ON public.price_comparisons 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ration_lists 
    WHERE ration_lists.id = price_comparisons.list_id 
    AND ration_lists.user_id = auth.uid()
  )
);

CREATE POLICY "Service can manage price comparisons" 
ON public.price_comparisons 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create cart sessions table
CREATE TABLE public.cart_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.ration_lists(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('jiomart', 'bigbasket')),
  items JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  automation_log TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for cart sessions
CREATE POLICY "Users can view their own cart sessions" 
ON public.cart_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cart sessions" 
ON public.cart_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart sessions" 
ON public.cart_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ration_lists_updated_at
  BEFORE UPDATE ON public.ration_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at
  BEFORE UPDATE ON public.cart_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_ration_lists_user_id ON public.ration_lists(user_id);
CREATE INDEX idx_ration_lists_status ON public.ration_lists(status);
CREATE INDEX idx_price_cache_item_platform ON public.price_cache(item_name, platform);
CREATE INDEX idx_price_cache_last_updated ON public.price_cache(last_updated);
CREATE INDEX idx_price_comparisons_list_id ON public.price_comparisons(list_id);
CREATE INDEX idx_cart_sessions_user_id ON public.cart_sessions(user_id);
CREATE INDEX idx_cart_sessions_status ON public.cart_sessions(status);