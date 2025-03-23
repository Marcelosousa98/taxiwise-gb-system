
// Types
export type Driver = {
  id: string;
  name: string;
  address: string;
  driverLicense: string;
  nationalId: string;
  photo?: string;
  status: 'ativo' | 'inativo';
  documents: {
    driverLicense?: string;
    nationalId?: string;
  };
  createdAt: Date;
};

export type Vehicle = {
  id: string;
  licensePlate: string;
  model: string;
  brand: string;
  year: number;
  mileage: number;
  driverId?: string;
  status: 'ativo' | 'inativo';
  lastMaintenance?: Date;
  createdAt: Date;
};

export type Maintenance = {
  id: string;
  vehicleId: string;
  date: Date;
  status: 'pendente' | 'completo' | 'atrasado' | 'agendado';
  description: string;
  cost?: number;
  notes?: string;
  createdAt: Date;
};

export type Repair = {
  id: string;
  vehicleId: string;
  maintenanceId?: string;
  date: Date;
  part: string;
  cost: number;
  description: string;
  receipt?: string;
  createdAt: Date;
};

export type Finance = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'entrada' | 'saída';
  category: 'manutenção' | 'reparação' | 'salário' | 'gasolina' | 'seguro' | 'outro';
  receipt?: string;
  vehicleId?: string;
  driverId?: string;
  createdAt: Date;
};

// Mock Data
export const drivers: Driver[] = [
  {
    id: '1',
    name: 'João Silva',
    address: 'Rua Principal 123, Luanda',
    driverLicense: 'DL12345678',
    nationalId: 'BI987654321',
    photo: 'https://randomuser.me/api/portraits/men/1.jpg',
    status: 'ativo',
    documents: {
      driverLicense: 'https://example.com/licenses/dl1.pdf',
      nationalId: 'https://example.com/ids/id1.pdf',
    },
    createdAt: new Date('2023-01-15'),
  },
  {
    id: '2',
    name: 'Manuel Santos',
    address: 'Avenida Central 456, Luanda',
    driverLicense: 'DL23456789',
    nationalId: 'BI876543210',
    photo: 'https://randomuser.me/api/portraits/men/2.jpg',
    status: 'ativo',
    documents: {
      driverLicense: 'https://example.com/licenses/dl2.pdf',
      nationalId: 'https://example.com/ids/id2.pdf',
    },
    createdAt: new Date('2023-02-20'),
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    address: 'Rua Secundária 789, Luanda',
    driverLicense: 'DL34567890',
    nationalId: 'BI765432109',
    photo: 'https://randomuser.me/api/portraits/men/3.jpg',
    status: 'inativo',
    documents: {
      driverLicense: 'https://example.com/licenses/dl3.pdf',
      nationalId: 'https://example.com/ids/id3.pdf',
    },
    createdAt: new Date('2023-03-10'),
  },
  {
    id: '4',
    name: 'Ana Pereira',
    address: 'Travessa 4, 234, Luanda',
    driverLicense: 'DL45678901',
    nationalId: 'BI654321098',
    photo: 'https://randomuser.me/api/portraits/women/4.jpg',
    status: 'ativo',
    documents: {
      driverLicense: 'https://example.com/licenses/dl4.pdf',
      nationalId: 'https://example.com/ids/id4.pdf',
    },
    createdAt: new Date('2023-04-05'),
  },
];

export const vehicles: Vehicle[] = [
  {
    id: '1',
    licensePlate: 'LD-54-32-AA',
    model: 'Corolla',
    brand: 'Toyota',
    year: 2020,
    mileage: 45000,
    driverId: '1',
    status: 'ativo',
    lastMaintenance: new Date('2023-06-15'),
    createdAt: new Date('2023-01-10'),
  },
  {
    id: '2',
    licensePlate: 'LD-65-43-BB',
    model: 'Civic',
    brand: 'Honda',
    year: 2019,
    mileage: 60000,
    driverId: '2',
    status: 'ativo',
    lastMaintenance: new Date('2023-05-20'),
    createdAt: new Date('2023-01-15'),
  },
  {
    id: '3',
    licensePlate: 'LD-76-54-CC',
    model: 'Camry',
    brand: 'Toyota',
    year: 2021,
    mileage: 30000,
    driverId: '4',
    status: 'ativo',
    lastMaintenance: new Date('2023-07-10'),
    createdAt: new Date('2023-02-01'),
  },
  {
    id: '4',
    licensePlate: 'LD-87-65-DD',
    model: 'Accord',
    brand: 'Honda',
    year: 2018,
    mileage: 75000,
    status: 'inativo',
    lastMaintenance: new Date('2023-04-05'),
    createdAt: new Date('2023-02-10'),
  },
];

