
import React from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { supabase } from '@/integrations/supabase/client';

interface Maintenance {
  id: string;
  descricao: string;
  data_manutencao: string;
  veiculos?: {
    modelo: string;
    placa: string;
  } | null;
  [key: string]: any;
}

interface DeleteMaintenanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: Maintenance | null;
  onDeleted: () => void;
}

export const DeleteMaintenanceDialog: React.FC<DeleteMaintenanceDialogProps> = ({
  isOpen,
  onOpenChange,
  maintenance,
  onDeleted,
}) => {
  const confirmDelete = async () => {
    if (!maintenance) return;
    
    try {
      const { error } = await supabase
        .from('manutencoes')
        .delete()
        .eq('id', maintenance.id);
        
      if (error) throw error;
      
      toast.success('Manutenção excluída com sucesso!');
      onOpenChange(false);
      onDeleted();
    } catch (error: any) {
      console.error('Erro ao excluir manutenção:', error);
      toast.error(error.message || 'Erro ao excluir manutenção');
    }
  };

  if (!maintenance) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted p-3 rounded-md">
          {maintenance && maintenance.veiculos && (
            <div>
              <p className="font-medium">{maintenance.descricao}</p>
              <p className="text-sm text-muted-foreground">
                {maintenance.veiculos.modelo} ({maintenance.veiculos.placa}) - 
                {format(new Date(maintenance.data_manutencao), " dd/MM/yyyy")}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
