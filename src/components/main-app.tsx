import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepIndicator } from "@/components/ui/step-indicator";
import { ImageUpload } from "@/components/ui/image-upload";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { EnhancedResultsTable } from "@/components/enhanced-results-table";
import { ArrowLeft, CheckCircle, Loader2, RotateCcw, LogOut, Search, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSearchHistory } from "@/hooks/use-search-history";
import { apiService, RationList, PriceComparison } from "@/services/api";

interface MainAppProps {
  onBack: () => void;
}

export const MainApp = ({ onBack }: MainAppProps) => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { searchHistory, addToHistory, clearHistory } = useSearchHistory();
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<any[]>([]);
  const [priceResults, setPriceResults] = useState<PriceComparison[]>([]);
  const [currentList, setCurrentList] = useState<RationList | null>(null);
  const [imageData, setImageData] = useState<string>('');

  const steps = [
    { title: "Upload Image", description: "Upload your ration list" },
    { title: "OCR Processing", description: "Extract text from image" },
    { title: "Price Comparison", description: "Compare across platforms" },
    { title: "Cart Automation", description: "Add items to cart" },
  ];

  const handleImageUpload = async (file: File) => {
    try {
      setUploadedFile(file);
      setCurrentStep(1);
      setIsProcessing(true);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        setImageData(base64Data);
        
        // Create ration list
        const list = await apiService.createRationList(`Ration List - ${new Date().toLocaleDateString()}`);
        setCurrentList(list);
        
        // Process OCR
        await processOCR(base64Data, list.id);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const processOCR = async (imageData: string, listId: string) => {
    try {
      const result = await apiService.processOCR(imageData, listId);
      
      if (result.success) {
        setOcrResults(result.extracted_items || []);
        setCurrentStep(2);
        toast({
          title: "OCR processing complete!",
          description: "Extracted items from your ration list.",
        });
        
        // Start price comparison
        await comparePrices(listId, result.extracted_items || []);
      } else {
        throw new Error(result.error || 'OCR processing failed');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "OCR processing failed",
        description: "Failed to extract text from image. Please try again.",
        variant: "destructive",
      });
      setCurrentStep(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const comparePrices = async (listId: string, items: any[]) => {
    try {
      setIsProcessing(true);
      const comparisons = await apiService.scrapePrices(listId, items);
      
      // Convert to expected format
      const formattedResults = comparisons.map((comp: any) => ({
        id: comp.id,
        item: comp.item_name,
        quantity: comp.quantity,
        jioMartPrice: comp.jiomart_price || 0,
        bigBasketPrice: comp.bigbasket_price || 0,
        recommendedPlatform: comp.recommended_platform as 'jiomart' | 'bigbasket',
        savings: comp.savings || 0
      }));
      
      setPriceResults(formattedResults);
      
      setPriceResults(formattedResults);
      setCurrentStep(3);
      toast({
        title: "Price comparison complete!",
        description: "Found the best deals across platforms.",
      });
    } catch (error) {
      console.error('Price comparison error:', error);
      toast({
        title: "Price comparison failed",
        description: "Failed to compare prices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcess = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setIsProcessing(false);
    setOcrResults([]);
    setPriceResults([]);
    setCurrentList(null);
    setImageData('');
  };

  const handleProductSearch = async (productName: string) => {
    try {
      // Check if user is authenticated
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to search for products.",
          variant: "destructive",
        });
        return;
      }

      setIsProcessing(true);
      setCurrentStep(2);
      
      // Add to search history
      await addToHistory(productName);
      
      // Create a temporary ration list for the search
      const list = await apiService.createRationList(`Search: ${productName}`);
      setCurrentList(list);
      
      // Create a mock item for the search
      const searchItems = [{ item_name: productName, quantity: "1" }];
      setOcrResults(searchItems);
      
      toast({
        title: "Starting search...",
        description: `Searching for "${productName}" across platforms.`,
      });
      
      // Start price comparison
      await comparePrices(list.id, searchItems);
    } catch (error) {
      console.error('Search Error:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to search for product";
      toast({
        title: "Search failed",
        description: errorMessage,
        variant: "destructive",
      });
      setCurrentStep(0);
      setIsProcessing(false);
    }
  };

  const handleCartAutomation = async (selections: Record<string, 'jiomart' | 'bigbasket'>) => {
    if (!currentList) return;
    
    try {
      setIsProcessing(true);
      
      // Group selections by platform
      const jioMartItems: any[] = [];
      const bigBasketItems: any[] = [];
      
      Object.entries(selections).forEach(([itemId, platform]) => {
        const item = priceResults.find(p => p.id === itemId);
        if (item) {
          const itemData = {
            item_name: item.item,
            quantity: item.quantity,
            price: platform === 'jiomart' ? item.jioMartPrice : item.bigBasketPrice
          };
          
          if (platform === 'jiomart') {
            jioMartItems.push(itemData);
          } else {
            bigBasketItems.push(itemData);
          }
        }
      });
      
      // Process cart automation for each platform
      const promises = [];
      if (jioMartItems.length > 0) {
        promises.push(apiService.automateCart(currentList.id, 'jiomart', jioMartItems));
      }
      if (bigBasketItems.length > 0) {
        promises.push(apiService.automateCart(currentList.id, 'bigbasket', bigBasketItems));
      }
      
      await Promise.all(promises);
      
      toast({
        title: "Cart automation complete!",
        description: `Items added to ${jioMartItems.length > 0 ? 'JioMart' : ''} ${bigBasketItems.length > 0 ? 'BigBasket' : ''} carts.`,
      });

      // Open platform URLs
      if (jioMartItems.length > 0) {
        window.open('https://www.jiomart.com', '_blank');
      }
      if (bigBasketItems.length > 0) {
        window.open('https://www.bigbasket.com', '_blank');
      }
    } catch (error) {
      console.error('Cart automation error:', error);
      toast({
        title: "Cart automation failed",
        description: "Failed to automate cart. Please add items manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.email}
              </span>
              <Button
                variant="outline"
                onClick={resetProcess}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Progress Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        {currentStep === 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
                Smart Grocery Price Comparison
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Upload your grocery list or search for specific products to find the best prices across JioMart and BigBasket
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Search Option */}
              <Card className="p-8 border-primary/20 shadow-elegant hover:shadow-glow transition-all duration-300">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Search Products</CardTitle>
                  <p className="text-muted-foreground">Find and compare prices for specific grocery items</p>
                </CardHeader>
                <CardContent>
                  <SearchAutocomplete
                    onSearch={handleProductSearch}
                    isLoading={isProcessing}
                    searchHistory={searchHistory}
                    onClearHistory={clearHistory}
                  />
                </CardContent>
              </Card>
              
              {/* Upload Option */}
              <Card className="p-8 border-secondary/20 shadow-elegant hover:shadow-glow transition-all duration-300">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-secondary rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Upload Grocery List</CardTitle>
                  <p className="text-muted-foreground">Upload an image or PDF of your complete grocery list</p>
                </CardHeader>
                <CardContent>
                  <ImageUpload onImageUpload={handleImageUpload} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  OCR Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xl font-semibold mb-2">Processing your image...</p>
                    <p className="text-muted-foreground">Using AI OCR to extract text in Hindi and English</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600 font-medium text-lg">
                      <CheckCircle className="w-5 h-5" />
                      OCR processing complete!
                    </div>
                    <div className="grid gap-3">
                      {ocrResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/20">
                          <span className="font-medium text-lg">{result.item_name}</span>
                          <Badge variant="outline" className="text-sm">
                            {result.normalized_name}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-hero bg-clip-text text-transparent">
                Price Comparison Results
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                AI has analyzed prices across platforms to find you the best deals
              </p>
            </div>
            
            {isProcessing ? (
              <Card className="max-w-2xl mx-auto border-primary/20 shadow-elegant">
                <CardContent className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-2xl font-semibold mb-4">Comparing prices across platforms...</p>
                  <p className="text-muted-foreground text-lg">This may take a few moments while we search for the best deals</p>
                </CardContent>
              </Card>
            ) : (
              <EnhancedResultsTable 
                items={priceResults} 
                onCartAutomation={handleCartAutomation}
                isLoading={isProcessing}
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
};