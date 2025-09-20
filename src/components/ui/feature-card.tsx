import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
  gradient?: boolean;
}

export const FeatureCard = ({ 
  title, 
  description, 
  icon: Icon, 
  className,
  gradient = false 
}: FeatureCardProps) => {
  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 border-border/50",
      gradient && "bg-gradient-primary text-primary-foreground border-0",
      className
    )}>
      <CardHeader className="pb-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mb-4",
          gradient ? "bg-white/20" : "bg-primary/10"
        )}>
          <Icon className={cn(
            "w-6 h-6",
            gradient ? "text-white" : "text-primary"
          )} />
        </div>
        <CardTitle className={cn(
          "text-xl font-semibold",
          gradient ? "text-white" : "text-foreground"
        )}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn(
          "text-sm leading-relaxed",
          gradient ? "text-white/90" : "text-muted-foreground"
        )}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};