import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepIndicator } from "@/components/ui/step-indicator";
import { ImageUpload } from "@/components/ui/image-upload";
import { PriceComparisonTable } from "@/components/ui/price-comparison-table";
import { ProductSearch } from "@/components/product-search";
import { ArrowLeft, CheckCircle, Loader2, RotateCcw, Download, ExternalLink, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiService, RationList, PriceComparison } from "@/services/api";

interface MainAppProps {
  onBack: () => void;
}

export const MainApp = ({ onBack }: MainAppProps) => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
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

  const handleCartAutomation = async (platform: 'jiomart' | 'bigbasket') => {
    if (!currentList) return;
    
    try {
      setIsProcessing(true);
      
      // Get items for the selected platform
      const platformItems = priceResults
        .filter(item => 
          (platform === 'jiomart' && item.recommendedPlatform === 'jiomart') ||
          (platform === 'bigbasket' && item.recommendedPlatform === 'bigbasket')
        )
        .map(item => ({
          item_name: item.item,
          quantity: item.quantity,
          price: platform === 'jiomart' ? item.jioMartPrice : item.bigBasketPrice
        }));

      await apiService.automateCart(currentList.id, platform, platformItems);
      
      toast({
        title: "Cart automation complete!",
        description: "Items have been processed for your cart.",
      });

      // Open platform URL
      const platformUrl = platform === 'jiomart' ? 'https://www.jiomart.com' : 'https://www.bigbasket.com';
      window.open(platformUrl, '_blank');
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Find Products & Compare Prices
              </h2>
              <p className="text-muted-foreground text-lg">
                Upload an image of your ration list or search for specific products
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Option */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">Upload Ration List</h3>
                <p className="text-muted-foreground text-center">Upload an image or PDF</p>
                <ImageUpload onImageUpload={handleImageUpload} />
              </div>
              
              {/* Search Option */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">Search Products</h3>
                <p className="text-muted-foreground text-center">Search by product name</p>
                <ProductSearch onSearch={handleProductSearch} isLoading={isProcessing} />
              </div>
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
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Price Comparison Results
              </h2>
              <p className="text-muted-foreground text-lg">
                AI has found the best prices across JioMart and BigBasket
              </p>
            </div>
            
            {isProcessing ? (
              <Card className="max-w-2xl mx-auto border-primary/20 shadow-lg">
                <CardContent className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xl font-semibold mb-2">Comparing prices...</p>
                  <p className="text-muted-foreground">Searching across multiple platforms</p>
                </CardContent>
              </Card>
            ) : (
              <PriceComparisonTable items={priceResults} />
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Cart Automation
              </h2>
              <p className="text-muted-foreground text-lg">
                Ready to add items to your cart on the recommended platforms
              </p>
            </div>

            <Card className="border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  Cart Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {priceResults.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-secondary/5 to-accent/5 rounded-lg border border-secondary/20">
                      <div>
                        <p className="font-semibold text-lg">{item.item}</p>
                        <p className="text-muted-foreground">{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={item.recommendedPlatform === 'jiomart' ? 'default' : 'secondary'}
                          className="mb-2"
                        >
                          {item.recommendedPlatform === 'jiomart' ? 'JioMart' : 'BigBasket'}
                        </Badge>
                        <p className="font-bold text-lg">₹{Math.min(item.jioMartPrice, item.bigBasketPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold">Total Savings:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{priceResults.reduce((sum, item) => sum + item.savings, 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => handleCartAutomation('jiomart')}
                      disabled={isProcessing}
                      className="bg-primary text-white font-medium"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        "Add to JioMart"
                      )}
                    </Button>
                    <Button
                      onClick={() => handleCartAutomation('bigbasket')}
                      disabled={isProcessing}
                      className="bg-secondary text-white font-medium"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        "Add to BigBasket"
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Items will be opened in new tabs for manual review and checkout
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};