import React, { useState, useEffect, useRef } from 'react';
import { PageTransition } from '@/components/PageTransition';
import { PageHeader } from '@/components/PageHeader';
import { Receipt, Search, Plus, Filter, ChevronDown, ChevronUp, MoreHorizontal, Trash2, Edit, Eye, ArrowUpRight, ArrowDownRight, Download, Calendar as CalendarIcon, FileText, Printer } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';

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
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';

import { supabase } from '@/integrations/supabase/client';

const Finance = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [finances, setFinances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [selectedFinance, setSelectedFinance] = useState<any>(null);
  const [formData, setFormData] = useState({
    tipo: "saída",
    categoria: "outro",
    descricao: "",
    valor: "",
    data_transacao: new Date(),
    recibo_url: "",
    recibo_nome: ""
  });
  const [reportType, setReportType] = useState<"weekly" | "monthly">("monthly");
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchFinances = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financas')
        .select('*')
        .order('data_transacao', { ascending: false });
        
      if (error) throw error;
      setFinances(data || []);
    } catch (error) {
      console.error('Erro ao buscar finanças:', error);
      toast.error('Erro ao buscar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinances();

    const channel = supabase
      .channel('table-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financas'
        },
        () => {
          fetchFinances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredFinances = finances.filter(finance => {
    if (searchTerm && !finance.descricao.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (typeFilter && finance.tipo !== typeFilter) {
      return false;
    }
    
    if (categoryFilter && finance.categoria !== categoryFilter) {
      return false;
    }
    
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('financas')
        .insert([
          {
            tipo: formData.tipo,
            categoria: formData.categoria,
            descricao: formData.descricao,
            valor: parseFloat(formData.valor),
            data_transacao: formData.data_transacao.toISOString(),
            recibo_url: formData.recibo_url || null,
            recibo_nome: formData.recibo_nome || null
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success('Transação financeira registrada com sucesso!');
      setIsAddDialogOpen(false);
      
      setFormData({
        tipo: "saída",
        categoria: "outro",
        descricao: "",
        valor: "",
        data_transacao: new Date(),
        recibo_url: "",
        recibo_nome: ""
      });
    } catch (error: any) {
      console.error('Erro ao registrar transação:', error);
      toast.error(error.message || 'Erro ao registrar transação');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFinance) return;
    
    try {
      const { error } = await supabase
        .from('financas')
        .update({
          tipo: formData.tipo,
          categoria: formData.categoria,
          descricao: formData.descricao,
          valor: parseFloat(formData.valor),
          data_transacao: formData.data_transacao.toISOString(),
          recibo_url: formData.recibo_url || null,
          recibo_nome: formData.recibo_nome || null
        })
        .eq('id', selectedFinance.id);
        
      if (error) throw error;
      
      toast.success('Transação atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setSelectedFinance(null);
    } catch (error: any) {
      console.error('Erro ao atualizar transação:', error);
      toast.error(error.message || 'Erro ao atualizar transação');
    }
  };

  const handleDelete = async () => {
    if (!selectedFinance) return;
    
    try {
      const { error } = await supabase
        .from('financas')
        .delete()
        .eq('id', selectedFinance.id);
        
      if (error) throw error;
      
      toast.success('Transação excluída com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedFinance(null);
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error);
      toast.error(error.message || 'Erro ao excluir transação');
    }
  };

  const handleEdit = (finance: any) => {
    setSelectedFinance(finance);
    setFormData({
      tipo: finance.tipo,
      categoria: finance.categoria,
      descricao: finance.descricao,
      valor: finance.valor.toString(),
      data_transacao: new Date(finance.data_transacao),
      recibo_url: finance.recibo_url || "",
      recibo_nome: finance.recibo_nome || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (finance: any) => {
    setSelectedFinance(finance);
    setIsViewDialogOpen(true);
  };

  const handleDeleteConfirm = (finance: any) => {
    setSelectedFinance(finance);
    setIsDeleteDialogOpen(true);
  };

  const handleReceiptUpload = (files: File[], urls?: string[]) => {
    if (urls && urls.length > 0) {
      setFormData({ 
        ...formData, 
        recibo_url: urls[0], 
        recibo_nome: files[0].name 
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'manutenção': 'Manutenção',
      'reparação': 'Reparação',
      'salário': 'Salário',
      'gasolina': 'Gasolina',
      'seguro': 'Seguro',
      'outro': 'Outro'
    };
    
    return categories[category] || category;
  };

  const getIncome = () => {
    return finances
      .filter(finance => finance.tipo === 'entrada')
      .reduce((sum, finance) => sum + finance.valor, 0);
  };
  
  const getExpenses = () => {
    return finances
      .filter(finance => finance.tipo === 'saída')
      .reduce((sum, finance) => sum + finance.valor, 0);
  };
  
  const getBalance = () => {
    return getIncome() - getExpenses();
  };

  const getReportDateRange = () => {
    if (reportType === 'weekly') {
      const start = startOfWeek(reportDate);
      const end = endOfWeek(reportDate);
      return { start, end };
    } else {
      const start = startOfMonth(reportDate);
      const end = endOfMonth(reportDate);
      return { start, end };
    }
  };

  const getReportTransactions = () => {
    const { start, end } = getReportDateRange();
    
    return finances.filter(finance => {
      const transactionDate = new Date(finance.data_transacao);
      return transactionDate >= start && transactionDate <= end;
    }).sort((a, b) => new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime());
  };

  const getReportIncome = () => {
    return getReportTransactions()
      .filter(finance => finance.tipo === 'entrada')
      .reduce((sum, finance) => sum + finance.valor, 0);
  };
  
  const getReportExpenses = () => {
    return getReportTransactions()
      .filter(finance => finance.tipo === 'saída')
      .reduce((sum, finance) => sum + finance.valor, 0);
  };
  
  const getReportBalance = () => {
    return getReportIncome() - getReportExpenses();
  };

  const getReportTitle = () => {
    if (reportType === 'weekly') {
      const { start, end } = getReportDateRange();
      return `Relatório Semanal: ${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
    } else {
      return `Relatório Mensal: ${format(reportDate, 'MMMM yyyy')}`;
    }
  };

  const handlePrint = useReactToPrint({
    documentTitle: `Finanças - ${getReportTitle()}`,
    onAfterPrint: () => {
      toast.success('Relatório gerado com sucesso!');
    }
  });

  return (
    <PageTransition>
      <PageHeader 
        title="Finanças" 
        description="Gerencie as finanças da sua empresa"
      >
        <div className="flex gap-2">
          <Button onClick={() => setIsReportDialogOpen(true)} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receitas</p>
                <h3 className="text-2xl font-bold mt-1">
                  {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getIncome())}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Despesas</p>
                <h3 className="text-2xl font-bold mt-1">
                  {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getExpenses())}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                <h3 className={`text-2xl font-bold mt-1 ${getBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getBalance())}
                </h3>
              </div>
              <div className={`h-10 w-10 rounded-full ${getBalance() >= 0 ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
                <Receipt className={`h-5 w-5 ${getBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por descrição..."
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium mb-1.5">
                      Tipo
                    </label>
                    <Select 
                      value={typeFilter} 
                      onValueChange={setTypeFilter}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todos</SelectItem>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saída">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-1.5">
                      Categoria
                    </label>
                    <Select 
                      value={categoryFilter} 
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        <SelectItem value="manutenção">Manutenção</SelectItem>
                        <SelectItem value="reparação">Reparação</SelectItem>
                        <SelectItem value="salário">Salário</SelectItem>
                        <SelectItem value="gasolina">Gasolina</SelectItem>
                        <SelectItem value="seguro">Seguro</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
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
      ) : filteredFinances.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Recibo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFinances.map((finance) => (
                <TableRow key={finance.id}>
                  <TableCell>
                    {format(new Date(finance.data_transacao), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="line-clamp-1">
                      {finance.descricao}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {getCategoryLabel(finance.categoria)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={finance.tipo === 'entrada' ? 'success' : 'destructive'} className="capitalize">
                      {finance.tipo === 'entrada' ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {finance.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className={finance.tipo === 'entrada' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {finance.tipo === 'entrada' ? '+' : '-'}
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(finance.valor)}
                  </TableCell>
                  <TableCell>
                    {finance.recibo_url ? (
                      <a 
                        href={finance.recibo_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(finance)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(finance)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteConfirm(finance)}
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
          title="Nenhuma transação encontrada"
          description={
            searchTerm || typeFilter || categoryFilter
              ? "Tente ajustar os filtros para ver mais resultados."
              : "Registre sua primeira transação financeira para começar."
          }
          action={
            !searchTerm && !typeFilter && !categoryFilter
              ? {
                  label: "Registrar Transação",
                  onClick: () => setIsAddDialogOpen(true),
                }
              : undefined
          }
          icon={<Receipt className="h-7 w-7 text-primary" />}
        />
      )}
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Nova Transação</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da transação financeira.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="recibo">Recibo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select 
                        value={formData.tipo} 
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                        required
                      >
                        <SelectTrigger id="tipo">
                          <SelectValue placeholder="Selecionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saída">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select 
                        value={formData.categoria} 
                        onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                        required
                      >
                        <SelectTrigger id="categoria">
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manutenção">Manutenção</SelectItem>
                          <SelectItem value="reparação">Reparação</SelectItem>
                          <SelectItem value="salário">Salário</SelectItem>
                          <SelectItem value="gasolina">Gasolina</SelectItem>
                          <SelectItem value="seguro">Seguro</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Input
                      id="descricao"
                      placeholder="Ex: Pagamento de seguro do veículo"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor (AOA)</Label>
                      <Input
                        id="valor"
                        type="number"
                        placeholder="0.00"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {formData.data_transacao ? (
                              format(formData.data_transacao, "dd/MM/yyyy")
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.data_transacao}
                            onSelect={(date) => date && setFormData({ ...formData, data_transacao: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recibo" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <FileUpload
                    id="receipt-upload"
                    label="Recibo (PDF ou Imagem)"
                    accept="application/pdf,image/*"
                    onChange={handleReceiptUpload}
                    preview={true}
                    bucket="finance_receipts"
                    folder="receipts"
                    onUploadComplete={(urls, fileNames) => setFormData({ 
                      ...formData, 
                      recibo_url: urls[0],
                      recibo_nome: fileNames[0]
                    })}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Transação</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Edite os detalhes da transação financeira.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="recibo">Recibo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-tipo">Tipo</Label>
                      <Select 
                        value={formData.tipo} 
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                        required
                      >
                        <SelectTrigger id="edit-tipo">
                          <SelectValue placeholder="Selecionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entrada">Entrada</SelectItem>
                          <SelectItem value="saída">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-categoria">Categoria</Label>
                      <Select 
                        value={formData.categoria} 
                        onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                        required
                      >
                        <SelectTrigger id="edit-categoria">
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manutenção">Manutenção</SelectItem>
                          <SelectItem value="reparação">Reparação</SelectItem>
                          <SelectItem value="salário">Salário</SelectItem>
                          <SelectItem value="gasolina">Gasolina</SelectItem>
                          <SelectItem value="seguro">Seguro</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-descricao">Descrição</Label>
                    <Input
                      id="edit-descricao"
                      placeholder="Ex: Pagamento de seguro do veículo"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-valor">Valor (AOA)</Label>
                      <Input
                        id="edit-valor"
                        type="number"
                        placeholder="0.00"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            {formData.data_transacao ? (
                              format(formData.data_transacao, "dd/MM/yyyy")
                            ) : (
                              <span>Selecionar data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.data_transacao}
                            onSelect={(date) => date && setFormData({ ...formData, data_transacao: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recibo" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <FileUpload
                    id="edit-receipt-upload"
                    label="Recibo (PDF ou Imagem)"
                    accept="application/pdf,image/*"
                    onChange={handleReceiptUpload}
                    preview={true}
                    bucket="finance_receipts"
                    folder="receipts"
                    onUploadComplete={(urls, fileNames) => setFormData({ 
                      ...formData, 
                      recibo_url: urls[0],
                      recibo_nome: fileNames[0]
                    })}
                    existingUrls={formData.recibo_url ? [formData.recibo_url] : []}
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
      
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedFinance && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Transação</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
                    <Badge variant={selectedFinance.tipo === 'entrada' ? 'success' : 'destructive'} className="capitalize">
                      {selectedFinance.tipo === 'entrada' ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      {selectedFinance.tipo}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Categoria</h3>
                    <Badge variant="outline" className="capitalize">
                      {getCategoryLabel(selectedFinance.categoria)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                  <p>{selectedFinance.descricao}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Valor</h3>
                    <p className={`font-semibold ${selectedFinance.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedFinance.tipo === 'entrada' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedFinance.valor)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Data</h3>
                    <p>{format(new Date(selectedFinance.data_transacao), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                
                {selectedFinance.recibo_url && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Recibo</h3>
                    <div className="mt-2">
                      {selectedFinance.recibo_url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <div className="border rounded-md p-2">
                          <img 
                            src={selectedFinance.recibo_url} 
                            alt="Recibo" 
                            className="max-h-48 mx-auto object-contain rounded" 
                          />
                          <div className="mt-2 text-center">
                            <a 
                              href={selectedFinance.recibo_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:underline"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar imagem
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="border rounded-md p-4 flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-sm mb-2">
                              {selectedFinance.recibo_nome || "Documento PDF"}
                            </p>
                            <a 
                              href={selectedFinance.recibo_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:underline"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Baixar PDF
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Registrado em</h3>
                  <p>{format(new Date(selectedFinance.criado_em), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gerar Relatório Financeiro</DialogTitle>
            <DialogDescription>
              Selecione o tipo de relatório e o período desejado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="report-type">Tipo de Relatório</Label>
                <Select 
                  value={reportType} 
                  onValueChange={(value: "weekly" | "monthly") => setReportType(value)}
                >
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Período</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportType === 'weekly' 
                        ? format(reportDate, "dd/MM/yyyy") + ' (semana)'
                        : format(reportDate, "MMMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={reportDate}
                      onSelect={(date) => date && setReportDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">Prévia do Relatório</h3>
              <p className="text-sm text-muted-foreground mb-4">{getReportTitle()}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="border rounded-md p-3">
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-green-600 font-medium">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getReportIncome())}
                  </p>
                </div>
                <div className="border rounded-md p-3">
                  <p className="text-xs text-muted-foreground">Despesas</p>
                  <p className="text-red-600 font-medium">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getReportExpenses())}
                  </p>
                </div>
                <div className="border rounded-md p-3">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className={getReportBalance() >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getReportBalance())}
                  </p>
                </div>
              </div>
              
              <p className="text-sm">{getReportTransactions().length} transações no período</p>
            </div>
            
            <div className="pt-4 text-right space-x-2">
              <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handlePrint(() => reportRef.current)}>
                <Printer className="h-4 w-4 mr-2" />
                Gerar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        <div ref={reportRef} className="p-8 bg-white">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">Relatório Financeiro</h1>
            <p className="text-lg">{getReportTitle()}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="border rounded-lg p-4 text-center">
              <h2 className="text-lg font-medium mb-2">Receitas</h2>
              <p className="text-xl text-green-600 font-bold">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getReportIncome())}
              </p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <h2 className="text-lg font-medium mb-2">Despesas</h2>
              <p className="text-xl text-red-600 font-bold">
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getReportExpenses())}
              </p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <h2 className="text-lg font-medium mb-2">Saldo</h2>
              <p className={`text-xl font-bold ${getReportBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getReportBalance())}
              </p>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-4">Detalhes das Transações</h2>
          
          {getReportTransactions().length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Data</th>
                  <th className="border p-2 text-left">Descrição</th>
                  <th className="border p-2 text-left">Categoria</th>
                  <th className="border p-2 text-left">Tipo</th>
                  <th className="border p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {getReportTransactions().map((finance, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border p-2">
                      {format(new Date(finance.data_transacao), 'dd/MM/yyyy')}
                    </td>
                    <td className="border p-2 font-medium">{finance.descricao}</td>
                    <td className="border p-2">{getCategoryLabel(finance.categoria)}</td>
                    <td className="border p-2">
                      {finance.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </td>
                    <td className={`border p-2 text-right ${finance.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'} font-medium`}>
                      {finance.tipo === 'entrada' ? '+' : '-'}
                      {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(finance.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={4} className="border p-2 text-right">Total:</td>
                  <td className={`border p-2 text-right ${getReportBalance() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(getReportBalance())}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-center py-4 border">Nenhuma transação encontrada no período selecionado.</p>
          )}
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Relatório gerado em {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
        </div>
      </div>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted p-3 rounded-md">
            {selectedFinance && (
              <div>
                <p className="font-medium">{selectedFinance.descricao}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedFinance.data_transacao), 'dd/MM/yyyy')} - 
                  {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(selectedFinance.valor)}
                </p>
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

export default Finance;

