
import React from 'react';
import { format } from 'date-fns';
import { Car, MoreHorizontal, Eye, Edit, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { supabase } from '@/integrations/supabase/client';

interface Maintenance {
  id: string;
  descricao: string;
  data_manutencao: string;
  status: string;
  veiculos?: {
    modelo: string;
    placa: string;
  } | null;
  [key: string]: any;
}

interface MaintenanceTableProps {
  maintenances: Maintenance[];
  onView: (maintenance: Maintenance) => void;
  onEdit: (maintenance: Maintenance) => void;
  onDelete: (maintenance: Maintenance) => void;
}

export const MaintenanceTable: React.FC<MaintenanceTableProps> = ({
  maintenances,
  onView,
  onEdit,
  onDelete,
}) => {
  const markMaintenanceAsComplete = async (maintenance: Maintenance) => {
    try {
      const { error } = await supabase
        .from('manutencoes')
        .update({ status: 'completo' })
        .eq('id', maintenance.id);
        
      if (error) throw error;
      
      toast.success('Manutenção marcada como completa!');
    } catch (error: any) {
      console.error('Erro ao atualizar status da manutenção:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Veículo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {maintenances.map((maintenance) => (
            <TableRow key={maintenance.id}>
              <TableCell className="font-medium">
                {maintenance.veiculos ? (
                  <div className="flex items-center">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div>{maintenance.veiculos.modelo}</div>
                      <div className="text-xs text-muted-foreground">{maintenance.veiculos.placa}</div>
                    </div>
                  </div>
                ) : (
                  "Veículo não encontrado"
                )}
              </TableCell>
              <TableCell>
                {format(new Date(maintenance.data_manutencao), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>{maintenance.descricao}</TableCell>
              <TableCell>
                <StatusBadge status={maintenance.status} />
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onView(maintenance)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onEdit(maintenance)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    {maintenance.status !== 'completo' && (
                      <DropdownMenuItem
                        onClick={() => markMaintenanceAsComplete(maintenance)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como completa
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => onDelete(maintenance)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
