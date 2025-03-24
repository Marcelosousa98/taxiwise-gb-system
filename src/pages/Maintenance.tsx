
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, addMonths, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, Filter, Search, Car as CarIcon, Calendar as CalendarIcon, AlertTriangle,
  Check, X, FileText, ChevronDown, ChevronUp, Car, Trash2, Edit
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';

import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';

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
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Label } from '@/components/ui/label';

import { supabase } from '@/integrations/supabase/client';

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
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  // State for the maintenance being viewed or edited
  const [selectedMaintenance, setSelectedMaintenance] = useState<any>(null);

  // Fetch real vehicles from Supabase
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
      toast.error('Não foi possível carregar os veículos');
    }
  };

  // Fetch real maintenances from Supabase
  const fetchMaintenances = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manutencoes')
        .select('*, veiculos!inner(*)')
        .order('data_manutencao', { ascending: false });
        
      if (error) throw error;
      setMaintenances(data || []);
      
      // If viewing a maintenance by ID, set it as the selected one
      if (maintenanceId && data) {
        const maintenance = data.find(m => m.id === maintenanceId);
        if (maintenance) {
          setSelectedMaintenance(maintenance);
          setIsViewDialogOpen(true);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
      toast.error('Não foi possível carregar as manutenções');
    } finally {
      setLoading(false);
    }
  };

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
  
  // Handle form submission for adding or editing
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
      
      if (isEditDialogOpen) {
        // Update existing maintenance
        result = await supabase
          .from('manutencoes')
          .update(maintenanceData)
          .eq('id', formData.id)
          .select();
          
        if (result.error) throw result.error;
        toast.success('Manutenção atualizada com sucesso!');
        setIsEditDialogOpen(false);
      } else {
        // Add new maintenance
        result = await supabase
          .from('manutencoes')
          .insert([maintenanceData])
          .select();
          
        if (result.error) throw result.error;
        toast.success('Manutenção agendada com sucesso!');
        setIsAddDialogOpen(false);
      }
      
      // Reset form
      setFormData({
        id: "",
        vehicleId: "",
        date: new Date(),
        description: "",
        notes: "",
        status: "agendado",
        cost: "",
      });
    } catch (error: any) {
      console.error('Erro ao salvar manutenção:', error);
      toast.error(error.message || 'Erro ao salvar manutenção');
    }
  };
  
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
  };
  
  // Handle deleting a maintenance
  const handleDeleteMaintenance = (maintenance: any) => {
    setSelectedMaintenance(maintenance);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm and execute maintenance deletion
  const confirmDeleteMaintenance = async () => {
    if (!selectedMaintenance) return;
    
    try {
      const { error } = await supabase
        .from('manutencoes')
        .delete()
        .eq('id', selectedMaintenance.id);
        
      if (error) throw error;
      
      toast.success('Manutenção excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedMaintenance(null);

      // If we were viewing the maintenance, close the view dialog
      if (isViewDialogOpen) {
        setIsViewDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Erro ao excluir manutenção:', error);
      toast.error(error.message || 'Erro ao excluir manutenção');
    }
  };
  
  // Mark maintenance as complete
  const markMaintenanceAsComplete = async (maintenance: any) => {
    try {
      const { error } = await supabase
        .from('manutencoes')
        .update({ status: 'completo' })
        .eq('id', maintenance.id);
        
      if (error) throw error;
      
      toast.success('Manutenção marcada como completa!');
      
      // If viewing details, update the selected maintenance
      if (isViewDialogOpen && selectedMaintenance?.id === maintenance.id) {
        setSelectedMaintenance({
          ...selectedMaintenance,
          status: 'completo'
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar status da manutenção:', error);
      toast.error(error.message || 'Erro ao atualizar status');
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
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredMaintenances.length > 0 ? (
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
                  {filteredMaintenances.map((maintenance) => (
                    <TableRow key={maintenance.id}>
                      <TableCell className="font-medium">
                        {maintenance.veiculos ? (
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                              <Car className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div>{maintenance.veiculos.modelo}</div>
                              <div className="text-xs text-muted-foreground">{maintenance.veiculos.placa}</div>
                            </div>
                          </div>
                        ) : (
                          "Veículo não encontrado"
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(maintenance.data_manutencao), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{maintenance.descricao}</TableCell>
                      <TableCell>
                        <StatusBadge status={maintenance.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleViewMaintenance(maintenance)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleEditMaintenance(maintenance)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {maintenance.status !== 'completo' && (
                              <DropdownMenuItem
                                onClick={() => markMaintenanceAsComplete(maintenance)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Marcar como completa
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteMaintenance(maintenance)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
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
      
      {/* Add/Edit Maintenance Dialog */}
      <Dialog 
        open={isAddDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (isAddDialogOpen) setIsAddDialogOpen(open);
          if (isEditDialogOpen) setIsEditDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Editar Manutenção" : "Agendar Nova Manutenção"}
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
                onClick={() => {
                  if (isAddDialogOpen) setIsAddDialogOpen(false);
                  if (isEditDialogOpen) setIsEditDialogOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {isEditDialogOpen ? "Salvar Alterações" : "Agendar Manutenção"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Maintenance Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedMaintenance && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <span>Detalhes da Manutenção</span>
                  <StatusBadge 
                    status={selectedMaintenance.status} 
                    className="ml-2" 
                  />
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Veículo</h3>
                    <p className="font-semibold">
                      {selectedMaintenance.veiculos ? 
                        `${selectedMaintenance.veiculos.modelo} (${selectedMaintenance.veiculos.placa})` : 
                        "Veículo não encontrado"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Data</h3>
                    <p className="font-semibold">
                      {format(new Date(selectedMaintenance.data_manutencao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                  <p>{selectedMaintenance.descricao}</p>
                </div>
                
                {selectedMaintenance.custo !== null && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Custo</h3>
                    <p className="font-semibold">{new Intl.NumberFormat('pt-AO').format(selectedMaintenance.custo)} AO</p>
                  </div>
                )}
                
                {selectedMaintenance.notas && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Notas</h3>
                    <p>{selectedMaintenance.notas}</p>
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                      Fechar
                    </Button>
                    
                    <div className="space-x-2">
                      {selectedMaintenance.status !== "completo" && (
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => markMaintenanceAsComplete(selectedMaintenance)}
                        >
                          <Check className="h-4 w-4" />
                          Marcar como Completa
                        </Button>
                      )}
                      <Button 
                        variant="default" 
                        className="gap-2"
                        onClick={() => handleEditMaintenance(selectedMaintenance)}
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-3 rounded-md">
            {selectedMaintenance && selectedMaintenance.veiculos && (
              <div>
                <p className="font-medium">{selectedMaintenance.descricao}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMaintenance.veiculos.modelo} ({selectedMaintenance.veiculos.placa}) - 
                  {format(new Date(selectedMaintenance.data_manutencao), " dd/MM/yyyy")}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteMaintenance}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default MaintenancePage;