export const maintenances: Maintenance[] = [
  {
    id: '1',
    vehicleId: '1',
    date: new Date('2023-06-15'),
    status: 'completo',
    description: 'Manutenção regular de 40.000 km',
    cost: 25000,
    notes: 'Troca de óleo, filtros e verificação geral',
    createdAt: new Date('2023-06-10'),
  },
  {
    id: '2',
    vehicleId: '2',
    date: new Date('2023-05-20'),
    status: 'completo',
    description: 'Manutenção regular de 60.000 km',
    cost: 35000,
    notes: 'Troca de óleo, filtros, correias e verificação geral',
    createdAt: new Date('2023-05-15'),
  },
  {
    id: '3',
    vehicleId: '3',
    date: new Date('2023-07-10'),
    status: 'completo',
    description: 'Manutenção regular de 30.000 km',
    cost: 20000,
    notes: 'Troca de óleo, filtros e verificação geral',
    createdAt: new Date('2023-07-05'),
  },
  {
    id: '4',
    vehicleId: '1',
    date: new Date('2023-08-15'),
    status: 'agendado',
    description: 'Manutenção regular de 50.000 km',
    notes: 'Agendar troca de óleo, filtros e verificação geral',
    createdAt: new Date('2023-08-01'),
  },
  {
    id: '5',
    vehicleId: '4',
    date: new Date('2023-04-05'),
    status: 'completo',
    description: 'Manutenção regular de 70.000 km',
    cost: 40000,
    notes: 'Troca de óleo, filtros, correias, pastilhas de freio e verificação geral',
    createdAt: new Date('2023-03-30'),
  },
];

export const repairs: Repair[] = [
  {
    id: '1',
    vehicleId: '1',
    maintenanceId: '1',
    date: new Date('2023-06-15'),
    part: 'Pastilhas de freio',
    cost: 15000,
    description: 'Substituição das pastilhas de freio dianteiras',
    receipt: 'https://example.com/receipts/r1.pdf',
    createdAt: new Date('2023-06-15'),
  },
  {
    id: '2',
    vehicleId: '2',
    maintenanceId: '2',
    date: new Date('2023-05-20'),
    part: 'Correia de distribuição',
    cost: 20000,
    description: 'Substituição da correia de distribuição e tensor',
    receipt: 'https://example.com/receipts/r2.pdf',
    createdAt: new Date('2023-05-20'),
  },
  {
    id: '3',
    vehicleId: '3',
    date: new Date('2023-07-05'),
    part: 'Bateria',
    cost: 12000,
    description: 'Substituição da bateria',
    receipt: 'https://example.com/receipts/r3.pdf',
    createdAt: new Date('2023-07-05'),
  },
  {
    id: '4',
    vehicleId: '4',
    maintenanceId: '5',
    date: new Date('2023-04-05'),
    part: 'Amortecedores',
    cost: 25000,
    description: 'Substituição dos amortecedores traseiros',
    receipt: 'https://example.com/receipts/r4.pdf',
    createdAt: new Date('2023-04-05'),
  },
];

