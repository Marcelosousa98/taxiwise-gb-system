
import React from 'react';
import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Users } from 'lucide-react';

const Drivers = () => {
  return (
    <PageTransition>
      <PageHeader 
        title="Motoristas" 
        description="Gerencie os motoristas da sua frota"
      />
      
      <EmptyState
        title="Página em desenvolvimento"
        description="Esta funcionalidade estará disponível em breve."
        icon={<Users className="h-10 w-10 text-primary" />}
      />
    </PageTransition>
  );
};

export default Drivers;
