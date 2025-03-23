
import React from 'react';
import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Car } from 'lucide-react';

const Vehicles = () => {
  return (
    <PageTransition>
      <PageHeader 
        title="Veículos" 
        description="Gerencie os veículos da sua frota"
      />
      
      <EmptyState
        title="Página em desenvolvimento"
        description="Esta funcionalidade estará disponível em breve."
        icon={<Car className="h-10 w-10 text-primary" />}
      />
    </PageTransition>
  );
};

export default Vehicles;
