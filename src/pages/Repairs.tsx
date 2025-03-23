
import React, { useState, useEffect } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { Wrench, Search, Plus, Filter, ChevronDown, ChevronUp, MoreHorizontal, Trash2, Edit, Eye, Car } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  DialogTitle 
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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';

import { supabase } from '@/integrations/supabase/client';

const Repairs = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedRepair, setSelectedRepair] = useState<any>(null);
  const [formData, setFormData] = useState({
    veiculo_id: "",
    descricao: "",
    tipo: "preventiva",
    preco: "",
    peca_substituida: "",
    data_reparacao: new Date(),
    oficina: "",
    status: "pendente"
  });

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reparacoes')
        .select('*, veiculos!inner(*)')
        .order('data_reparacao', { ascending: false });
        
      if (error) throw error;
      setRepairs(data || []);
    } catch (error) {
      console.error('Erro ao buscar reparações:', error);
      toast.error('Erro ao buscar reparações');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchRepairs();
    fetchVehicles();

    // Configurar assinatura em tempo real
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reparacoes'
        },
        () => {
          fetchRepairs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredRepairs = repairs.filter(repair => {
    // Filtrar por termo de pesquisa
    if (searchTerm && 
      !`${repair.veiculos.modelo} ${repair.veiculos.placa} ${repair.descricao}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrar por status
    if (statusFilter && repair.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('reparacoes')
        .insert([
          {
            veiculo_id: formData.veiculo_id,
            descricao: formData.descricao,
            tipo: formData.tipo,
            preco: parseFloat(formData.preco),
            peca_substituida: formData.peca_substituida || null,
            data_reparacao: formData.data_reparacao.toISOString(),
            oficina: formData.oficina || null,
            status: formData.status
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success('Reparação registrada com sucesso!');
      setIsAddDialogOpen(false);
      
      // Resetar formulário
      setFormData({
        veiculo_id: "",
        descricao: "",
        tipo: "preventiva",
        preco: "",
        peca_substituida: "",
        data_reparacao: new Date(),
        oficina: "",
        status: "pendente"
      });
    } catch (error: any) {
      console.error('Erro ao registrar reparação:', error);
      toast.error(error.message || 'Erro ao registrar reparação');
    }
  };

  const handleDelete = async () => {
    if (!selectedRepair) return;
    
    try {
      const { error } = await supabase
        .from('reparacoes')
        .delete()
        .eq('id', selectedRepair.id);
        
      if (error) throw error;
      
      toast.success('Reparação excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedRepair(null);
    } catch (error: any) {
      console.error('Erro ao excluir reparação:', error);
      toast.error(error.message || 'Erro ao excluir reparação');
    }
  };

  const handleView = (repair: any) => {
    setSelectedRepair(repair);
    setIsViewDialogOpen(true);
  };

  const handleDeleteConfirm = (repair: any) => {
    setSelectedRepair(repair);
    setIsDeleteDialogOpen(true);
  };

  return (
    <PageTransition>
      <PageHeader 
        title="Reparações" 
        description="Gerencie as reparações dos veículos da sua frota"
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Reparação
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
                        <SelectItem value="em_andamento">Em andamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
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
      ) : filteredRepairs.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRepairs.map((repair) => (
                <TableRow key={repair.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                        <Car className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div>{repair.veiculos.modelo}</div>
                        <div className="text-xs text-muted-foreground">{repair.veiculos.placa}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(repair.data_reparacao), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{repair.tipo}</span>
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1">
                      {repair.descricao}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(repair.preco)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={repair.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(repair)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteConfirm(repair)}
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
          title="Nenhuma reparação encontrada"
          description={
            searchTerm || statusFilter
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Registre sua primeira reparação para começar."
          }
          action={
            !searchTerm && !statusFilter
              ? {
                  label: "Registrar Reparação",
                  onClick: () => setIsAddDialogOpen(true),
                }
              : undefined
          }
          icon={<Wrench className="h-7 w-7 text-primary" />}
        />
      )}
      
      {/* Add Repair Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Nova Reparação</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da reparação do veículo.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="veiculo">Veículo</Label>
                <Select 
                  value={formData.veiculo_id} 
                  onValueChange={(value) => setFormData({ ...formData, veiculo_id: value })}
                  required
                >
                  <SelectTrigger id="veiculo">
                    <SelectValue placeholder="Selecionar veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.modelo} ({vehicle.placa})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Reparação</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                      <SelectItem value="corretiva">Corretiva</SelectItem>
                      <SelectItem value="revisao">Revisão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Data da Reparação</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {formData.data_reparacao ? (
                          format(formData.data_reparacao, "dd/MM/yyyy")
                        ) : (
                          <span>Selecionar data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.data_reparacao}
                        onSelect={(date) => date && setFormData({ ...formData, data_reparacao: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o problema e a reparação realizada"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="peca">Peça Substituída</Label>
                  <Input
                    id="peca"
                    placeholder="Ex: Filtro de óleo"
                    value={formData.peca_substituida}
                    onChange={(e) => setFormData({ ...formData, peca_substituida: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preco">Valor (AOA)</Label>
                  <Input
                    id="preco"
                    type="number"
                    placeholder="0.00"
                    value={formData.preco}
                    onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oficina">Oficina</Label>
                  <Input
                    id="oficina"
                    placeholder="Ex: Oficina Central"
                    value={formData.oficina}
                    onChange={(e) => setFormData({ ...formData, oficina: e.target.value })}
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
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Reparação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Repair Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedRepair && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Reparação</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Veículo</h3>
                    <p className="font-semibold">{selectedRepair.veiculos.modelo} ({selectedRepair.veiculos.placa})</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Data</h3>
                    <p>{format(new Date(selectedRepair.data_reparacao), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
                  <p className="capitalize">{selectedRepair.tipo}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                  <p>{selectedRepair.descricao}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Peça Substituída</h3>
                    <p>{selectedRepair.peca_substituida || "—"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Oficina</h3>
                    <p>{selectedRepair.oficina || "—"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Valor</h3>
                    <p className="font-semibold">
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedRepair.preco)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <StatusBadge status={selectedRepair.status} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Registrado em</h3>
                  <p>{format(new Date(selectedRepair.criado_em), 'dd/MM/yyyy')}</p>
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
              Tem certeza que deseja excluir esta reparação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-3 rounded-md">
            {selectedRepair && (
              <div>
                <p className="font-medium">{selectedRepair.veiculos.modelo} ({selectedRepair.veiculos.placa})</p>
                <p className="text-sm text-muted-foreground">{format(new Date(selectedRepair.data_reparacao), 'dd/MM/yyyy')}</p>
              </div>
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

export default Repairs;
