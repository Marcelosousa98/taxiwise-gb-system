
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import type { StatusType } from '@/types/maintenance';

interface ViewMaintenanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMaintenance: any;
}

export const ViewMaintenanceDialog: React.FC<ViewMaintenanceDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedMaintenance,
}) => {
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      if (!selectedMaintenance?.veiculo_id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('veiculos')
          .select('*')
          .eq('id', selectedMaintenance.veiculo_id)
          .single();
          
        if (error) throw error;
        setVehicleDetails(data);
      } catch (error) {
        console.error('Erro ao buscar detalhes do veículo:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && selectedMaintenance) {
      fetchVehicleDetails();
    }
  }, [isOpen, selectedMaintenance]);

  if (!selectedMaintenance) return null;

  const status = selectedMaintenance.status as StatusType;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Manutenção</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
            <p className="font-semibold">{selectedMaintenance.descricao}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Data</h3>
              <p>{format(new Date(selectedMaintenance.data_manutencao), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <StatusBadge status={status} />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Veículo</h3>
            {loading ? (
              <div className="h-5 w-20 animate-pulse bg-muted rounded"></div>
            ) : vehicleDetails ? (
              <p className="font-medium">{vehicleDetails.modelo} ({vehicleDetails.placa})</p>
            ) : (
              <p className="text-muted-foreground">Não disponível</p>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Custo</h3>
            <p>
              {selectedMaintenance.custo 
                ? `${selectedMaintenance.custo.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}` 
                : 'Não definido'
              }
            </p>
          </div>
          
          {selectedMaintenance.notas && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Notas</h3>
              <p className="text-sm whitespace-pre-line">{selectedMaintenance.notas}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Criado em</h3>
              <p className="text-sm">{format(new Date(selectedMaintenance.criado_em), 'dd/MM/yyyy HH:mm')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Atualizado em</h3>
              <p className="text-sm">{format(new Date(selectedMaintenance.atualizado_em), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
