import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepIndicator } from "@/components/ui/step-indicator";
import { ImageUpload } from "@/components/ui/image-upload";
import { PriceComparisonTable } from "@/components/ui/price-comparison-table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Eye, ShoppingCart, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MainAppProps {
  onBack: () => void;
}

// Mock data for demonstration
const mockOCRResults = [
  { id: '1', text: 'आटा 5 किलो', normalized: 'Atta 5kg' },
  { id: '2', text: 'चावल 10 किलो', normalized: 'Rice 10kg' },
  { id: '3', text: 'चीनी 2 किलो', normalized: 'Sugar 2kg' },
  { id: '4', text: 'दाल तुअर 3 किलो', normalized: 'Toor Dal 3kg' },
  { id: '5', text: 'तेल 2 लीटर', normalized: 'Cooking Oil 2L' },
];

const mockPriceData = [
  {
    id: '1',
    item: 'Atta (Wheat Flour)',
    quantity: '5kg',
    jioMartPrice: 240,
    bigBasketPrice: 235,
    recommendedPlatform: 'BigBasket' as const,
    savings: 5,
  },
  {
    id: '2',
    item: 'Basmati Rice',
    quantity: '10kg',
    jioMartPrice: 520,
    bigBasketPrice: 540,
    recommendedPlatform: 'JioMart' as const,
    savings: 20,
  },
  {
    id: '3',
    item: 'Sugar',
    quantity: '2kg',
    jioMartPrice: 90,
    bigBasketPrice: 95,
    recommendedPlatform: 'JioMart' as const,
    savings: 5,
  },
  {
    id: '4',
    item: 'Toor Dal',
    quantity: '3kg',
    jioMartPrice: 180,
    bigBasketPrice: 175,
    recommendedPlatform: 'BigBasket' as const,
    savings: 5,
  },
  {
    id: '5',
    item: 'Sunflower Oil',
    quantity: '2L',
    jioMartPrice: 280,
    bigBasketPrice: 290,
    recommendedPlatform: 'JioMart' as const,
    savings: 10,
  },
];

export const MainApp = ({ onBack }: MainAppProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<typeof mockOCRResults>([]);
  const [priceResults, setPriceResults] = useState<typeof mockPriceData>([]);
  const { toast } = useToast();

  const steps = [
    { title: "Upload Image", description: "Upload your ration list" },
    { title: "OCR Processing", description: "Extract text from image" },
    { title: "Price Comparison", description: "Compare across platforms" },
    { title: "Cart Automation", description: "Add items to cart" },
  ];

  const handleImageUpload = (file: File) => {
    setUploadedFile(file);
    setCurrentStep(1);
    simulateOCRProcessing();
  };

  const simulateOCRProcessing = async () => {
    setIsProcessing(true);
    
    // Simulate OCR processing time
    setTimeout(() => {
      setOcrResults(mockOCRResults);
      setCurrentStep(2);
      setIsProcessing(false);
      toast({
        title: "OCR Complete",
        description: "Successfully extracted items from your ration list!",
      });
      
      // Auto-proceed to price comparison
      setTimeout(() => {
        simulatePriceComparison();
      }, 1000);
    }, 3000);
  };

  const simulatePriceComparison = async () => {
    setIsProcessing(true);
    
    // Simulate price comparison processing
    setTimeout(() => {
      setPriceResults(mockPriceData);
      setCurrentStep(3);
      setIsProcessing(false);
      toast({
        title: "Price Comparison Complete",
        description: "Found the best deals across platforms!",
      });
    }, 2000);
  };

  const handleCartAutomation = () => {
    toast({
      title: "Cart Automation Started",
      description: "Opening platforms and adding items to cart...",
    });
    
    // Simulate cart automation
    setTimeout(() => {
      toast({
        title: "Success!",
        description: "Items added to cart on recommended platforms.",
      });
    }, 2000);
  };

  const resetProcess = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setOcrResults([]);
    setPriceResults([]);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-semibold">RationCart AI Assistant</h1>
            </div>
            <Button variant="outline" size="sm" onClick={resetProcess}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Progress Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        {currentStep === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Upload Your Ration List</h2>
              <p className="text-muted-foreground">
                Upload an image of your ration list in Hindi or English, or a PDF document
              </p>
            </div>
            <ImageUpload onImageUpload={handleImageUpload} />
          </div>
        )}

        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isProcessing ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  OCR Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-lg font-medium">Processing your image...</p>
                    <p className="text-muted-foreground">Extracting text using AI OCR technology</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-green-600 font-medium">✅ OCR processing complete!</p>
                    <div className="grid gap-3">
                      {ocrResults.map((result) => (
                        <div key={result.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium">{result.text}</span>
                          <Badge variant="outline">{result.normalized}</Badge>
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
              <h2 className="text-2xl font-bold mb-2">Price Comparison Results</h2>
              <p className="text-muted-foreground">
                AI has found the best prices across JioMart and BigBasket
              </p>
            </div>
            
            {isProcessing ? (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-lg font-medium">Comparing prices...</p>
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
              <h2 className="text-2xl font-bold mb-2">Cart Automation</h2>
              <p className="text-muted-foreground">
                Ready to add items to your cart on the recommended platforms
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {priceResults.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.item}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.recommendedPlatform === 'JioMart' ? 'default' : 'secondary'}>
                          {item.recommendedPlatform}
                        </Badge>
                        <p className="text-sm font-medium mt-1">₹{Math.min(item.jioMartPrice, item.bigBasketPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Savings:</span>
                    <span className="text-green-600">₹{priceResults.reduce((sum, item) => sum + item.savings, 0)}</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="hero" className="flex-1" onClick={handleCartAutomation}>
                    Add to Cart Automatically
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Items
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};