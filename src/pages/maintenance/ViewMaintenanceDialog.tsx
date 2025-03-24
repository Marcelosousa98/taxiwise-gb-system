
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, Edit } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { supabase } from '@/integrations/supabase/client';

interface Maintenance {
  id: string;
  descricao: string;
  data_manutencao: string;
  status: string;
  custo: number | null;
  notas: string | null;
  veiculos?: {
    modelo: string;
    placa: string;
  } | null;
  [key: string]: any;
}

interface ViewMaintenanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: Maintenance | null;
  onEdit: (maintenance: Maintenance) => void;
}

export const ViewMaintenanceDialog: React.FC<ViewMaintenanceDialogProps> = ({
  isOpen,
  onOpenChange,
  maintenance,
  onEdit,
}) => {
  const markAsComplete = async () => {
    if (!maintenance) return;
    
    try {
      const { error } = await supabase
        .from('manutencoes')
        .update({ status: 'completo' })
        .eq('id', maintenance.id);
        
      if (error) throw error;
      
      toast.success('Manutenção marcada como completa!');
      
      // Update the maintenance object locally
      maintenance.status = 'completo';
    } catch (error: any) {
      console.error('Erro ao atualizar status da manutenção:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  if (!maintenance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span>Detalhes da Manutenção</span>
            <StatusBadge 
              status={maintenance.status} 
              className="ml-2" 
            />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Veículo</h3>
              <p className="font-semibold">
                {maintenance.veiculos ? 
                  `${maintenance.veiculos.modelo} (${maintenance.veiculos.placa})` : 
                  "Veículo não encontrado"}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Data</h3>
              <p className="font-semibold">
                {format(new Date(maintenance.data_manutencao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
            <p>{maintenance.descricao}</p>
          </div>
          
          {maintenance.custo !== null && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Custo</h3>
              <p className="font-semibold">{new Intl.NumberFormat('pt-AO').format(maintenance.custo)} AO</p>
            </div>
          )}
          
          {maintenance.notas && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Notas</h3>
              <p>{maintenance.notas}</p>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              
              <div className="space-x-2">
                {maintenance.status !== "completo" && (
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={markAsComplete}
                  >
                    <Check className="h-4 w-4" />
                    Marcar como Completa
                  </Button>
                )}
                <Button 
                  variant="default" 
                  className="gap-2"
                  onClick={() => onEdit(maintenance)}
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
