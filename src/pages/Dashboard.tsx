
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Car, Users, Wrench, Receipt, ArrowUp, ArrowDown,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { PageTransition } from '@/components/PageTransition';
import { CardStat } from '@/components/CardStat';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  drivers, vehicles, maintenances, finances,
  getTotalIncome, getTotalExpenses, getExpensesByCategory, 
  getOverdueMaintenance, getUpcomingMaintenance
} from '@/data/mockData';

// Prepare chart data
const prepareFinanceData = () => {
  const months: Record<string, { income: number; expenses: number }> = {};
  
  // Create last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = format(date, 'MMM', { locale: ptBR });
    months[month] = { income: 0, expenses: 0 };
  }
  
  // Fill with data
  finances.forEach(finance => {
    const month = format(new Date(finance.date), 'MMM', { locale: ptBR });
    if (months[month]) {
      if (finance.type === 'entrada') {
        months[month].income += finance.amount;
      } else {
        months[month].expenses += finance.amount;
      }
    }
  });
  
  // Convert to array format for chart
  return Object.entries(months).map(([month, data]) => ({
    month,
    income: data.income / 1000, // Convert to thousands
    expenses: data.expenses / 1000,
  }));
};

const prepareExpensesData = () => {
  const categories = getExpensesByCategory();
  
  return Object.entries(categories).map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: amount,
  }));
};

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const Dashboard = () => {
  const financeData = prepareFinanceData();
  const expensesData = prepareExpensesData();
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = totalIncome - totalExpenses;
  const overdueMaintenance = getOverdueMaintenance();
  const upcomingMaintenance = getUpcomingMaintenance();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-display font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <CardStat
              title="Motoristas"
              value={drivers.filter(d => d.status === 'ativo').length}
              icon={<Users className="h-5 w-5 text-primary" />}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <CardStat
              title="Veículos"
              value={vehicles.filter(v => v.status === 'ativo').length}
              icon={<Car className="h-5 w-5 text-primary" />}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <CardStat
              title="Manutenções Pendentes"
              value={overdueMaintenance.length}
              icon={<Wrench className="h-5 w-5 text-primary" />}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <CardStat
              title="Balanço (AO)"
              value={new Intl.NumberFormat('pt-AO').format(balance)}
              trend={{ 
                value: totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0, 
                positive: balance > 0 
              }}
              icon={balance > 0 ? 
                <ArrowUp className="h-5 w-5 text-green-600" /> : 
                <ArrowDown className="h-5 w-5 text-red-600" />
              }
            />
          </motion.div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Receitas e Despesas (Últimos 6 meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} mil AO`, '']}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Legend />
                      <Bar name="Receitas" dataKey="income" fill="#0088FE" radius={[4, 4, 0, 0]} />
                      <Bar name="Despesas" dataKey="expenses" fill="#FF8042" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Distribuição de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie
                        data={expensesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {expensesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [new Intl.NumberFormat('pt-AO').format(value) + ' AO', '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="w-full mt-2">
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/finance" className="flex items-center justify-center">
                        <span>Ver Relatório Completo</span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Manutenções Pendentes</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/maintenance">Ver todas</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {overdueMaintenance.length > 0 ? (
                  <div className="space-y-3">
                    {overdueMaintenance.map((maintenance) => {
                      const vehicle = vehicles.find(v => v.id === maintenance.vehicleId);
                      return (
                        <div key={maintenance.id} className="flex items-start justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center">
                              <StatusBadge status={maintenance.status} className="mr-2" />
                              <h4 className="font-medium">{vehicle?.brand} {vehicle?.model}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{maintenance.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Data: {format(new Date(maintenance.date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/maintenance?id=${maintenance.id}`}>
                              Detalhes
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                    <Wrench className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-lg font-medium">Não há manutenções pendentes</p>
                    <p className="text-sm text-muted-foreground mt-1">Todos os veículos estão em dia com suas manutenções.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Próximas Manutenções</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/maintenance">Ver todas</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingMaintenance.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMaintenance.map((maintenance) => {
                      const vehicle = vehicles.find(v => v.id === maintenance.vehicleId);
                      return (
                        <div key={maintenance.id} className="flex items-start justify-between p-3 rounded-lg border">
                          <div>
                            <div className="flex items-center">
                              <StatusBadge status={maintenance.status} className="mr-2" />
                              <h4 className="font-medium">{vehicle?.brand} {vehicle?.model}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{maintenance.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Data: {format(new Date(maintenance.date), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/maintenance?id=${maintenance.id}`}>
                              Detalhes
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                    <Wrench className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-lg font-medium">Não há manutenções agendadas</p>
                    <p className="text-sm text-muted-foreground mt-1">Agende novas manutenções para seus veículos.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
