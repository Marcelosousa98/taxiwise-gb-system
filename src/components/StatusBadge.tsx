
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import type { StatusType } from '@/types/maintenance';

interface StatusBadgeProps {
  status: StatusType | 'pendente' | 'completo' | 'atrasado' | 'ativo' | 'inativo';
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getVariant = () => {
    switch (status) {
      case 'pendente':
        return "bg-amber-100 text-amber-800 border-amber-200";
      case 'completo':
      case 'concluido':
        return "bg-green-100 text-green-800 border-green-200";
      case 'atrasado':
        return "bg-red-100 text-red-800 border-red-200";
      case 'agendado':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'em_progresso':
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 'ativo':
        return "bg-green-100 text-green-800 border-green-200";
      case 'inativo':
      case 'cancelado':
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Badge className={cn(
      "rounded-full px-2.5 py-0.5 font-medium text-xs", 
      getVariant(),
      className
    )}>
      {status === 'em_progresso' ? 'Em Progresso' : 
       status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};
