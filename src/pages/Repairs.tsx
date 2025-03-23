
import React from 'react';
import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Wrench } from 'lucide-react';

const Repairs = () => {
  return (
    <PageTransition>
      <PageHeader 
        title="Reparações" 
        description="Gerencie as reparações dos veículos da sua frota"
      />
      
      <EmptyState
        title="Página em desenvolvimento"
        description="Esta funcionalidade estará disponível em breve."
        icon={<Wrench className="h-10 w-10 text-primary" />}
      />
    </PageTransition>
  );
};

export default Repairs;
