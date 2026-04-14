import { WorkOrder, WorkOrderStatus, Priority, Technician, ChatGroup, KPIData } from './types';

export const MOCK_KPI: KPIData[] = [
  { label: 'Today Approval Received', value: 12, colorClass: 'bg-gradient-to-r from-green-400 to-green-600' },
  { label: 'Unassigned Work Orders', value: 5, colorClass: 'bg-gradient-to-r from-orange-400 to-orange-600 animate-pulse' },
  { label: 'Cancelled Today', value: 2, colorClass: 'bg-gradient-to-r from-purple-400 to-purple-600' },
  { label: 'Invoice Pending', value: 8, colorClass: 'bg-gradient-to-r from-red-400 to-red-600' },
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  { 
    id: 'WO-2024-001', 
    customerName: 'Alice Johnson', 
    serviceType: 'HVAC Repair', 
    address: '123 Maple Ave, Austin, TX', 
    status: WorkOrderStatus.NEW, 
    priority: Priority.HIGH, 
    date: '2026-03-05', 
    createdAt: '2026-02-25T10:00:00Z',
    probability: 85,
    subtasks: [
      { id: 'S1', title: 'Check thermostat', isCompleted: true },
      { id: 'S2', title: 'Inspect condenser unit', isCompleted: false }
    ],
    history: [
      { id: 'H1', userId: 'ADMIN_001', userName: 'Kevin Ryan', action: 'Created Work Order', timestamp: '2024-05-15T10:00:00Z' }
    ]
  },
  { 
    id: 'WO-2024-002', 
    customerName: 'Bob Smith', 
    serviceType: 'Plumbing Leak', 
    address: '456 Oak Dr, Austin, TX', 
    status: WorkOrderStatus.ESTIMATE_APPROVED, 
    priority: Priority.MEDIUM, 
    date: '2026-03-06', 
    createdAt: '2026-02-26T11:30:00Z',
    assignedTechId: 'T1', 
    assignedTechName: 'Mike Ross',
    probability: 90,
    subtasks: [],
    materials: [
      { id: 'M1', name: 'PVC Pipe 2"', status: 'ORDERED', cost: 45.50 },
      { id: 'M2', name: 'Pipe Sealant', status: 'RECEIVED', cost: 12.99 },
      { id: 'M3', name: 'Replacement Valve', status: 'PENDING', cost: 85.00 }
    ],
    history: [
      { id: 'H2', userId: 'ADMIN_001', userName: 'Kevin Ryan', action: 'Created Work Order', timestamp: '2024-05-16T11:30:00Z' },
      { id: 'H3', userId: 'ADMIN_001', userName: 'Kevin Ryan', action: 'Assigned to Mike Ross', timestamp: '2024-05-16T14:00:00Z' }
    ]
  },
  { 
    id: 'WO-2024-003', 
    customerName: 'Charlie Davis', 
    serviceType: 'Electrical Outlet', 
    address: '789 Pine Ln, Dallas, TX', 
    status: WorkOrderStatus.IN_PROGRESS, 
    priority: Priority.LOW, 
    date: '2026-03-04', 
    createdAt: '2026-02-24T09:15:00Z',
    assignedTechId: 'T2', 
    assignedTechName: 'Sarah Connor',
    probability: 95,
    subtasks: [
      { id: 'S3', title: 'Replace outlet cover', isCompleted: false }
    ],
    materials: [
      { id: 'M4', name: 'Outlet Cover Plate', status: 'RECEIVED', cost: 5.99 },
      { id: 'M5', name: 'Wire Connectors', status: 'RECEIVED', cost: 2.50 }
    ],
    history: [
      { id: 'H4', userId: 'ADMIN_001', userName: 'Kevin Ryan', action: 'Created Work Order', timestamp: '2024-05-14T09:15:00Z' }
    ]
  },
  { 
    id: 'WO-2024-004', 
    customerName: 'Delta Corp', 
    serviceType: 'System Maintenance', 
    address: '101 Tech Blvd, Austin, TX', 
    status: WorkOrderStatus.COMPLETED, 
    priority: Priority.MEDIUM, 
    date: '2026-03-03', 
    createdAt: '2026-02-20T08:00:00Z',
    assignedTechId: 'T1', 
    assignedTechName: 'Mike Ross',
    probability: 100,
    subtasks: [],
    history: []
  },
  { 
    id: 'WO-2024-005', 
    customerName: 'Echo Properties', 
    serviceType: 'Emergency HVAC', 
    address: '202 Industrial Park, Houston, TX', 
    status: WorkOrderStatus.NEW, 
    priority: Priority.URGENT, 
    date: '2026-03-07', 
    createdAt: '2026-02-27T16:45:00Z',
    probability: 60,
    subtasks: [],
    history: []
  },
];

