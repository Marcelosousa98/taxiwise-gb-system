
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Car } from 'lucide-react';

import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { MaintenanceFilters } from './maintenance/MaintenanceFilters';
import { MaintenanceTable } from './maintenance/MaintenanceTable';
import { ViewMaintenanceDialog } from './maintenance/ViewMaintenanceDialog';
import { AddEditMaintenanceDialog } from './maintenance/AddEditMaintenanceDialog';
import { DeleteMaintenanceDialog } from './maintenance/DeleteMaintenanceDialog';
import { useMaintenances } from './maintenance/hooks/useMaintenances';

const MaintenancePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const maintenanceId = searchParams.get('id');
  
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(!!maintenanceId);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form state for adding/editing
  const [formData, setFormData] = useState({
    id: "",
    vehicleId: "",
    date: new Date(),
    description: "",
    notes: "",
    status: "agendado",
    cost: "",
  });
  
  const { 
    vehicles, 
    maintenances, 
    selectedMaintenance, 
    setSelectedMaintenance, 
    loading, 
    needsMaintenanceSoon 
  } = useMaintenances(maintenanceId);
  
  // Filter maintenances based on active tab, search, and filters
  const filteredMaintenances = maintenances
    .filter(maintenance => {
      // Filter by tab
      if (activeTab === "upcoming" && maintenance.status !== "agendado") return false;
      if (activeTab === "completed" && maintenance.status !== "completo") return false;
      if (activeTab === "overdue" && maintenance.status !== "atrasado") return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleMatch = maintenance.veiculos ? 
          `${maintenance.veiculos.modelo} ${maintenance.veiculos.placa}`.toLowerCase().includes(searchLower) : 
          false;
        const descriptionMatch = maintenance.descricao.toLowerCase().includes(searchLower);
        
        if (!vehicleMatch && !descriptionMatch) return false;
      }
      
      // Filter by status
      if (statusFilter && maintenance.status !== statusFilter) return false;
      
      // Filter by date
      if (selectedDate) {
        const maintenanceDate = new Date(maintenance.data_manutencao);
        return (
          maintenanceDate.getDate() === selectedDate.getDate() &&
          maintenanceDate.getMonth() === selectedDate.getMonth() &&
          maintenanceDate.getFullYear() === selectedDate.getFullYear()
        );
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.data_manutencao).getTime() - new Date(a.data_manutencao).getTime());
  
  // Handle viewing a maintenance
  const handleViewMaintenance = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setIsViewDialogOpen(true);
  };
  
  // Handle editing a maintenance
  const handleEditMaintenance = (maintenance: any) => {
    setFormData({
      id: maintenance.id,
      vehicleId: maintenance.veiculo_id,
      date: new Date(maintenance.data_manutencao),
      description: maintenance.descricao,
      notes: maintenance.notas || "",
      status: maintenance.status,
      cost: maintenance.custo ? String(maintenance.custo) : "",
    });
    setIsEditDialogOpen(true);
    setIsViewDialogOpen(false);
  };
  
  // Handle deleting a maintenance
  const handleDeleteMaintenance = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle after successful deletion
  const handleMaintenanceDeleted = () => {
    // If we were viewing the maintenance, close the view dialog
    if (isViewDialogOpen) {
      setIsViewDialogOpen(false);
    }
    setSelectedMaintenance(null);
  };

  return (
    <PageTransition>
      <PageHeader 
        title="Manutenção de Veículos" 
        description="Gerencie a manutenção periódica da sua frota"
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Manutenção
        </Button>
      </PageHeader>
      
      <MaintenanceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="upcoming">Agendadas</TabsTrigger>
          <TabsTrigger value="completed">Completas</TabsTrigger>
          <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredMaintenances.length > 0 ? (
            <MaintenanceTable 
              maintenances={filteredMaintenances}
              onView={handleViewMaintenance}
              onEdit={handleEditMaintenance}
              onDelete={handleDeleteMaintenance}
            />
          ) : (
            <EmptyState
              title="Nenhuma manutenção encontrada"
              description={
                searchTerm || statusFilter || selectedDate
                  ? "Tente ajustar os filtros para ver mais resultados."
                  : "Agende sua primeira manutenção para começar."
              }
              action={
                !searchTerm && !statusFilter && !selectedDate
                  ? {
                      label: "Agendar Manutenção",
                      onClick: () => setIsAddDialogOpen(true),
                    }
                  : undefined
              }
              icon={<Car className="h-7 w-7 text-primary" />}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Maintenance Dialog */}
      <AddEditMaintenanceDialog 
        isOpen={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (isAddDialogOpen) setIsAddDialogOpen(open);
          if (isEditDialogOpen) setIsEditDialogOpen(open);
        }}
        formData={formData}
        setFormData={setFormData}
        vehicles={vehicles}
        isEditing={isEditDialogOpen}
        needsMaintenanceSoon={needsMaintenanceSoon}
      />
      
      {/* View Maintenance Dialog */}
      <ViewMaintenanceDialog 
        isOpen={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        maintenance={selectedMaintenance}
        onEdit={handleEditMaintenance}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteMaintenanceDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        maintenance={selectedMaintenance}
        onDeleted={handleMaintenanceDeleted}
      />
    </PageTransition>
  );
};

export default MaintenancePage;
