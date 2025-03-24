import React, { useState, useEffect } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { Car, Search, Plus, Filter, ChevronDown, ChevronUp, MoreHorizontal, Trash2, Edit, Eye, UserPlus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { supabase } from '@/integrations/supabase/client';

const Vehicles = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAssignDriverDialogOpen, setIsAssignDriverDialogOpen] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehiclesWithDrivers, setVehiclesWithDrivers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | undefined>(undefined);
  const [currentDriver, setCurrentDriver] = useState<any>(null);
  const [formData, setFormData] = useState({
    modelo: "",
    placa: "",
    ano: new Date().getFullYear(),
    status: "ativo"
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .select('*')
        .order('criado_em', { ascending: false });
        
      if (error) throw error;
      setVehicles(data || []);
      
      if (data && data.length > 0) {
        await fetchDriversForVehicles(data);
      }
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      toast.error('Erro ao buscar veículos');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriversForVehicles = async (vehicles: any[]) => {
    try {
      const { data: drivers, error } = await supabase
        .from('motoristas')
        .select('*');
        
      if (error) throw error;
      
      const vehiclesWithDriverInfo = vehicles.map(vehicle => {
        const assignedDriver = drivers?.find(driver => driver.veiculo_id === vehicle.id);
        return {
          ...vehicle,
          driver: assignedDriver || null
        };
      });
      
      setVehiclesWithDrivers(vehiclesWithDriverInfo);
    } catch (error) {
      console.error('Erro ao buscar motoristas para veículos:', error);
    }
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const { data, error } = await supabase
        .from('motoristas')
        .select('*')
        .eq('status', 'ativo');
        
      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
      toast.error('Erro ao buscar motoristas');
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchCurrentDriver = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('motoristas')
        .select('*')
        .eq('veiculo_id', vehicleId)
        .maybeSingle();
        
      if (error) throw error;
      setCurrentDriver(data);
    } catch (error) {
      console.error('Erro ao buscar motorista atual:', error);
      setCurrentDriver(null);
    }
  };

  useEffect(() => {
    fetchVehicles();

    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'veiculos'
        },
        () => {
          fetchVehicles();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'motoristas'
        },
        () => {
          if (selectedVehicle) {
            fetchCurrentDriver(selectedVehicle.id);
          }
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isAssignDriverDialogOpen) {
      fetchDrivers();
      if (selectedVehicle) {
        fetchCurrentDriver(selectedVehicle.id);
      }
    }
  }, [isAssignDriverDialogOpen, selectedVehicle]);

  const filteredVehicles = vehiclesWithDrivers.filter(vehicle => {
    if (searchTerm && !`${vehicle.modelo} ${vehicle.placa}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (statusFilter && vehicle.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('veiculos')
        .insert([
          {
            modelo: formData.modelo,
            placa: formData.placa,
            ano: formData.ano,
            status: formData.status
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success('Veículo cadastrado com sucesso!');
      setIsAddDialogOpen(false);
      
      setFormData({
        modelo: "",
        placa: "",
        ano: new Date().getFullYear(),
        status: "ativo"
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar veículo:', error);
      toast.error(error.message || 'Erro ao cadastrar veículo');
    }
  };

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    
    try {
      const { error } = await supabase
        .from('veiculos')
        .delete()
        .eq('id', selectedVehicle.id);
        
      if (error) throw error;
      
      toast.success('Veículo excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedVehicle(null);
    } catch (error: any) {
      console.error('Erro ao excluir veículo:', error);
      toast.error(error.message || 'Erro ao excluir veículo');
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedVehicle || !selectedDriver) return;
    
    try {
      if (currentDriver) {
        const { error: unassignError } = await supabase
          .from('motoristas')
          .update({ veiculo_id: null })
          .eq('id', currentDriver.id);
          
        if (unassignError) throw unassignError;
      }
      
      const { error } = await supabase
        .from('motoristas')
        .update({ veiculo_id: selectedVehicle.id })
        .eq('id', selectedDriver);
        
      if (error) throw error;
      
      toast.success('Motorista atribuído com sucesso!');
      setIsAssignDriverDialogOpen(false);
      setSelectedDriver(undefined);
    } catch (error: any) {
      console.error('Erro ao atribuir motorista:', error);
      toast.error(error.message || 'Erro ao atribuir motorista');
    }
  };

  const handleView = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsViewDialogOpen(true);
    fetchCurrentDriver(vehicle.id);
  };

  const handleAssign = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsAssignDriverDialogOpen(true);
  };

  const handleDeleteConfirm = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const availableDrivers = drivers.filter(driver => 
    driver.veiculo_id === null || (currentDriver && driver.id === currentDriver.id)
  );

  return (
    <PageTransition>
      <PageHeader 
        title="Veículos" 
        description="Gerencie os veículos da sua frota"
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Veículo
        </Button>
      </PageHeader>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por modelo, placa..."
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
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredVehicles.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                        <Car className="h-4 w-4 text-primary" />
                      </div>
                      {vehicle.modelo}
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.placa}</TableCell>
                  <TableCell>{vehicle.ano}</TableCell>
                  <TableCell>
                    {vehicle.driver ? (
                      <div className="flex items-center">
                        <span className="font-medium">{vehicle.driver.nome}</span>
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-7"
                          onClick={() => handleAssign(vehicle)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-muted-foreground">Não atribuído</span>
                        <Button 
                          variant="ghost"
                          size="sm" 
                          className="ml-1 h-7"
                          onClick={() => handleAssign(vehicle)}
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vehicle.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(vehicle)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssign(vehicle)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Atribuir motorista
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteConfirm(vehicle)}
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
          title="Nenhum veículo encontrado"
          description={
            searchTerm || statusFilter
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Cadastre seu primeiro veículo para começar."
          }
          action={
            !searchTerm && !statusFilter
              ? {
                  label: "Adicionar Veículo",
                  onClick: () => setIsAddDialogOpen(true),
                }
              : undefined
          }
          icon={<Car className="h-7 w-7 text-primary" />}
        />
      )}
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Veículo</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do veículo para adicionar à frota.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  placeholder="Ex: Toyota Corolla"
                  value={formData.modelo}
                  onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  placeholder="Ex: LD-54-32-AA"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                    required
                  />
                </div>
                
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
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar Veículo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedVehicle && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Veículo</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Modelo</h3>
                    <p className="font-semibold">{selectedVehicle.modelo}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Placa</h3>
                    <p className="font-semibold">{selectedVehicle.placa}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Ano</h3>
                    <p>{selectedVehicle.ano}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <StatusBadge status={selectedVehicle.status} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Motorista Atual</h3>
                  {currentDriver ? (
                    <div className="flex items-center">
                      <p className="font-semibold">{currentDriver.nome}</p>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8"
                        onClick={() => handleAssign(selectedVehicle)}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Mudar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <p className="text-muted-foreground">Nenhum motorista atribuído</p>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8"
                        onClick={() => handleAssign(selectedVehicle)}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1" />
                        Atribuir
                      </Button>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Cadastro</h3>
                  <p>{format(new Date(selectedVehicle.criado_em), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAssignDriverDialogOpen} onOpenChange={setIsAssignDriverDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Atribuir Motorista</DialogTitle>
            <DialogDescription>
              Selecione um motorista para atribuir a este veículo.
            </DialogDescription>
          </DialogHeader>
          
          {loadingDrivers ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : availableDrivers.length > 0 ? (
            <>
              <div className="space-y-4">
                {currentDriver && (
                  <div className="p-3 bg-muted rounded-md">
                    <h3 className="text-sm font-medium mb-1">Motorista atual</h3>
                    <p className="font-semibold">{currentDriver.nome}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="driver">Selecione o motorista</Label>
                  <Select 
                    value={selectedDriver} 
                    onValueChange={setSelectedDriver}
                  >
                    <SelectTrigger id="driver">
                      <SelectValue placeholder="Selecionar motorista" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDrivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignDriverDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAssignDriver} disabled={!selectedDriver}>
                  Atribuir Motorista
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-3">
                Não há motoristas disponíveis para atribuição.
              </p>
              <p className="text-sm text-muted-foreground">
                Cadastre novos motoristas ou libere motoristas já atribuídos a outros veículos.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-3 rounded-md">
            {selectedVehicle && (
              <p className="font-medium">{selectedVehicle.modelo} ({selectedVehicle.placa})</p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
};

export default Vehicles;
