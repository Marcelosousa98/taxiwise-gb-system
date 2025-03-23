
import React from 'react';
import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Receipt } from 'lucide-react';

const Finance = () => {
  return (
    <PageTransition>
      <PageHeader 
        title="Finanças" 
        description="Gerencie as finanças da sua empresa"
      />
      
      <EmptyState
        title="Página em desenvolvimento"
        description="Esta funcionalidade estará disponível em breve."
        icon={<Receipt className="h-10 w-10 text-primary" />}
      />
    </PageTransition>
  );
};

export default Finance;
