import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceComparisonItem {
  id: string;
  item: string;
  quantity: string;
  jioMartPrice: number;
  bigBasketPrice: number;
  recommendedPlatform: 'jiomart' | 'bigbasket';
  savings: number;
}

interface PriceComparisonTableProps {
  items: PriceComparisonItem[];
  className?: string;
}

export const PriceComparisonTable = ({ items, className }: PriceComparisonTableProps) => {
  const totalSavings = items.reduce((sum, item) => sum + item.savings, 0);
  const totalJioMart = items.reduce((sum, item) => sum + (item.recommendedPlatform === 'jiomart' ? Math.min(item.jioMartPrice, item.bigBasketPrice) : item.jioMartPrice), 0);
  const totalBigBasket = items.reduce((sum, item) => sum + (item.recommendedPlatform === 'bigbasket' ? Math.min(item.jioMartPrice, item.bigBasketPrice) : item.bigBasketPrice), 0);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Price Comparison Results
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span>JioMart</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-secondary"></div>
            <span>BigBasket</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Item</TableHead>
                <TableHead className="font-semibold">Quantity</TableHead>
                <TableHead className="font-semibold text-center">JioMart</TableHead>
                <TableHead className="font-semibold text-center">BigBasket</TableHead>
                <TableHead className="font-semibold text-center">Best Choice</TableHead>
                <TableHead className="font-semibold text-center">Savings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{item.item}</TableCell>
                  <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "flex items-center justify-center gap-1 font-medium",
                      item.recommendedPlatform === 'jiomart' && item.jioMartPrice < item.bigBasketPrice ? "text-primary" : "text-muted-foreground"
                    )}>
                      <IndianRupee className="w-3 h-3" />
                      {item.jioMartPrice}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "flex items-center justify-center gap-1 font-medium",
                      item.recommendedPlatform === 'bigbasket' && item.bigBasketPrice < item.jioMartPrice ? "text-secondary" : "text-muted-foreground"
                    )}>
                      <IndianRupee className="w-3 h-3" />
                      {item.bigBasketPrice}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={item.recommendedPlatform === 'jiomart' ? 'default' : 'secondary'}
                      className={cn(
                        "font-medium",
                        item.recommendedPlatform === 'jiomart' ? "bg-primary" : "bg-secondary"
                      )}
                    >
                      {item.recommendedPlatform === 'jiomart' ? 'JioMart' : 'BigBasket'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 font-medium text-green-600">
                      <IndianRupee className="w-3 h-3" />
                      {item.savings}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-primary/10 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Savings:</span>
            <div className="flex items-center gap-1 text-green-600">
              <IndianRupee className="w-5 h-5" />
              <span>{totalSavings}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            By choosing the best platform for each item, you save ₹{totalSavings} on your total grocery bill!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};