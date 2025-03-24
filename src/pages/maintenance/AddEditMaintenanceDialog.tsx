
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { supabase } from '@/integrations/supabase/client';

interface MaintenanceFormData {
  id: string;
  vehicleId: string;
  date: Date;
  description: string;
  notes: string;
  status: string;
  cost: string;
}

interface Vehicle {
  id: string;
  modelo: string;
  placa: string;
  [key: string]: any;
}

interface AddEditMaintenanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: MaintenanceFormData;
  setFormData: React.Dispatch<React.SetStateAction<MaintenanceFormData>>;
  vehicles: Vehicle[];
  isEditing: boolean;
  needsMaintenanceSoon: (vehicleId: string) => boolean;
}

export const AddEditMaintenanceDialog: React.FC<AddEditMaintenanceDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  vehicles,
  isEditing,
  needsMaintenanceSoon
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const maintenanceData = {
        veiculo_id: formData.vehicleId,
        descricao: formData.description,
        notas: formData.notes || null,
        data_manutencao: formData.date.toISOString(),
        custo: formData.cost ? parseFloat(formData.cost) : null,
        status: formData.status
      };
      
      let result;
      
      if (isEditing) {
        // Update existing maintenance
        result = await supabase
          .from('manutencoes')
          .update(maintenanceData)
          .eq('id', formData.id)
          .select();
          
        if (result.error) throw result.error;
        toast.success('Manutenção atualizada com sucesso!');
      } else {
        // Add new maintenance
        result = await supabase
          .from('manutencoes')
          .insert([maintenanceData])
          .select();
          
        if (result.error) throw result.error;
        toast.success('Manutenção agendada com sucesso!');
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar manutenção:', error);
      toast.error(error.message || 'Erro ao salvar manutenção');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Manutenção" : "Agendar Nova Manutenção"}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes da manutenção do veículo.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Veículo</Label>
              <Select 
                value={formData.vehicleId} 
                onValueChange={(value) => setFormData({ ...formData, vehicleId: value })}
                required
              >
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Selecionar veículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center gap-2">
                        <span>{vehicle.modelo}</span>
                        <span className="text-xs text-muted-foreground">
                          ({vehicle.placa})
                        </span>
                        {needsMaintenanceSoon(vehicle.id) && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {formData.date ? (
                      format(formData.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData({ ...formData, date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Manutenção regular de 40.000 km"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="completo">Completo</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cost">Custo (AO)</Label>
              <Input
                id="cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionais sobre a manutenção"
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? "Salvar Alterações" : "Agendar Manutenção"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
