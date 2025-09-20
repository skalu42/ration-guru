import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureCard } from "@/components/ui/feature-card";
import { Camera, ShoppingCart, Zap, TrendingDown, Bot, Smartphone } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import appIcon from "@/assets/app-icon.png";

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const features = [
    {
      icon: Camera,
      title: "Smart OCR Recognition",
      description: "Upload your ration list in Hindi or English. Our AI extracts items with quantities accurately.",
    },
    {
      icon: TrendingDown,
      title: "Best Price Finder",
      description: "Compare prices across JioMart and BigBasket to find the cheapest option for each item.",
    },
    {
      icon: Bot,
      title: "Intelligent Matching",
      description: "AI-powered fuzzy matching finds the right products even with variations in naming.",
    },
    {
      icon: ShoppingCart,
      title: "Automated Cart Addition",
      description: "Automatically add selected items to your cart on the recommended platform.",
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Works perfectly on mobile devices for convenient grocery shopping on the go.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get price comparisons and cart automation in seconds, not minutes.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={appIcon} alt="RationCart AI" className="w-10 h-10" />
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              RationCart AI
            </h1>
          </div>
          <Button variant="outline" onClick={onGetStarted}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
                Smart Grocery Shopping with{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  AI Power
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Upload your ration list, get instant price comparisons, and let AI automate your cart. 
                Save money and time on every grocery order.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="hero" 
                size="lg" 
                onClick={onGetStarted}
                className="text-lg px-8 py-6"
              >
                Start Saving Now
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                View Demo
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">OCR Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">₹500+</div>
                <div className="text-sm text-muted-foreground">Avg. Savings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">5min</div>
                <div className="text-sm text-muted-foreground">Process Time</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src={heroImage} 
                alt="Fresh Indian grocery items" 
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl lg:text-4xl font-bold mb-4">
            Everything You Need for Smart Shopping
          </h3>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From OCR text extraction to automated cart management, we've got every step covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              gradient={index === 0}
            />
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl lg:text-4xl font-bold mb-4">
            How It Works
          </h3>
          <p className="text-xl text-muted-foreground">
            Simple 4-step process to revolutionize your grocery shopping
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: "1",
              title: "Upload List",
              description: "Take a photo of your ration list or upload a PDF",
            },
            {
              step: "2", 
              title: "AI Processing",
              description: "OCR extracts items and quantities automatically",
            },
            {
              step: "3",
              title: "Price Compare",
              description: "AI finds best prices across JioMart & BigBasket",
            },
            {
              step: "4",
              title: "Auto Cart",
              description: "Items added to cart on recommended platforms",
            },
          ].map((step, index) => (
            <Card key={index} className="text-center hover:shadow-elegant transition-all duration-300">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {step.step}
                </div>
                <h4 className="text-lg font-semibold mb-2">{step.title}</h4>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-hero text-white border-0 shadow-2xl">
          <CardContent className="text-center py-16">
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Transform Your Grocery Shopping?
            </h3>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join thousands of smart shoppers who save money and time with AI-powered grocery assistance.
            </p>
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={onGetStarted}
              className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90"
            >
              Get Started - It's Free
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};