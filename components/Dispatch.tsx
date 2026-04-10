
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { MapPin, User, Phone, Star, Clock, Filter, Search, ChevronRight, AlertCircle, CheckCircle2, Navigation, Zap } from 'lucide-react';
import { WorkOrder, Technician, WorkOrderStatus } from '../types';

export const Dispatch: React.FC = () => {
  const { workOrders, technicians, updateWorkOrder, autoAssignTechnician } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  const unassignedOrders = workOrders.filter(wo => !wo.assignedTechId && wo.status !== WorkOrderStatus.COMPLETED && wo.status !== WorkOrderStatus.CANCELLED);
  
  const filteredOrders = unassignedOrders.filter(wo => 
    wo.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wo.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAutoAssign = (order: WorkOrder) => {
    const techId = autoAssignTechnician(order);
    if (techId) {
      const tech = technicians.find(t => t.id === techId);
      updateWorkOrder(order.id, { 
        assignedTechId: techId, 
        assignedTechName: tech?.name,
        status: WorkOrderStatus.SCHEDULED
      });
      // In a real app, we'd send a notification here
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Technician Dispatch</h1>
          <p className="text-sm text-slate-500">Assign jobs based on location, skills, and availability</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search unassigned jobs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/50 outline-none w-64 transition-all"
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Unassigned Jobs List */}
        <div className="w-1/3 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Unassigned Jobs
              <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{filteredOrders.length}</span>
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3 opacity-20" />
                <p className="text-sm text-slate-400 font-medium">All jobs assigned!</p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div 
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedOrder?.id === order.id ? 'bg-emerald-50 border-emerald-200 shadow-md shadow-emerald-100' : 'bg-white border-slate-200 hover:border-emerald-200 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.priority === 'Urgent' ? 'bg-red-100 text-red-600' : 
                      order.priority === 'High' ? 'bg-orange-100 text-orange-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {order.priority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{order.id}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{order.customerName}</h3>
                  <p className="text-xs text-slate-500 mb-3">{order.serviceType}</p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{order.address}</span>
                  </div>
                  
                  {selectedOrder?.id === order.id && (
                    <div className="mt-4 pt-4 border-t border-emerald-100 flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAutoAssign(order); }}
                        className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3 h-3" /> Auto-Dispatch
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Technician Availability & Assignment */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Technician Availability</h2>
              <p className="text-xs text-slate-500">Live status and workload monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Busy</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {technicians.map(tech => {
                const isMatch = selectedOrder && tech.trade === (selectedOrder.serviceType.split(' ')[0] || 'General');
                
                return (
                  <div key={tech.id} className={`p-4 rounded-2xl border transition-all ${isMatch ? 'bg-emerald-50/50 border-emerald-200 ring-2 ring-emerald-500/10' : 'bg-slate-50/50 border-slate-200'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-700 shadow-sm">
                          {tech.name.charAt(0)}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${tech.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{tech.name}</h3>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-bold">{tech.rating}</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tech.trade}</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Workload</span>
                        <span>{tech.workload}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${tech.workload > 80 ? 'bg-red-500' : tech.workload > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${tech.workload}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        <span>2.4 miles away</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Next available: 2:00 PM</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all">
                        View Profile
                      </button>
                      {selectedOrder && (
                        <button 
                          onClick={() => {
                            updateWorkOrder(selectedOrder.id, { 
                              assignedTechId: tech.id, 
                              assignedTechName: tech.name,
                              status: WorkOrderStatus.SCHEDULED
                            });
                            setSelectedOrder(null);
                          }}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition-all"
                        >
                          Assign Job
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