export const MOCK_TECHNICIANS: Technician[] = [
  { 
    id: 'T1', name: 'Mike Ross', trade: 'HVAC', status: 'Active', lat: 30.2672, lng: -97.7431, rating: 4.8, workload: 60,
    skills: ['AC Repair', 'Heating', 'Ventilation'],
    performanceHistory: [{ date: '2024-05-15', jobId: 'WO-2024-004', rating: 5, comment: 'Excellent work' }],
    schedule: [{ date: '2024-05-21', jobId: 'WO-2024-002', startTime: '09:00', endTime: '11:00' }]
  },
  { 
    id: 'T2', name: 'Sarah Connor', trade: 'Electrical', status: 'Busy', lat: 30.2700, lng: -97.7500, rating: 4.9, workload: 90,
    skills: ['Wiring', 'Circuit Breakers', 'Lighting'],
    performanceHistory: [{ date: '2024-05-10', jobId: 'WO-2024-003', rating: 4, comment: 'Good but took long' }],
    schedule: [{ date: '2024-05-19', jobId: 'WO-2024-003', startTime: '14:00', endTime: '17:00' }]
  },
  { 
    id: 'T3', name: 'John Wick', trade: 'Plumbing', status: 'Active', lat: 30.2600, lng: -97.7400, rating: 5.0, workload: 20,
    skills: ['Pipe Fitting', 'Drain Cleaning', 'Water Heaters'],
    performanceHistory: [],
    schedule: []
  },
  { 
    id: 'T4', name: 'Ellen Ripley', trade: 'General', status: 'On Leave', lat: 30.2800, lng: -97.7300, rating: 4.7, workload: 0,
    skills: ['Painting', 'Drywall', 'Carpentry'],
    performanceHistory: [],
    schedule: []
  },
];

export const MOCK_CHATS: ChatGroup[] = [
  { 
    id: 'G1', 
    name: 'Austin Technicians', 
    type: 'group', 
    members: ['T1', 'T2', 'T3', 'T4'],
    lastMessage: 'Traffic is heavy on I-35', 
    lastMessageTime: new Date(),
    unreadCount: 2, 
    avatar: 'https://picsum.photos/id/1011/50/50' 
  },
  { 
    id: 'G2', 
    name: 'HQ Dispatch', 
    type: 'group',
    members: ['ADMIN', 'D1'],
    lastMessage: 'New urgent WO in sector 4', 
    lastMessageTime: new Date(Date.now() - 3600000), // 1 hour ago
    unreadCount: 0, 
    avatar: 'https://picsum.photos/id/1012/50/50' 
  },
  { 
    id: 'G3', 
    name: 'Mike Ross', 
    type: 'direct',
    members: ['T1', 'ADMIN'],
    lastMessage: 'On my way to the next site.', 
    lastMessageTime: new Date(Date.now() - 1800000), // 30 mins ago
    unreadCount: 1, 
    avatar: 'https://picsum.photos/id/1025/50/50' 
  },
];