import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { CheckCircle2, Package, Clock, AlertCircle, Search, Filter, FileText, DollarSign, ArrowRight } from 'lucide-react';
import { WorkOrder } from '../types';

export const ApprovedWorkOrders: React.FC = () => {
  const { workOrders, updateWorkOrder } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const approvedOrders = workOrders.filter(wo => 
    wo.status === 'Estimate Approved' || wo.status === 'Scheduled' || wo.status === 'In Progress'
  );

  const filteredOrders = approvedOrders.filter(wo => {
    const matchesSearch = wo.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          wo.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'NEEDS_MATERIALS') {
      return wo.materials?.some(m => m.status === 'PENDING');
    }
    if (filterStatus === 'MATERIALS_ORDERED') {
      return wo.materials?.some(m => m.status === 'ORDERED');
    }
    if (filterStatus === 'READY_TO_SCHEDULE') {
      return !wo.materials?.some(m => m.status === 'PENDING' || m.status === 'ORDERED');
    }
    return true;
  });

  const handleMaterialStatusChange = (woId: string, materialId: string, newStatus: 'PENDING' | 'ORDERED' | 'RECEIVED') => {
    const wo = workOrders.find(w => w.id === woId);
    if (!wo || !wo.materials) return;

    const updatedMaterials = wo.materials.map(m => 
      m.id === materialId ? { ...m, status: newStatus } : m
    );

    updateWorkOrder(woId, { materials: updatedMaterials });
  };

  const calculateMaterialCosts = (materials: any[]) => {
    return materials.reduce((sum, m) => sum + (m.cost || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Approved Work Orders</h2>
          <p className="text-sm text-slate-500">Manage materials and scheduling for approved estimates</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search approved orders..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {[
            { id: 'ALL', label: 'All Approved' },
            { id: 'NEEDS_MATERIALS', label: 'Needs Materials' },
            { id: 'MATERIALS_ORDERED', label: 'Materials Ordered' },
            { id: 'READY_TO_SCHEDULE', label: 'Ready to Schedule' }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setFilterStatus(filter.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === filter.id 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map(wo => (
          <div key={wo.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{wo.customerName}</h3>
                  <p className="text-xs font-mono text-slate-400">{wo.id}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                  wo.status === 'Estimate Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  wo.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {wo.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>{wo.serviceType}</span>
                </div>
                {wo.estimateId && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="font-mono">{wo.estimateId}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 flex-1 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                Materials Required
              </h4>
              
              {wo.materials && wo.materials.length > 0 ? (
                <div className="space-y-3">
                  {wo.materials.map(material => (
                    <div key={material.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-slate-900 truncate">{material.name}</p>
                        <p className="text-xs text-slate-500">${material.cost.toFixed(2)}</p>
                      </div>
                      <select
                        value={material.status}
                        onChange={(e) => handleMaterialStatusChange(wo.id, material.id, e.target.value as any)}
                        className={`text-xs font-bold rounded-lg px-2 py-1 border outline-none cursor-pointer ${
                          material.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          material.status === 'ORDERED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="ORDERED">Ordered</option>
                        <option value="RECEIVED">Received</option>
                      </select>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between items-center border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase">Total Material Cost</span>
                    <span className="text-sm font-bold text-slate-900">${calculateMaterialCosts(wo.materials).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-white rounded-xl border border-slate-200 border-dashed">
                  <p className="text-sm text-slate-500">No materials listed for this order.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white">
              <button 
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                  // In a real app, this might open a scheduling modal
                  alert(`Schedule work order ${wo.id}`);
                }}
              >
                <Clock className="w-4 h-4" />
                {wo.status === 'Scheduled' ? 'Reschedule' : 'Schedule Work'}
              </button>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Approved Orders Found</h3>
            <p className="text-slate-500">There are currently no work orders matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