export const finances: Finance[] = [
  {
    id: '1',
    date: new Date('2023-06-15'),
    description: 'Manutenção Toyota Corolla',
    amount: 25000,
    type: 'saída',
    category: 'manutenção',
    receipt: 'https://example.com/receipts/f1.pdf',
    vehicleId: '1',
    createdAt: new Date('2023-06-15'),
  },
  {
    id: '2',
    date: new Date('2023-06-15'),
    description: 'Reparação pastilhas de freio Toyota Corolla',
    amount: 15000,
    type: 'saída',
    category: 'reparação',
    receipt: 'https://example.com/receipts/f2.pdf',
    vehicleId: '1',
    createdAt: new Date('2023-06-15'),
  },
  {
    id: '3',
    date: new Date('2023-05-20'),
    description: 'Manutenção Honda Civic',
    amount: 35000,
    type: 'saída',
    category: 'manutenção',
    receipt: 'https://example.com/receipts/f3.pdf',
    vehicleId: '2',
    createdAt: new Date('2023-05-20'),
  },
  {
    id: '4',
    date: new Date('2023-05-20'),
    description: 'Reparação correia de distribuição Honda Civic',
    amount: 20000,
    type: 'saída',
    category: 'reparação',
    receipt: 'https://example.com/receipts/f4.pdf',
    vehicleId: '2',
    createdAt: new Date('2023-05-20'),
  },
  {
    id: '5',
    date: new Date('2023-05-31'),
    description: 'Salário João Silva',
    amount: 80000,
    type: 'saída',
    category: 'salário',
    driverId: '1',
    createdAt: new Date('2023-05-31'),
  },
  {
    id: '6',
    date: new Date('2023-05-31'),
    description: 'Salário Manuel Santos',
    amount: 80000,
    type: 'saída',
    category: 'salário',
    driverId: '2',
    createdAt: new Date('2023-05-31'),
  },
  {
    id: '7',
    date: new Date('2023-06-05'),
    description: 'Seguro anual Toyota Corolla',
    amount: 120000,
    type: 'saída',
    category: 'seguro',
    vehicleId: '1',
    receipt: 'https://example.com/receipts/f7.pdf',
    createdAt: new Date('2023-06-05'),
  },
  {
    id: '8',
    date: new Date('2023-06-10'),
    description: 'Receita de serviços de táxi - 1ª semana de Junho',
    amount: 350000,
    type: 'entrada',
    category: 'outro',
    createdAt: new Date('2023-06-10'),
  },
  {
    id: '9',
    date: new Date('2023-06-17'),
    description: 'Receita de serviços de táxi - 2ª semana de Junho',
    amount: 320000,
    type: 'entrada',
    category: 'outro',
    createdAt: new Date('2023-06-17'),
  },
  {
    id: '10',
    date: new Date('2023-06-10'),
    description: 'Abastecimento Combustível - Todos os veículos',
    amount: 45000,
    type: 'saída',
    category: 'gasolina',
    receipt: 'https://example.com/receipts/f10.pdf',
    createdAt: new Date('2023-06-10'),
  },
];

// Helper functions to access data
export const getDriverById = (id: string): Driver | undefined => {
  return drivers.find(driver => driver.id === id);
};

export const getVehicleById = (id: string): Vehicle | undefined => {
  return vehicles.find(vehicle => vehicle.id === id);
};

export const getMaintenanceById = (id: string): Maintenance | undefined => {
  return maintenances.find(maintenance => maintenance.id === id);
};

export const getVehicleMaintenance = (vehicleId: string): Maintenance[] => {
  return maintenances.filter(maintenance => maintenance.vehicleId === vehicleId);
};

export const getVehicleRepairs = (vehicleId: string): Repair[] => {
  return repairs.filter(repair => repair.vehicleId === vehicleId);
};

export const getUpcomingMaintenance = (): Maintenance[] => {
  const today = new Date();
  return maintenances.filter(
    maintenance => maintenance.status === 'agendado' && new Date(maintenance.date) > today
  );
};

export const getOverdueMaintenance = (): Maintenance[] => {
  const today = new Date();
  return maintenances.filter(
    maintenance => maintenance.status === 'pendente' && new Date(maintenance.date) < today
  );
};

export const getVehicleFinances = (vehicleId: string): Finance[] => {
  return finances.filter(finance => finance.vehicleId === vehicleId);
};

export const getDriverFinances = (driverId: string): Finance[] => {
  return finances.filter(finance => finance.driverId === driverId);
};

export const getTotalIncome = (): number => {
  return finances
    .filter(finance => finance.type === 'entrada')
    .reduce((sum, finance) => sum + finance.amount, 0);
};

export const getTotalExpenses = (): number => {
  return finances
    .filter(finance => finance.type === 'saída')
    .reduce((sum, finance) => sum + finance.amount, 0);
};

export const getExpensesByCategory = (): Record<string, number> => {
  const categories: Record<string, number> = {};
  
  finances
    .filter(finance => finance.type === 'saída')
    .forEach(finance => {
      if (categories[finance.category]) {
        categories[finance.category] += finance.amount;
      } else {
        categories[finance.category] = finance.amount;
      }
    });
  
  return categories;
};
