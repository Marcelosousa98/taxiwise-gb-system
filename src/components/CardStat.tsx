
import React from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface CardStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export const CardStat = ({ 
  title, 
  value, 
  icon, 
  trend, 
  className 
}: CardStatProps) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
          
          {trend && (
            <div className="flex items-center mt-1.5">
              <span 
                className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  );
};
