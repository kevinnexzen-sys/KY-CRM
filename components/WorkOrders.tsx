
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { WorkOrder, WorkOrderStatus, Priority, Subtask } from '../types';
import { generateEstimateAI } from '../services/geminiService';
import { 
  Plus, Search, Calendar, MapPin, User, MoreHorizontal, 
  X, Upload, ArrowLeft, ChevronDown, Phone, Sparkles, Building2,
  DollarSign, FileText, MessageSquare, Image, Mail, Camera, FilePlus,
  Clock, CheckCircle2, ListTodo, History, Bell, Trash2, ArrowUpDown, Loader2
} from 'lucide-react';

export const WorkOrders: React.FC = () => {
  const { workOrders, selectedWorkOrderId, setSelectedWorkOrderId, addWorkOrder, updateWorkOrder, composeEmail, generateInvoice, hasPermission, currentUser, corporations } = useData();
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  // Sync selectedOrder with selectedWorkOrderId from context
  useEffect(() => {
    if (selectedWorkOrderId) {
      const order = workOrders.find(o => o.id === selectedWorkOrderId);
      if (order) {
        handleRowClick(order);
      }
    } else {
      setSelectedOrder(null);
    }
  }, [selectedWorkOrderId, workOrders]);
  const [isGeneratingEstimate, setIsGeneratingEstimate] = useState(false);
  const [filterTab, setFilterTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [corporationFilter, setCorporationFilter] = useState('All Corporations');
  const [technicianFilter, setTechnicianFilter] = useState('All Technicians');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  // Form State
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    serviceType: 'HVAC',
    priority: Priority.MEDIUM,
    description: '',
    notes: '',
    corporation: 'Nexzen'
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newOrder.email)) {
      alert("Please enter a valid email address.");
      return;
    }

    const order: WorkOrder = {
      ...newOrder,
      id: `WO-${new Date().getFullYear()}-${String(workOrders.length + 1).padStart(3, '0')}`,
      status: WorkOrderStatus.NEW,
      date: new Date().toISOString().split('T')[0],
      probability: 0,
      createdAt: new Date().toISOString(),
      subtasks: [],
      history: []
    };
    addWorkOrder(order);
    setIsCreateModalOpen(false);
    // Reset form
    setNewOrder({
      customerName: '',
      email: '',
      phone: '',
      address: '',
      serviceType: 'HVAC',
      priority: Priority.MEDIUM,
      description: '',
      notes: '',
      corporation: 'Nexzen'
    });
  };

  const handleStatusChange = (newStatus: string) => {
     if(selectedOrder) {
         updateWorkOrder(selectedOrder.id, { status: newStatus as WorkOrderStatus });
         setSelectedOrder({ ...selectedOrder, status: newStatus });
     }
  };

  const handleRowClick = (order: WorkOrder) => {
    setSelectedWorkOrderId(order.id);
    setSelectedOrder({ 
        ...order, 
        phone: order.phone || '803-944-1388',
        email: order.email || 'customer@example.com',
        fee: order.fee || '$15', 
        serviceFee: order.serviceFee || '$50', 
        description: order.description || 'General maintenance request.',
        techName: order.assignedTechName || (order.assignedTechId ? 'Mike Johnson' : null),
        techPhone: order.techPhone || '(305) 555-1001',
        scheduleDateDisplay: order.scheduleDateDisplay || 'Tuesday, February 17, 2026',
        scheduleTime: order.scheduleTime || '13:00',
        corporation: order.corporation || 'Nexzen',
        reportText: order.reportText || 'No report available.', 
        notes: order.notes || '',
        laborCost: order.laborCost || 0,
        partsCost: order.partsCost || 0,
        timeline: order.timeline || [
            { title: 'Created', date: 'Jan 23, 2026 6:14 AM', active: true },
            { title: 'Tech Assigned', sub: order.assignedTechName || (order.assignedTechId ? 'Mike Johnson' : 'Pending'), active: !!order.assignedTechId },
            { title: 'Scheduled', date: 'Feb 17, 2026 13:00', active: order.status === WorkOrderStatus.SCHEDULED }
        ]
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !selectedOrder) return;
    const subtask: Subtask = {
      id: `S${Date.now()}`,
      title: newSubtask,
      isCompleted: false
    };
    const updatedSubtasks = [...(selectedOrder.subtasks || []), subtask];
    
    const historyEntry = {
      id: `H${Date.now()}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      action: `Added subtask: ${subtask.title}`,
      timestamp: new Date().toISOString()
    };

    updateWorkOrder(selectedOrder.id, { 
      subtasks: updatedSubtasks,
      history: [historyEntry, ...(selectedOrder.history || [])]
    });
    setSelectedOrder({ 
      ...selectedOrder, 
      subtasks: updatedSubtasks,
      history: [historyEntry, ...(selectedOrder.history || [])]
    });
    setNewSubtask('');
  };

  const toggleSubtask = (subtaskId: string) => {
    if (!selectedOrder) return;
    const subtask = selectedOrder.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    const newStatus = !subtask.isCompleted;
    const updatedSubtasks = selectedOrder.subtasks.map(s => 
      s.id === subtaskId ? { ...s, isCompleted: newStatus } : s
    );

    const historyEntry = {
      id: `H${Date.now()}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      action: `${newStatus ? 'Completed' : 'Uncompleted'} subtask: ${subtask.title}`,
      timestamp: new Date().toISOString()
    };

    updateWorkOrder(selectedOrder.id, { 
      subtasks: updatedSubtasks,
      history: [historyEntry, ...(selectedOrder.history || [])]
    });
    setSelectedOrder({ 
      ...selectedOrder, 
      subtasks: updatedSubtasks,
      history: [historyEntry, ...(selectedOrder.history || [])]
    });
  };

  const deleteSubtask = (subtaskId: string) => {
    if (!selectedOrder) return;
    const subtask = selectedOrder.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    const updatedSubtasks = selectedOrder.subtasks.filter(s => s.id !== subtaskId);

    const historyEntry = {
      id: `H${Date.now()}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      action: `Deleted subtask: ${subtask.title}`,
      timestamp: new Date().toISOString()
    };

    updateWorkOrder(selectedOrder.id, { 
      subtasks: updatedSubtasks,
      history: [historyEntry, ...(selectedOrder.history || [])]
    });
    setSelectedOrder({ 
      ...selectedOrder, 
      subtasks: updatedSubtasks,
      history: [historyEntry, ...(selectedOrder.history || [])]
    });
  };

  const handleUpdateSubtask = (subtaskId: string) => {
    if (!selectedOrder || !editingSubtaskTitle.trim()) {
      setEditingSubtaskId(null);
      return;
    }

    const subtask = selectedOrder.subtasks.find(s => s.id === subtaskId);
    if (!subtask || subtask.title === editingSubtaskTitle) {
      setEditingSubtaskId(null);
      return;
    }

    const oldTitle = subtask.title;
    const updatedSubtasks = selectedOrder.subtasks.map(s => 
      s.id === subtaskId ? { ...s, title: editingSubtaskTitle } : s
    );

    const historyEntry = {
      id: `H${Date.now()}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System',
      action: `Renamed subtask from "${oldTitle}" to "${editingSubtaskTitle}"`,
      timestamp: new Date().toISOString()
    };

    updateWorkOrder(selectedOrder.id, { 
      subtasks: updatedSubtasks,
      history: [historyEntry, ...(selectedOrder.history || [])]
    });
    setSelectedOrder({ 
      ...selectedOrder, 
      subtasks: updatedSubtasks,
      history: [historyEntry, ...(selectedOrder.history || [])]
    });
    setEditingSubtaskId(null);
  };

  const filteredOrders = workOrders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          order.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCorp = corporationFilter === 'All Corporations' || order.corporation === corporationFilter;
    const matchesTech = technicianFilter === 'All Technicians' || 
                        (technicianFilter === 'Unassigned' && !order.assignedTechId) ||
                        (order.assignedTechId === technicianFilter);
    return matchesSearch && matchesCorp && matchesTech;
  }).sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === 'priority') {
      const pMap = { [Priority.URGENT]: 4, [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
      return sortOrder === 'asc' ? pMap[a.priority] - pMap[b.priority] : pMap[b.priority] - pMap[a.priority];
    }
    return sortOrder === 'asc' 
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case WorkOrderStatus.NEW: return 'bg-blue-50 text-blue-700 border-blue-200';
      case WorkOrderStatus.SCHEDULED: return 'bg-purple-50 text-purple-700 border-purple-200';
      case WorkOrderStatus.IN_PROGRESS: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case WorkOrderStatus.COMPLETED: return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    return 'bg-blue-100 text-blue-700 border-blue-200'; // Matching "normal" look in image
  };

  const { technicians, autoAssignTechnician } = useData();

  const handleAutoAssign = () => {
    if (!selectedOrder) return;
    const techId = autoAssignTechnician(selectedOrder);
    if (techId) {
      const tech = technicians.find(t => t.id === techId);
      updateWorkOrder(selectedOrder.id, { 
        assignedTechId: techId, 
        assignedTechName: tech?.name,
        status: WorkOrderStatus.SCHEDULED 
      });
      setSelectedOrder({ 
        ...selectedOrder, 
        assignedTechId: techId, 
        techName: tech?.name,
        status: WorkOrderStatus.SCHEDULED 
      });
      alert(`AI Suggestion: Assigned ${tech?.name} to this job.`);
    } else {
      alert("No available technicians found for this service type.");
    }
  };

  const handleGenerateAIEstimate = async () => {
    if (!selectedOrder || !selectedOrder.reportText) {
      alert("Please ensure there is an inspection report before generating an estimate.");
      return;
    }

    setIsGeneratingEstimate(true);
    try {
      const estimate = await generateEstimateAI(selectedOrder.reportText);
      
      // Calculate costs from line items
      const laborCost = estimate.lineItems
        .filter((item: any) => item.type === 'Labor')
        .reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
      
      const partsCost = estimate.lineItems
        .filter((item: any) => item.type === 'Part')
        .reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);

      const historyEntry = {
        id: `H${Date.now()}`,
        userId: currentUser?.id || 'system',
        userName: currentUser?.name || 'System',
        action: `AI Generated Estimate: ${estimate.summary}`,
        details: `Total: $${estimate.totalAmount}. Recommendations: ${estimate.recommendations}`,
        timestamp: new Date().toISOString()
      };

      const updatedOrder = {
        ...selectedOrder,
        laborCost,
        partsCost,
        notes: `${selectedOrder.notes}\n\n--- AI ESTIMATE SUMMARY ---\n${estimate.summary}\n\nRecommendations: ${estimate.recommendations}`,
        history: [historyEntry, ...(selectedOrder.history || [])]
      };

      updateWorkOrder(selectedOrder.id, {
        laborCost,
        partsCost,
        notes: updatedOrder.notes,
        history: updatedOrder.history
      });
      
      setSelectedOrder(updatedOrder);
      alert("AI Estimate generated successfully!");
    } catch (error) {
      console.error("Failed to generate AI estimate:", error);
      alert("Failed to generate AI estimate. Please try again.");
    } finally {
      setIsGeneratingEstimate(false);
    }
  };

  // --- DETAIL VIEW ---
  if (selectedOrder) {
    return (
      <div className="h-full flex flex-col animate-in slide-in-from-right-4 fade-in duration-300 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-start gap-4">
                <button 
                    onClick={() => {
                        setSelectedOrder(null);
                        setSelectedWorkOrderId(null);
                    }} 
                    className="mt-1 p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-2xl font-bold text-slate-900">{selectedOrder.id}</h2>
                        <span className={`px-3 py-1 text-xs font-medium rounded-md border ${
                            selectedOrder.status === WorkOrderStatus.COMPLETED ? 'bg-green-100 text-green-700 border-green-200' :
                            selectedOrder.reportText ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                            {selectedOrder.status === WorkOrderStatus.COMPLETED ? 'completed' : 
                             selectedOrder.reportText ? 'inspection completed' : 
                             selectedOrder.status.toLowerCase()}
                        </span>
                    </div>
                    <p className="text-slate-900 font-medium">{selectedOrder.customerName}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => composeEmail(selectedOrder.email || '', `Regarding Work Order ${selectedOrder.id}`, `Hello ${selectedOrder.customerName},\n\n`)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                    <Mail className="w-4 h-4" /> Send Email
                </button>
                <div className="relative w-48">
                    <select 
                        className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2.5 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm shadow-sm"
                        value={selectedOrder.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                    >
                        {Object.values(WorkOrderStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto pb-20 pr-2">
            
            {/* LEFT COLUMN (Main Content) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Customer, Property & Service Details */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 text-sm mb-6">Customer & Property</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">Customer</p>
                                <p className="font-medium text-slate-900">{selectedOrder.customerName}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                                <p className="font-medium text-slate-900">{selectedOrder.phone}</p> 
                            </div>
                        </div>
                        <div className="flex items-start gap-4 col-span-2">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-0.5">Property Address</p>
                                <p className="font-medium text-slate-900">{selectedOrder.address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="font-bold text-slate-900 text-sm mb-4">Service Details</h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Service Type</p>
                                <p className="font-bold text-slate-900">General Maintenance</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Priority</p>
                                <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                                    normal
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Service Call Fee</p>
                                <p className="font-bold text-slate-900">$15</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technician & Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 text-sm">Technician & Schedule</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleAutoAssign}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-50"
                            >
                                <Sparkles className="w-3 h-3" /> AI Auto-Assign
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">
                                <User className="w-3 h-3" /> Manual Assign
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">
                                <Calendar className="w-3 h-3" /> Schedule
                            </button>
                        </div>
                    </div>

                    <div className="bg-emerald-50/50 rounded-xl p-4 flex items-center gap-4 mb-6 border border-emerald-100">
                        <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-lg">
                            {selectedOrder.techName ? selectedOrder.techName.charAt(0) : 'U'}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{selectedOrder.techName || "Unassigned"}</p>
                            <p className="text-sm text-slate-500">{selectedOrder.techPhone || "--"}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                         <div className="flex gap-6">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">{selectedOrder.scheduleDateDisplay}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{selectedOrder.scheduleTime}</span>
                            </div>
                         </div>
                         <div className="px-4 py-2 border-2 border-slate-800 rounded-lg font-bold text-slate-800 text-sm">
                             Service Fee {selectedOrder.serviceFee}
                         </div>
                    </div>
                </div>

                {/* Financials & Invoicing */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 text-sm">Financials & Invoicing</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleGenerateAIEstimate}
                                disabled={isGeneratingEstimate}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
                            >
                                {isGeneratingEstimate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                AI Generate Estimate
                            </button>
                            {selectedOrder.status === WorkOrderStatus.COMPLETED && (
                            <button 
                                onClick={() => {
                                    generateInvoice(selectedOrder.id);
                                    setSelectedOrder({ ...selectedOrder, status: WorkOrderStatus.INVOICED });
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                <FilePlus className="w-4 h-4" /> Generate Invoice
                            </button>
                        )}
                        {selectedOrder.status === WorkOrderStatus.INVOICED && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Invoiced
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Labor Cost ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="number" 
                                    value={selectedOrder.laborCost}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setSelectedOrder({ ...selectedOrder, laborCost: val });
                                        updateWorkOrder(selectedOrder.id, { laborCost: val });
                                    }}
                                    className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Parts Cost ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input 
                                    type="number" 
                                    value={selectedOrder.partsCost}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setSelectedOrder({ ...selectedOrder, partsCost: val });
                                        updateWorkOrder(selectedOrder.id, { partsCost: val });
                                    }}
                                    className="w-full pl-9 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Total Estimated Amount</span>
                        <span className="text-xl font-bold text-slate-900">
                            ${((selectedOrder.laborCost || 0) + (selectedOrder.partsCost || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Subtasks Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-emerald-600" /> Subtasks
                        </h3>
                        <span className="text-xs font-medium text-slate-500">
                            {selectedOrder.subtasks?.filter(s => s.isCompleted).length || 0} / {selectedOrder.subtasks?.length || 0} Completed
                        </span>
                    </div>

                    <div className="space-y-3 mb-6">
                        {selectedOrder.subtasks?.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                                <div className="flex items-center gap-3 flex-1">
                                    <button 
                                        onClick={() => toggleSubtask(sub.id)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${sub.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 hover:border-emerald-400'}`}
                                    >
                                        {sub.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </button>
                                    
                                    {editingSubtaskId === sub.id ? (
                                        <input 
                                            autoFocus
                                            type="text"
                                            value={editingSubtaskTitle}
                                            onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                                            onBlur={() => handleUpdateSubtask(sub.id)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubtask(sub.id)}
                                            className="flex-1 bg-white border border-emerald-500 rounded px-2 py-0.5 text-sm focus:outline-none"
                                        />
                                    ) : (
                                        <span 
                                            onClick={() => {
                                                setEditingSubtaskId(sub.id);
                                                setEditingSubtaskTitle(sub.title);
                                            }}
                                            className={`text-sm cursor-text flex-1 ${sub.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'}`}
                                        >
                                            {sub.title}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => deleteSubtask(sub.id)}
                                    className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {(!selectedOrder.subtasks || selectedOrder.subtasks.length === 0) && (
                            <div className="text-center py-6 text-slate-400 text-sm italic">
                                No subtasks added yet.
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                            placeholder="Add a new subtask..."
                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                        <button 
                            onClick={handleAddSubtask}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>

                {/* Audit Log / History */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2">
                        <History className="w-4 h-4 text-purple-600" /> Audit Log
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedOrder.history?.map(log => (
                            <div key={log.id} className="flex gap-3 pb-4 border-b border-slate-50 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-slate-900">{log.userName}</span>
                                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 font-medium">{log.action}</p>
                                    {log.details && <p className="text-[10px] text-slate-400 mt-1 italic">{log.details}</p>}
                                </div>
                            </div>
                        ))}
                        {(!selectedOrder.history || selectedOrder.history.length === 0) && (
                            <div className="text-center py-6 text-slate-400 text-sm italic">
                                No history recorded.
                            </div>
                        )}
                    </div>
                </div>

                {/* Inspection Report & Photos */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[300px]">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900 text-sm">Inspection Report & Photos</h3>
                        <div className="flex gap-2">
                             <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">
                                <FileText className="w-3 h-3" /> Add Report
                             </button>
                             <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">
                                <Camera className="w-3 h-3" /> Add Photos
                             </button>
                        </div>
                     </div>

                     <div className="mb-6">
                        <p className="text-xs text-slate-500 mb-2">Notes / Outcomes</p>
                        <textarea 
                            value={selectedOrder.notes}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedOrder({ ...selectedOrder, notes: val });
                                updateWorkOrder(selectedOrder.id, { notes: val });
                            }}
                            className="w-full p-4 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100 min-h-[100px] focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                            placeholder="Add notes or outcomes for this work order..."
                        />
                     </div>

                     <div className="mb-6">
                        <p className="text-xs text-slate-500 mb-2">Report</p>
                        <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100 min-h-[60px]">
                            {selectedOrder.reportText}
                        </div>
                     </div>

                     <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        <Image className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm">No inspection photos yet</span>
                     </div>
                </div>
            </div>

            {/* RIGHT COLUMN (Sidebar) */}
            <div className="space-y-6">
                
                {/* Corporation */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Corporation</p>
                        <p className="font-bold text-slate-900">{selectedOrder.corporation}</p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm">Quick Actions</h3>
                    <div className="space-y-3">
                        <button 
                            onClick={handleGenerateAIEstimate}
                            disabled={isGeneratingEstimate}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold shadow-sm shadow-emerald-100 disabled:opacity-50"
                        >
                            {isGeneratingEstimate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            AI Generate Estimate
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                            <DollarSign className="w-4 h-4 text-slate-400" /> Create Estimate
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                            <FilePlus className="w-4 h-4 text-slate-400" /> Create Invoice
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700">
                            <MessageSquare className="w-4 h-4 text-slate-400" /> Post to Group
                        </button>
                    </div>
                </div>

                {/* Reminders Section */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Bell className="w-4 h-4 text-orange-500" /> Reminders
                        </h3>
                        {hasPermission('customize_reminders') && (
                            <button 
                                onClick={() => {
                                    const newSet = !selectedOrder.reminderSet;
                                    updateWorkOrder(selectedOrder.id, { reminderSet: newSet });
                                    setSelectedOrder({ ...selectedOrder, reminderSet: newSet });
                                }}
                                className={`text-xs font-bold px-2 py-1 rounded transition-colors ${selectedOrder.reminderSet ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}
                            >
                                {selectedOrder.reminderSet ? 'Enabled' : 'Disabled'}
                            </button>
                        )}
                    </div>
                    
                    {selectedOrder.reminderSet ? (
                        <div className="space-y-3">
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <p className="text-xs font-bold text-orange-900 mb-1">Due Date Reminder</p>
                                <p className="text-[10px] text-orange-700">Notification will be sent 2 hours before due date.</p>
                            </div>
                            {hasPermission('customize_reminders') && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Custom Reminder Time</label>
                                    <input 
                                        type="datetime-local" 
                                        value={selectedOrder.reminderTime || ''}
                                        onChange={(e) => {
                                            updateWorkOrder(selectedOrder.id, { reminderTime: e.target.value });
                                            setSelectedOrder({ ...selectedOrder, reminderTime: e.target.value });
                                        }}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-orange-500/20 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No reminders set for this work order.</p>
                    )}
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-4 text-sm">Timeline</h3>
                    <div className="space-y-6 relative before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {selectedOrder.timeline.map((event: any, idx: number) => (
                        <div key={idx} className="relative pl-6">
                            <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white ${event.active ? 'bg-purple-600' : 'bg-orange-400'}`}></div>
                            <div>
                                <p className="text-sm font-medium text-slate-900">{event.title}</p>
                                {event.date && <p className="text-xs text-slate-500 mt-0.5">{event.date}</p>}
                                {event.sub && <p className="text-xs text-slate-500 mt-0.5">{event.sub}</p>}
                            </div>
                        </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-sm transition-colors">
                    Save Changes
                </button>

            </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Work Orders</h2>
          <p className="text-slate-500 text-sm">Manage and track field service requests</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Work Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Filter Controls Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-4">
          
          {/* Top Row: Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {['All', 'Today Scheduled', 'Today New', 'Tomorrow', 'Upcoming'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-full border transition-all whitespace-nowrap ${
                  filterTab === tab 
                    ? 'bg-slate-800 text-white border-slate-800' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Bottom Row: Search & Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search work orders, customers, IDs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
            
            <div className="flex flex-wrap gap-4">
                <div className="relative">
                    <select 
                        value={corporationFilter}
                        onChange={(e) => setCorporationFilter(e.target.value)}
                        className="appearance-none h-full bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm cursor-pointer"
                    >
                        <option>All Corporations</option>
                        {corporations.map(corp => (
                          <option key={corp.id} value={corp.name}>{corp.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="relative">
                    <select 
                        value={technicianFilter}
                        onChange={(e) => setTechnicianFilter(e.target.value)}
                        className="appearance-none h-full bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm cursor-pointer"
                    >
                        <option>All Technicians</option>
                        <option value="Unassigned">Unassigned</option>
                        {technicians.map(tech => (
                          <option key={tech.id} value={tech.id}>{tech.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>

                <div className="relative">
                    <select className="appearance-none h-full bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm cursor-pointer">
                        <option>All Time</option>
                        <option>This Week</option>
                        <option>This Month</option>
                    </select>
                    <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => {
                      if (sortBy === 'createdAt') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else setSortBy('createdAt');
                    }}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Order ID <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Technician</th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => {
                      if (sortBy === 'date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else setSortBy('date');
                    }}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Schedule <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">
                  <button 
                    onClick={() => {
                      if (sortBy === 'priority') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      else setSortBy('priority');
                    }}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Priority <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr 
                    key={order.id} 
                    onClick={() => handleRowClick(order)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{order.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{order.customerName}</span>
                      <span className="text-xs text-slate-500 truncate max-w-[150px] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {order.address.split(',')[0]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-700">{order.serviceType}</span>
                  </td>
                  <td className="px-6 py-4">
                     {order.assignedTechId ? (
                        <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                                {order.assignedTechId.charAt(1)}
                             </div>
                             <span className="text-emerald-600 font-medium text-xs">Assigned</span>
                        </div>
                     ) : (
                        <span className="text-orange-500 text-xs font-medium flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 w-fit">
                            <Sparkles className="w-3 h-3" /> Unassigned
                        </span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {order.date}
                      </div>
                      <span className="text-[10px] text-slate-400">Created: {new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          composeEmail(order.email || '', `Regarding Work Order ${order.id}`, `Hello ${order.customerName},\n\n`);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 p-1 hover:bg-emerald-50 rounded-full transition-colors"
                        title="Send Email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Create New Work Order</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium text-slate-700">Corporation</label>
                      <select 
                        value={newOrder.corporation}
                        onChange={(e) => setNewOrder({...newOrder, corporation: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                          <option value="None">None</option>
                          {corporations.map(corp => (
                            <option key={corp.id} value={corp.name}>{corp.name}</option>
                          ))}
                      </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-700">Customer Name</label>
                    <input 
                        required 
                        type="text" 
                        value={newOrder.customerName}
                        onChange={(e) => setNewOrder({...newOrder, customerName: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="John Doe" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input 
                        required 
                        type="email" 
                        value={newOrder.email}
                        onChange={(e) => setNewOrder({...newOrder, email: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="john@example.com" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone</label>
                    <input 
                        type="text" 
                        value={newOrder.phone}
                        onChange={(e) => setNewOrder({...newOrder, phone: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="(555) 000-0000" 
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-700">Service Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={newOrder.address}
                        onChange={(e) => setNewOrder({...newOrder, address: e.target.value})}
                        className="w-full pl-9 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="Street, City, Zip" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Service Type</label>
                    <select 
                        value={newOrder.serviceType}
                        onChange={(e) => setNewOrder({...newOrder, serviceType: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option>HVAC</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>General Repair</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Priority</label>
                    <select 
                        value={newOrder.priority}
                        onChange={(e) => setNewOrder({...newOrder, priority: e.target.value as Priority})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value={Priority.LOW}>Low</option>
                      <option value={Priority.MEDIUM}>Medium</option>
                      <option value={Priority.HIGH}>High</option>
                      <option value={Priority.URGENT}>Urgent</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <textarea 
                        rows={3} 
                        value={newOrder.description}
                        onChange={(e) => setNewOrder({...newOrder, description: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="Describe the issue..."
                    ></textarea>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-700">Notes / Outcomes</label>
                    <textarea 
                        rows={3} 
                        value={newOrder.notes}
                        onChange={(e) => setNewOrder({...newOrder, notes: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="Initial notes or expected outcomes..."
                    ></textarea>
                  </div>
                   <div className="col-span-2 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 transition-colors">
                    <Upload className="w-8 h-8 mb-2 text-slate-400" />
                    <span className="text-sm">Drag & drop files or click to upload</span>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium shadow-sm">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
