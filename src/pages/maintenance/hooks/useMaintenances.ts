
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { addMonths, isAfter, isBefore } from 'date-fns';

interface Vehicle {
  id: string;
  modelo: string;
  placa: string;
  [key: string]: any;
}

interface Maintenance {
  id: string;
  veiculo_id: string;
  descricao: string;
  data_manutencao: string;
  status: string;
  custo: number | null;
  notas: string | null;
  veiculos?: Vehicle | null;
  [key: string]: any;
}

export const useMaintenances = (maintenanceId: string | null) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .eq('status', 'ativo');
        
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    }
  };

  // Fetch maintenances
  const fetchMaintenances = async () => {
    setLoading(true);
    try {
      const { data: manutencoes, error } = await supabase
        .from('manutencoes')
        .select('*, veiculos(*)')
        .order('data_manutencao', { ascending: false });
        
      if (error) throw error;
      setMaintenances(manutencoes || []);
      
      // If viewing a maintenance by ID, set it as the selected one
      if (maintenanceId && manutencoes) {
        const maintenance = manutencoes.find(m => m.id === maintenanceId);
        if (maintenance) {
          setSelectedMaintenance(maintenance);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if maintenance is overdue
  const isMaintenanceOverdue = (date: Date) => {
    return isBefore(new Date(date), new Date()) ? "atrasado" : "agendado";
  };
  
  // Check if vehicle needs maintenance soon
  const needsMaintenanceSoon = (vehicleId: string) => {
    const vehicleMaintenances = maintenances.filter(m => 
      m.veiculo_id === vehicleId && m.status === 'completo'
    );
    
    if (vehicleMaintenances.length === 0) return true;
    
    // Find the most recent maintenance
    const lastMaintenance = vehicleMaintenances.reduce((latest, current) => {
      return new Date(current.data_manutencao) > new Date(latest.data_manutencao) ? current : latest;
    }, vehicleMaintenances[0]);
    
    const twoMonthsAfterLastMaintenance = addMonths(new Date(lastMaintenance.data_manutencao), 2);
    return isAfter(new Date(), twoMonthsAfterLastMaintenance);
  };

  // Setup initial data load and realtime subscription
  useEffect(() => {
    fetchVehicles();
    fetchMaintenances();

    // Setup real-time subscription
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manutencoes'
        },
        () => {
          fetchMaintenances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [maintenanceId]);

  return {
    vehicles,
    maintenances,
    selectedMaintenance,
    setSelectedMaintenance,
    loading,
    isMaintenanceOverdue,
    needsMaintenanceSoon,
    fetchMaintenances
  };
};
