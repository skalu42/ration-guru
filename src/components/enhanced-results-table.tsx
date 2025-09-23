import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, TrendingDown, ExternalLink, Star, Check } from "lucide-react";
import { PriceComparison } from "@/services/api";
import { cn } from "@/lib/utils";

interface EnhancedResultsTableProps {
  items: PriceComparison[];
  onCartAutomation: (selections: Record<string, 'jiomart' | 'bigbasket'>) => void;
  isLoading?: boolean;
}

export const EnhancedResultsTable = ({ items, onCartAutomation, isLoading }: EnhancedResultsTableProps) => {
  const [selections, setSelections] = useState<Record<string, 'jiomart' | 'bigbasket'>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    if (checked) {
      newSelectedItems.add(itemId);
      // Auto-select recommended platform
      const item = items.find(i => i.id === itemId);
      if (item) {
        setSelections(prev => ({
          ...prev,
          [itemId]: item.recommendedPlatform
        }));
      }
    } else {
      newSelectedItems.delete(itemId);
      setSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[itemId];
        return newSelections;
      });
    }
    setSelectedItems(newSelectedItems);
  };

  const handlePlatformChange = (itemId: string, platform: 'jiomart' | 'bigbasket') => {
    setSelections(prev => ({
      ...prev,
      [itemId]: platform
    }));
  };

  const handleAddToCart = () => {
    const finalSelections: Record<string, 'jiomart' | 'bigbasket'> = {};
    selectedItems.forEach(itemId => {
      if (selections[itemId]) {
        finalSelections[itemId] = selections[itemId];
      }
    });
    onCartAutomation(finalSelections);
  };

  const totalSavings = items.reduce((sum, item) => {
    if (selectedItems.has(item.id)) {
      return sum + item.savings;
    }
    return sum;
  }, 0);

  const selectedCount = selectedItems.size;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-primary" />
              <span>Price Comparison Results</span>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {items.length} items found
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">₹{totalSavings}</div>
              <div className="text-sm text-muted-foreground">Total Potential Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{selectedCount}</div>
              <div className="text-sm text-muted-foreground">Items Selected</div>
            </div>
            <div className="text-center">
              <Button
                onClick={handleAddToCart}
                disabled={selectedCount === 0 || isLoading}
                className="bg-gradient-primary text-white px-6 py-2"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Carts ({selectedCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid gap-4">
        {items.map((item) => {
          const isSelected = selectedItems.has(item.id);
          const selectedPlatform = selections[item.id];
          const jioMartBetter = item.jioMartPrice < item.bigBasketPrice;
          
          return (
            <Card 
              key={item.id} 
              className={cn(
                "transition-all duration-300 hover:shadow-elegant",
                isSelected && "ring-2 ring-primary/50 bg-primary/5"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleItemSelect(item.id, checked as boolean)}
                    className="mt-1"
                  />

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {item.item}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <Badge 
                        variant={item.recommendedPlatform === 'jiomart' ? 'default' : 'secondary'}
                        className="ml-4"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Best: {item.recommendedPlatform === 'jiomart' ? 'JioMart' : 'BigBasket'}
                      </Badge>
                    </div>

                    {/* Price Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* JioMart */}
                      <div className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        jioMartBetter ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border",
                        selectedPlatform === 'jiomart' && "ring-2 ring-primary"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-600">JioMart</span>
                          {jioMartBetter && <Check className="w-4 h-4 text-green-600" />}
                        </div>
                        <div className="text-2xl font-bold">₹{item.jioMartPrice}</div>
                        {item.jioMartPrice > 0 && (
                          <Button variant="outline" size="sm" className="mt-2 w-full">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Product
                          </Button>
                        )}
                      </div>

                      {/* BigBasket */}
                      <div className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        !jioMartBetter ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-border",
                        selectedPlatform === 'bigbasket' && "ring-2 ring-primary"
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-green-600">BigBasket</span>
                          {!jioMartBetter && <Check className="w-4 h-4 text-green-600" />}
                        </div>
                        <div className="text-2xl font-bold">₹{item.bigBasketPrice}</div>
                        {item.bigBasketPrice > 0 && (
                          <Button variant="outline" size="sm" className="mt-2 w-full">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Product
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Platform Selection */}
                    {isSelected && (
                      <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium">Add to cart on:</span>
                        <Select
                          value={selectedPlatform}
                          onValueChange={(value) => handlePlatformChange(item.id, value as 'jiomart' | 'bigbasket')}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="Choose platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jiomart">
                              JioMart (₹{item.jioMartPrice})
                            </SelectItem>
                            <SelectItem value="bigbasket">
                              BigBasket (₹{item.bigBasketPrice})
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant="outline" className="text-green-600">
                          Save ₹{item.savings}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};