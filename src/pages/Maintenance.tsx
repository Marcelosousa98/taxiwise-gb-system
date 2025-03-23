
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addMonths, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, Filter, Search, Car as CarIcon, Calendar as CalendarIcon, AlertTriangle,
  Check, X, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { FileUpload } from '@/components/FileUpload';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { maintenances, vehicles, getVehicleById } from '@/data/mockData';
import { cn } from "@/lib/utils";

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
  
  // Form state for adding/editing
  const [formData, setFormData] = useState({
    vehicleId: "",
    date: new Date(),
    description: "",
    notes: "",
    status: "agendado",
    cost: "",
  });
  
  // State for the maintenance being viewed
  const [viewMaintenance, setViewMaintenance] = useState(
    maintenanceId ? maintenances.find(m => m.id === maintenanceId) : null
  );
  
  // Filter maintenances based on active tab, search, and filters
  const filteredMaintenances = maintenances
    .filter(maintenance => {
      const vehicle = getVehicleById(maintenance.vehicleId);
      
      // Filter by tab
      if (activeTab === "upcoming" && maintenance.status !== "agendado") return false;
      if (activeTab === "completed" && maintenance.status !== "completo") return false;
      if (activeTab === "overdue" && maintenance.status !== "atrasado") return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const vehicleMatch = vehicle ? 
          `${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate}`.toLowerCase().includes(searchLower) : 
          false;
        const descriptionMatch = maintenance.description.toLowerCase().includes(searchLower);
        
        if (!vehicleMatch && !descriptionMatch) return false;
      }
      
      // Filter by status
      if (statusFilter && maintenance.status !== statusFilter) return false;
      
      // Filter by date
      if (selectedDate) {
        const maintenanceDate = new Date(maintenance.date);
        return (
          maintenanceDate.getDate() === selectedDate.getDate() &&
          maintenanceDate.getMonth() === selectedDate.getMonth() &&
          maintenanceDate.getFullYear() === selectedDate.getFullYear()
        );
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast.success("Manutenção agendada com sucesso!");
    setIsAddDialogOpen(false);
    
    // Reset form
    setFormData({
      vehicleId: "",
      date: new Date(),
      description: "",
      notes: "",
      status: "agendado",
      cost: "",
    });
  };
  
  // Handle viewing a maintenance
  const handleViewMaintenance = (maintenance: typeof maintenances[0]) => {
    setViewMaintenance(maintenance);
    setIsViewDialogOpen(true);
  };
  
  // Check if maintenance is overdue
  const isMaintenanceOverdue = (date: Date) => {
    return isBefore(new Date(date), new Date()) ? "atrasado" : "agendado";
  };
  
  // Check if vehicle needs maintenance soon
  const needsMaintenanceSoon = (lastMaintenance?: Date) => {
    if (!lastMaintenance) return true;
    
    const twoMonthsAfterLastMaintenance = addMonths(new Date(lastMaintenance), 2);
    return isAfter(new Date(), twoMonthsAfterLastMaintenance);
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
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por veículo, descrição..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button
              variant="outline"
              className="flex items-center md:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {showFilters ? 
                <ChevronUp className="h-4 w-4 ml-2" /> : 
                <ChevronDown className="h-4 w-4 ml-2" />
              }
            </Button>
          </div>
          
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-1.5">
                      Status
                    </label>
                    <Select 
                      value={statusFilter} 
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecionar status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="agendado">Agendado</SelectItem>
                        <SelectItem value="completo">Completo</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Data
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {selectedDate ? (
                            format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecionar data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-end pb-0.5">
                    <Button
                      variant="ghost"
                      className="mr-2"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter(undefined);
                        setSelectedDate(undefined);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="upcoming">Agendadas</TabsTrigger>
          <TabsTrigger value="completed">Completas</TabsTrigger>
          <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {filteredMaintenances.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenances.map((maintenance) => {
                    const vehicle = getVehicleById(maintenance.vehicleId);
                    
                    return (
                      <TableRow key={maintenance.id}>
                        <TableCell className="font-medium">
                          {vehicle ? (
                            <div className="flex items-center">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                <Car className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <div>{vehicle.brand} {vehicle.model}</div>
                                <div className="text-xs text-muted-foreground">{vehicle.licensePlate}</div>
                              </div>
                            </div>
                          ) : (
                            "Veículo não encontrado"
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(maintenance.date), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{maintenance.description}</TableCell>
                        <TableCell>
                          <StatusBadge status={maintenance.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleViewMaintenance(maintenance)}
                              >
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem>Marcar como completa</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
      
      {/* Add Maintenance Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Agendar Nova Manutenção</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da manutenção do veículo.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="vehicle" className="block text-sm font-medium">
                  Veículo
                </label>
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
                          <span>{vehicle.brand} {vehicle.model}</span>
                          <span className="text-xs text-muted-foreground">
                            ({vehicle.licensePlate})
                          </span>
                          {needsMaintenanceSoon(vehicle.lastMaintenance) && (
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Data
                </label>
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
              <label htmlFor="description" className="block text-sm font-medium">
                Descrição
              </label>
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
                <label htmlFor="status" className="block text-sm font-medium">
                  Status
                </label>
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
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="cost" className="block text-sm font-medium">
                  Custo (AO)
                </label>
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
              <label htmlFor="notes" className="block text-sm font-medium">
                Notas
              </label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionais sobre a manutenção"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Agendar Manutenção</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Maintenance Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {viewMaintenance && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <span>Detalhes da Manutenção</span>
                  <StatusBadge 
                    status={viewMaintenance.status} 
                    className="ml-2" 
                  />
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Veículo</h3>
                    {(() => {
                      const vehicle = getVehicleById(viewMaintenance.vehicleId);
                      return (
                        <p className="font-semibold">
                          {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : "Veículo não encontrado"}
                        </p>
                      );
                    })()}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Data</h3>
                    <p className="font-semibold">
                      {format(new Date(viewMaintenance.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                  <p>{viewMaintenance.description}</p>
                </div>
                
                {viewMaintenance.cost && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Custo</h3>
                    <p className="font-semibold">{new Intl.NumberFormat('pt-AO').format(viewMaintenance.cost)} AO</p>
                  </div>
                )}
                
                {viewMaintenance.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Notas</h3>
                    <p>{viewMaintenance.notes}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                      Fechar
                    </Button>
                    
                    <div className="space-x-2">
                      {viewMaintenance.status !== "completo" && (
                        <Button variant="outline" className="gap-2">
                          <Check className="h-4 w-4" />
                          Marcar como Completa
                        </Button>
                      )}
                      <Button variant="default" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Gerar Relatório
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default MaintenancePage;
