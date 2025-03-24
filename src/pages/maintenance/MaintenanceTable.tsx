
import React from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import type { StatusType } from '@/types/maintenance';

interface MaintenanceTableProps {
  maintenances: any[];
  loading: boolean;
  onView: (maintenance: any) => void;
  onEdit: (maintenance: any) => void;
  onDelete: (maintenance: any) => void;
  searchTerm: string;
  statusFilter: string | undefined;
  vehicleFilter: string | undefined;
  refetchMaintenances: () => void;
}

export const MaintenanceTable: React.FC<MaintenanceTableProps> = ({
  maintenances,
  loading,
  onView,
  onEdit,
  onDelete,
  searchTerm,
  statusFilter,
  vehicleFilter,
  refetchMaintenances,
}) => {
  const filteredMaintenances = maintenances.filter(maintenance => {
    // Filtrar por termo de pesquisa
    if (searchTerm && !maintenance.descricao.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrar por status
    if (statusFilter && maintenance.status !== statusFilter) {
      return false;
    }
    
    // Filtrar por veículo
    if (vehicleFilter && maintenance.veiculo_id !== vehicleFilter) {
      return false;
    }
    
    return true;
  });

  const handleStatusChange = async (maintenanceId: string, newStatus: StatusType) => {
    try {
      const { error } = await supabase
        .from('manutencoes')
        .update({ status: newStatus })
        .eq('id', maintenanceId);
        
      if (error) throw error;
      
      toast.success('Status atualizado com sucesso!');
      refetchMaintenances();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (filteredMaintenances.length === 0) {
    return (
      <EmptyState
        title="Nenhuma manutenção encontrada"
        description={
          searchTerm || statusFilter || vehicleFilter
            ? "Tente ajustar os filtros para ver mais resultados."
            : "Cadastre sua primeira manutenção para começar."
        }
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-primary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMaintenances.map((maintenance) => {
            const status = maintenance.status as StatusType;
            
            return (
              <TableRow key={maintenance.id}>
                <TableCell className="font-medium">{maintenance.descricao}</TableCell>
                <TableCell>{maintenance.veiculo?.modelo || '-'}</TableCell>
                <TableCell>{format(new Date(maintenance.data_manutencao), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  {maintenance.custo 
                    ? `${maintenance.custo.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}` 
                    : '-'
                  }
                </TableCell>
                <TableCell>
                  <StatusBadge status={status} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(maintenance)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(maintenance)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {status !== 'em_progresso' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(maintenance.id, 'em_progresso')}>
                          Marcar como Em Progresso
                        </DropdownMenuItem>
                      )}
                      
                      {status !== 'concluido' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(maintenance.id, 'concluido')}>
                          Marcar como Concluído
                        </DropdownMenuItem>
                      )}
                      
                      {status !== 'cancelado' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(maintenance.id, 'cancelado')}>
                          Marcar como Cancelado
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
