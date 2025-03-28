
import React, { useState, useEffect } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { Users, Search, Plus, Filter, ChevronDown, ChevronUp, MoreHorizontal, Trash2, Edit, Eye, UserCircle, Download, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
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
import { FileUpload } from '@/components/FileUpload';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { supabase } from '@/integrations/supabase/client';

const Drivers = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    nome: "",
    documento: "",
    endereco: "",
    telefone: "",
    data_contratacao: new Date(),
    status: "ativo",
    documento_bi_url: "",
    documento_carta_url: ""
  });

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('motoristas')
        .select('*')
        .order('criado_em', { ascending: false });
        
      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
      toast.error('Erro ao buscar motoristas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();

    // Configurar assinatura em tempo real
    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'motoristas'
        },
        () => {
          fetchDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredDrivers = drivers.filter(driver => {
    // Filtrar por termo de pesquisa
    if (searchTerm && !`${driver.nome} ${driver.documento}`.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrar por status
    if (statusFilter && driver.status !== statusFilter) {
      return false;
    }
    
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('motoristas')
        .insert([
          {
            nome: formData.nome,
            documento: formData.documento,
            endereco: formData.endereco,
            telefone: formData.telefone,
            data_contratacao: formData.data_contratacao.toISOString().split('T')[0],
            status: formData.status,
            documento_bi_url: formData.documento_bi_url,
            documento_carta_url: formData.documento_carta_url
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success('Motorista cadastrado com sucesso!');
      setIsAddDialogOpen(false);
      
      // Resetar formulário
      setFormData({
        nome: "",
        documento: "",
        endereco: "",
        telefone: "",
        data_contratacao: new Date(),
        status: "ativo",
        documento_bi_url: "",
        documento_carta_url: ""
      });
    } catch (error: any) {
      console.error('Erro ao cadastrar motorista:', error);
      toast.error(error.message || 'Erro ao cadastrar motorista');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDriver) return;
    
    try {
      const { error } = await supabase
        .from('motoristas')
        .update({
          nome: formData.nome,
          documento: formData.documento,
          endereco: formData.endereco,
          telefone: formData.telefone,
          data_contratacao: formData.data_contratacao.toISOString().split('T')[0],
          status: formData.status,
          documento_bi_url: formData.documento_bi_url,
          documento_carta_url: formData.documento_carta_url
        })
        .eq('id', selectedDriver.id);
        
      if (error) throw error;
      
      toast.success('Motorista atualizado com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedDriver(null);
    } catch (error: any) {
      console.error('Erro ao atualizar motorista:', error);
      toast.error(error.message || 'Erro ao atualizar motorista');
    }
  };

  const handleDelete = async () => {
    if (!selectedDriver) return;
    
    try {
      const { error } = await supabase
        .from('motoristas')
        .delete()
        .eq('id', selectedDriver.id);
        
      if (error) throw error;
      
      toast.success('Motorista excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedDriver(null);
    } catch (error: any) {
      console.error('Erro ao excluir motorista:', error);
      toast.error(error.message || 'Erro ao excluir motorista');
    }
  };

  const handleEdit = (driver: any) => {
    setSelectedDriver(driver);
    setFormData({
      nome: driver.nome,
      documento: driver.documento,
      endereco: driver.endereco || "",
      telefone: driver.telefone || "",
      data_contratacao: driver.data_contratacao ? new Date(driver.data_contratacao) : new Date(),
      status: driver.status,
      documento_bi_url: driver.documento_bi_url || "",
      documento_carta_url: driver.documento_carta_url || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (driver: any) => {
    setSelectedDriver(driver);
    setIsViewDialogOpen(true);
  };

  const handleDeleteConfirm = (driver: any) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  const handleBIUpload = (files: File[], urls?: string[]) => {
    if (urls && urls.length > 0) {
      setFormData({ ...formData, documento_bi_url: urls[0] });
    }
  };

  const handleLicenseUpload = (files: File[], urls?: string[]) => {
    if (urls && urls.length > 0) {
      setFormData({ ...formData, documento_carta_url: urls[0] });
    }
  };

  return (
    <PageTransition>
      <PageHeader 
        title="Motoristas" 
        description="Gerencie os motoristas da sua frota"
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Motorista
        </Button>
      </PageHeader>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por nome, documento..."
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
      ) : filteredDrivers.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                        <UserCircle className="h-4 w-4 text-primary" />
                      </div>
                      {driver.nome}
                    </div>
                  </TableCell>
                  <TableCell>{driver.documento}</TableCell>
                  <TableCell>{driver.telefone || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={driver.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {driver.documento_bi_url && (
                        <Badge variant="outline" className="cursor-pointer">
                          <a 
                            href={driver.documento_bi_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            BI
                          </a>
                        </Badge>
                      )}
                      {driver.documento_carta_url && (
                        <Badge variant="outline" className="cursor-pointer">
                          <a 
                            href={driver.documento_carta_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Carta
                          </a>
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(driver)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(driver)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteConfirm(driver)}
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
          title="Nenhum motorista encontrado"
          description={
            searchTerm || statusFilter
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Cadastre seu primeiro motorista para começar."
          }
          action={
            !searchTerm && !statusFilter
              ? {
                  label: "Adicionar Motorista",
                  onClick: () => setIsAddDialogOpen(true),
                }
              : undefined
          }
          icon={<Users className="h-7 w-7 text-primary" />}
        />
      )}
      
      {/* Add Driver Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Motorista</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do motorista para cadastrá-lo.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações Básicas</TabsTrigger>
                <TabsTrigger value="docs">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: João Silva"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento (BI/Carteira)</Label>
                    <Input
                      id="documento"
                      placeholder="Ex: 123456789LA012"
                      value={formData.documento}
                      onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      placeholder="Ex: Rua Principal, 123, Luanda"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="Ex: +244 923 456 789"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Contratação</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {formData.data_contratacao ? (
                              format(formData.data_contratacao, "dd/MM/yyyy")
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.data_contratacao}
                            onSelect={(date) => date && setFormData({ ...formData, data_contratacao: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
              </TabsContent>
              
              <TabsContent value="docs" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <FileUpload
                    id="bi-upload"
                    label="Bilhete de Identidade (BI)"
                    accept="application/pdf"
                    onChange={handleBIUpload}
                    preview={true}
                    bucket="driver_documents" 
                    folder="bi"
                    onUploadComplete={(urls) => setFormData({ ...formData, documento_bi_url: urls[0] })}
                  />
                  
                  <FileUpload
                    id="license-upload"
                    label="Carta de Condução"
                    accept="application/pdf"
                    onChange={handleLicenseUpload}
                    preview={true}
                    bucket="driver_documents"
                    folder="licenses"
                    onUploadComplete={(urls) => setFormData({ ...formData, documento_carta_url: urls[0] })}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar Motorista</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Driver Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Motorista</DialogTitle>
            <DialogDescription>
              Edite os detalhes do motorista.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações Básicas</TabsTrigger>
                <TabsTrigger value="docs">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-nome">Nome Completo</Label>
                    <Input
                      id="edit-nome"
                      placeholder="Ex: João Silva"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-documento">Documento (BI/Carteira)</Label>
                    <Input
                      id="edit-documento"
                      placeholder="Ex: 123456789LA012"
                      value={formData.documento}
                      onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-endereco">Endereço</Label>
                    <Input
                      id="edit-endereco"
                      placeholder="Ex: Rua Principal, 123, Luanda"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-telefone">Telefone</Label>
                    <Input
                      id="edit-telefone"
                      placeholder="Ex: +244 923 456 789"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Contratação</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {formData.data_contratacao ? (
                              format(formData.data_contratacao, "dd/MM/yyyy")
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.data_contratacao}
                            onSelect={(date) => date && setFormData({ ...formData, data_contratacao: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger id="edit-status">
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
              </TabsContent>
              
              <TabsContent value="docs" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <FileUpload
                    id="edit-bi-upload"
                    label="Bilhete de Identidade (BI)"
                    accept="application/pdf"
                    onChange={handleBIUpload}
                    preview={true}
                    bucket="driver_documents" 
                    folder="bi"
                    onUploadComplete={(urls) => setFormData({ ...formData, documento_bi_url: urls[0] })}
                    existingUrls={formData.documento_bi_url ? [formData.documento_bi_url] : []}
                  />
                  
                  <FileUpload
                    id="edit-license-upload"
                    label="Carta de Condução"
                    accept="application/pdf"
                    onChange={handleLicenseUpload}
                    preview={true}
                    bucket="driver_documents"
                    folder="licenses"
                    onUploadComplete={(urls) => setFormData({ ...formData, documento_carta_url: urls[0] })}
                    existingUrls={formData.documento_carta_url ? [formData.documento_carta_url] : []}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* View Driver Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedDriver && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do Motorista</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex justify-center mb-2">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-12 w-12 text-primary" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Nome</h3>
                    <p className="font-semibold">{selectedDriver.nome}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Documento</h3>
                    <p className="font-semibold">{selectedDriver.documento}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Endereço</h3>
                  <p>{selectedDriver.endereco || "—"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Telefone</h3>
                    <p>{selectedDriver.telefone || "—"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                    <StatusBadge status={selectedDriver.status} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de Contratação</h3>
                    <p>{selectedDriver.data_contratacao ? format(new Date(selectedDriver.data_contratacao), 'dd/MM/yyyy') : "—"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Cadastrado em</h3>
                    <p>{format(new Date(selectedDriver.criado_em), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Documentos</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDriver.documento_bi_url ? (
                      <a 
                        href={selectedDriver.documento_bi_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-100 transition-colors border border-primary-200"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Bilhete de Identidade
                        <Download className="h-4 w-4 ml-2" />
                      </a>
                    ) : (
                      <Badge variant="outline">Sem BI</Badge>
                    )}
                    
                    {selectedDriver.documento_carta_url ? (
                      <a 
                        href={selectedDriver.documento_carta_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-md bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary-100 transition-colors border border-primary-200"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Carta de Condução
                        <Download className="h-4 w-4 ml-2" />
                      </a>
                    ) : (
                      <Badge variant="outline">Sem Carta de Condução</Badge>
                    )}
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
              Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-3 rounded-md">
            {selectedDriver && (
              <p className="font-medium">{selectedDriver.nome}</p>
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

export default Drivers;

