import React, { useState } from 'react';
import { 
  Package, UserX, Calendar, MapPin, AlertCircle, 
  CheckCircle2, XCircle, FileText, DollarSign, 
  CreditCard, Clock, Search, Plus, MoreHorizontal,
  ChevronDown, ChevronRight, ArrowLeft, Phone,
  Sparkles, User, Image, Building2, MessageSquare, Mail,
  Snowflake, Wrench, Zap
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { WorkOrder, WorkOrderStatus, Priority, View } from '../types';

export const Dashboard: React.FC = () => {
  const { workOrders, navigateTo, setSelectedWorkOrderId } = useData();
  const [activeTab, setActiveTab] = useState('All');

  // Dynamic KPI Calculations
  const newOrdersToday = workOrders.filter(wo => {
      const woDate = new Date(wo.date);
      const today = new Date();
      return wo.status === WorkOrderStatus.NEW && 
             woDate.getDate() === today.getDate() &&
             woDate.getMonth() === today.getMonth() &&
             woDate.getFullYear() === today.getFullYear();
  }).length;

  const unassignedOrders = workOrders.filter(wo => !wo.assignedTechId && wo.status !== WorkOrderStatus.COMPLETED && wo.status !== WorkOrderStatus.CANCELLED).length;
  
  const scheduledToday = workOrders.filter(wo => {
      const woDate = new Date(wo.date);
      const today = new Date();
      return wo.status === WorkOrderStatus.SCHEDULED && 
             woDate.getDate() === today.getDate() &&
             woDate.getMonth() === today.getMonth();
  }).length;

  const handleRowClick = (order: WorkOrder) => {
    setSelectedWorkOrderId(order.id);
    navigateTo(View.WORK_ORDERS);
  };

  const getStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case WorkOrderStatus.NEW: return 'bg-blue-100 text-blue-600 border-blue-100';
      case WorkOrderStatus.SCHEDULED: return 'bg-purple-100 text-purple-600 border-purple-100';
      case WorkOrderStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-600 border-yellow-100';
      case WorkOrderStatus.COMPLETED: return 'bg-emerald-100 text-emerald-600 border-emerald-100';
      case WorkOrderStatus.CANCELLED: return 'bg-red-100 text-red-600 border-red-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-100';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'bg-red-100 text-red-600 border-red-100';
      case Priority.HIGH: return 'bg-orange-100 text-orange-600 border-orange-100';
      case Priority.MEDIUM: return 'bg-yellow-100 text-yellow-600 border-yellow-100';
      case Priority.LOW: return 'bg-slate-100 text-slate-600 border-slate-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-100';
    }
  };

  const getServiceIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('hvac')) return <Snowflake className="w-4 h-4 text-blue-400" />;
    if (t.includes('plumbing')) return <Wrench className="w-4 h-4 text-slate-400" />;
    if (t.includes('electrical')) return <Zap className="w-4 h-4 text-orange-400" />;
    return <Sparkles className="w-4 h-4 text-emerald-400" />;
  };

  const filteredWorkOrders = workOrders.filter(wo => {
    if (activeTab === 'All') return true;
    const woDate = new Date(wo.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (activeTab === 'Today Scheduled') {
      return wo.status === WorkOrderStatus.SCHEDULED && 
             woDate.getDate() === today.getDate() &&
             woDate.getMonth() === today.getMonth();
    }
    if (activeTab === 'Today New') {
      return wo.status === WorkOrderStatus.NEW && 
             woDate.getDate() === today.getDate() &&
             woDate.getMonth() === today.getMonth();
    }
    if (activeTab === 'Tomorrow') {
      return woDate.getDate() === tomorrow.getDate() &&
             woDate.getMonth() === tomorrow.getMonth();
    }
    if (activeTab === 'Upcoming') {
      return woDate > today;
    }
    return true;
  });

  // --- DASHBOARD VIEW ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          Welcome back, Kevin! <span className="text-2xl">👋</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening with your business today.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: New Orders Today */}
        <div className="bg-[#22C55E] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden h-32 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">New Orders Today</p>
            <h3 className="text-4xl font-bold mt-1">{newOrdersToday}</h3>
          </div>
          <p className="text-xs opacity-80 flex items-center gap-1">
             ↑ +12% from yesterday
          </p>
          <Package className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 w-14 h-14" />
        </div>

        {/* Card 2: Unassigned Orders */}
        <div className="bg-[#F59E0B] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden h-32 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Unassigned Orders</p>
            <h3 className="text-4xl font-bold mt-1">{unassignedOrders}</h3>
          </div>
          <UserX className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 w-14 h-14" />
        </div>

        {/* Card 3: Scheduled Today */}
        <div className="bg-[#A855F7] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden h-32 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Scheduled Today</p>
            <h3 className="text-4xl font-bold mt-1">{scheduledToday}</h3>
          </div>
           <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 w-14 h-14" />
        </div>

        {/* Card 4: Techs On Site */}
        <div className="bg-[#475569] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden h-32 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Techs On Site</p>
            <h3 className="text-4xl font-bold mt-1">0</h3>
          </div>
          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 w-14 h-14" />
        </div>

        {/* Card 5: Incomplete Visits */}
        <div className="bg-[#F43F5E] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden h-32 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Incomplete Visits</p>
            <h3 className="text-4xl font-bold mt-1">1</h3>
          </div>
          <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 w-14 h-14" />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Action 1: Approval Received */}
          <div 
            onClick={() => navigateTo(View.WORK_ORDERS)}
            className="bg-[#14B8A6] p-5 rounded-2xl text-white flex justify-between items-center cursor-pointer hover:opacity-95 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold bg-white/30 px-1.5 py-0.5 rounded w-fit mb-1">New</span>
                 <span className="text-sm font-bold">Approval Received</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">1</span>
               <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 2: Previous Unassigned Orders */}
          <div 
            onClick={() => navigateTo(View.WORK_ORDERS)}
            className="bg-[#F43F5E] p-5 rounded-2xl text-white flex justify-between items-center cursor-pointer hover:opacity-95 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/20">
                <UserX className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Previous Unassigned Orders</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">1</span>
               <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 3: Today's Cancelled Orders */}
          <div className="bg-[#475569] p-5 rounded-2xl text-white flex justify-between items-center cursor-pointer hover:opacity-95 transition-all shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/20">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Today's Cancelled Orders</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">0</span>
               <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 4: Invoice Pending Orders */}
          <div className="bg-[#EF4444] p-5 rounded-2xl text-white flex justify-between items-center cursor-pointer hover:opacity-95 transition-all shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/20">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Invoice Pending Orders</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">0</span>
               <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 5: Ready to Collect SCF */}
          <div className="bg-[#22C55E] p-5 rounded-2xl text-white flex justify-between items-center cursor-pointer hover:opacity-95 transition-all shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Ready to Collect SCF</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">1</span>
               <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 6: Ready for Processor */}
          <div className="bg-[#F59E0B] p-5 rounded-2xl text-white flex justify-between items-center cursor-pointer hover:opacity-95 transition-all shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/20">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Ready for Processor</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">1</span>
               <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 7: Tech Ready to Pay */}
          <div className="bg-[#3B82F6] p-5 rounded-2xl text-white flex justify-between items-center cursor-pointer hover:opacity-95 transition-all shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Tech Ready to Pay</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">0</span>
               <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 8: Tenant Pending Payment */}
          <div className="bg-[#EF4444] p-5 rounded-2xl text-white flex justify-between items-center cursor-pointer hover:opacity-95 transition-all shadow-sm group">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-white/20">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-bold">Tenant Pending Payment</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-xl font-bold">0</span>
               <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* Work Orders Table Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
            <div>
                <h3 className="text-2xl font-bold text-slate-900">Work Orders</h3>
                <p className="text-sm text-slate-500 mt-1">Manage field service operations ({workOrders.length} orders)</p>
            </div>
            <button 
                onClick={() => navigateTo(View.WORK_ORDERS)}
                className="bg-[#6366F1] text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#4F46E5] transition-colors shadow-sm"
            >
                <Plus className="w-5 h-5" /> Create Work Order
            </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl w-fit border border-slate-200">
            {['All', 'Today Scheduled', 'Today New', 'Tomorrow', 'Upcoming'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {tab} ({tab === 'All' ? workOrders.length : workOrders.filter(wo => {
                        const woDate = new Date(wo.date);
                        const today = new Date();
                        const tomorrow = new Date(today);
                        tomorrow.setDate(today.getDate() + 1);
                        if (tab === 'Today Scheduled') return wo.status === WorkOrderStatus.SCHEDULED && woDate.getDate() === today.getDate() && woDate.getMonth() === today.getMonth();
                        if (tab === 'Today New') return wo.status === WorkOrderStatus.NEW && woDate.getDate() === today.getDate() && woDate.getMonth() === today.getMonth();
                        if (tab === 'Tomorrow') return woDate.getDate() === tomorrow.getDate() && woDate.getMonth() === tomorrow.getMonth();
                        if (tab === 'Upcoming') return woDate > today;
                        return false;
                    }).length})
                </button>
            ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search work orders..." 
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
            </div>
            <div className="flex gap-3">
                <div className="relative">
                    <select className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-sm min-w-[140px]">
                        <option>All Time</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <select className="appearance-none bg-white border border-slate-200 text-slate-700 py-3 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium text-sm min-w-[160px]">
                        <option>All Corporations</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-5 font-bold">Order</th>
                        <th className="px-6 py-5 font-bold">Customer</th>
                        <th className="px-6 py-5 font-bold">Service</th>
                        <th className="px-6 py-5 font-bold">Technician</th>
                        <th className="px-6 py-5 font-bold">Schedule</th>
                        <th className="px-6 py-5 font-bold">Status</th>
                        <th className="px-6 py-5 font-bold">Priority</th>
                        <th className="px-6 py-5 font-bold"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredWorkOrders.slice(0, 5).map((order) => (
                        <tr 
                            key={order.id} 
                            onClick={() => handleRowClick(order)} 
                            className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                            <td className="px-6 py-5">
                                <span className="font-bold text-slate-400 block text-xs mb-0.5">N/A</span>
                                <span className="font-bold text-slate-700 block group-hover:text-emerald-600 transition-colors">{order.id}</span>
                            </td>
                            <td className="px-6 py-5">
                                 <span className="font-bold text-slate-800 block mb-0.5">{order.customerName}</span>
                                 <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[180px]">
                                    <MapPin className="w-3 h-3 text-slate-300"/> {order.address.split(',')[1] || order.address}
                                 </span>
                            </td>
                            <td className="px-6 py-5">
                                <span className="flex items-center gap-2.5 font-bold text-slate-600">
                                    {getServiceIcon(order.serviceType)}
                                    {order.serviceType}
                                </span>
                            </td>
                            <td className="px-6 py-5">
                                {order.assignedTechId ? (
                                    <span className="text-slate-700 font-bold text-xs">{order.assignedTechId}</span>
                                ) : (
                                    <span className="text-[#F59E0B] text-xs font-bold">Unassigned</span>
                                )}
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                                    <Calendar className="w-3.5 h-3.5 opacity-60" /> 
                                    {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(order.status)} uppercase tracking-tight`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-5">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${getPriorityColor(order.priority)} uppercase tracking-tight`}>
                                    {order.priority}
                                </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                                <MoreHorizontal className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors ml-auto" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
