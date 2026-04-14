
import React, { useState } from 'react';
import { FileText, Building2, Users, Briefcase, CheckSquare, DollarSign, Plus, Filter, MoreVertical, Download, Mail, Edit2, Trash2, History, X, Search, Phone, MapPin, Bell, Calendar, AlertCircle, Clock, Circle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Priority, Task, View } from '../types';

// --- INVOICES VIEW ---
export const Invoices: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, workOrders, updateWorkOrder } = useData();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'INVOICE' | 'ESTIMATE'>('ESTIMATE');
  const [isCreating, setIsCreating] = useState(false);
  
  // Creation State
  const [newType, setNewType] = useState<'INVOICE' | 'ESTIMATE'>('ESTIMATE');
  const [selectedWO, setSelectedWO] = useState('');
  const [laborCost, setLaborCost] = useState(0);
  const [partsCost, setPartsCost] = useState(0);

  const filteredInvoices = invoices.filter(inv => 
    (inv.type || 'INVOICE') === activeTab &&
    (filterStatus === 'ALL' || inv.status === filterStatus)
  );

  const handleCreate = () => {
    setIsCreating(true);
    setNewType(activeTab);
  };

  const submitCreate = () => {
    if (!selectedWO) return alert("Please select a Work Order");
    const wo = workOrders.find(w => w.id === selectedWO);
    if (!wo) return;

    const newInv = {
        id: `${newType === 'ESTIMATE' ? 'EST' : 'INV'}-${1000 + invoices.length + 1}`,
        workOrderId: wo.id,
        client: wo.customerName,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        amount: `$${(laborCost + partsCost).toFixed(2)}`,
        laborCost,
        partsCost,
        type: newType,
        status: newType === 'ESTIMATE' ? 'DRAFT' : 'PENDING'
    };
    
    addInvoice(newInv as any);
    
    // Update Work Order Status
    if (newType === 'ESTIMATE') {
      updateWorkOrder(wo.id, { status: 'Estimate Pending' as any, estimateId: newInv.id });
    } else {
      updateWorkOrder(wo.id, { status: 'Invoiced' as any, invoiceId: newInv.id });
    }
    
    setIsCreating(false);
    setSelectedWO('');
    setLaborCost(0);
    setPartsCost(0);
  };

  const handleStatusChange = (inv: any, newStatus: string) => {
    updateInvoice(inv.id, { status: newStatus as any });
    
    // If estimate is approved, update the work order
    if (inv.type === 'ESTIMATE' && newStatus === 'APPROVED') {
      updateWorkOrder(inv.workOrderId, { status: 'Estimate Approved' as any });
    } else if (inv.type === 'ESTIMATE' && newStatus === 'DECLINED') {
      updateWorkOrder(inv.workOrderId, { status: 'Estimate Declined' as any });
    }
  };

  const eligibleWorkOrders = workOrders.filter(wo => 
    newType === 'ESTIMATE' 
      ? (wo.status === 'Inspection Done' || wo.status === 'New')
      : (wo.status === 'Completed' || wo.status === 'Estimate Approved')
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Invoices & Estimates</h2>
          <p className="text-sm text-slate-500">Manage billing and project estimates</p>
        </div>
        <button onClick={handleCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> Create New
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => { setActiveTab('ESTIMATE'); setFilterStatus('ALL'); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ESTIMATE' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Estimates
        </button>
        <button 
          onClick={() => { setActiveTab('INVOICE'); setFilterStatus('ALL'); }}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'INVOICE' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Invoices
        </button>
      </div>

      <div className="flex gap-2">
        {activeTab === 'INVOICE' ? 
          ['ALL', 'PENDING', 'PAID', 'OVERDUE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === status 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          )) :
          ['ALL', 'DRAFT', 'SENT', 'APPROVED', 'DECLINED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === status 
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))
        }
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">{activeTab === 'ESTIMATE' ? 'Estimate #' : 'Invoice #'}</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-bold text-emerald-600">{inv.id}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{inv.client}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{inv.workOrderId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                <td className="px-6 py-4 font-bold text-slate-900">{inv.amount}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                      ['PAID', 'APPROVED'].includes(inv.status) ? 'bg-green-50 text-green-700 border-green-200' : 
                      ['OVERDUE', 'DECLINED'].includes(inv.status) ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}>
                        {inv.status}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedInvoice(inv)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No {activeTab.toLowerCase()}s found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Create New {newType === 'ESTIMATE' ? 'Estimate' : 'Invoice'}</h3>
              <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                <select 
                  value={newType} 
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                >
                  <option value="ESTIMATE">Estimate</option>
                  <option value="INVOICE">Invoice</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Work Order</label>
                <select 
                  value={selectedWO} 
                  onChange={(e) => setSelectedWO(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                >
                  <option value="">-- Select Work Order --</option>
                  {eligibleWorkOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.id} - {wo.customerName} ({wo.status})</option>
                  ))}
                </select>
                {eligibleWorkOrders.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No eligible work orders found for {newType.toLowerCase()} creation.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Labor Cost ($)</label>
                <input 
                  type="number" 
                  value={laborCost} 
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Parts Cost ($)</label>
                <input 
                  type="number" 
                  value={partsCost} 
                  onChange={(e) => setPartsCost(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-bold">Cancel</button>
                <button onClick={submitCreate} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">{selectedInvoice.type === 'ESTIMATE' ? 'Estimate' : 'Invoice'} Details - {selectedInvoice.id}</h3>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Client</p>
                  <p className="text-lg font-bold text-slate-900">{selectedInvoice.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Status</p>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
                    ['PAID', 'APPROVED'].includes(selectedInvoice.status) ? 'bg-green-50 text-green-700 border-green-200' : 
                    ['OVERDUE', 'DECLINED'].includes(selectedInvoice.status) ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Labor Cost</span>
                  <span className="font-medium text-slate-900">${selectedInvoice.laborCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Parts & Materials</span>
                  <span className="font-medium text-slate-900">${selectedInvoice.partsCost.toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-900">Total Amount</span>
                  <span className="text-xl font-bold text-emerald-600">{selectedInvoice.amount}</span>
                </div>
              </div>

              <div className="flex gap-3">
                {selectedInvoice.type === 'ESTIMATE' && selectedInvoice.status === 'DRAFT' && (
                  <button onClick={() => handleStatusChange(selectedInvoice, 'SENT')} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" /> Send to Client
                  </button>
                )}
                {selectedInvoice.type === 'ESTIMATE' && selectedInvoice.status === 'SENT' && (
                  <>
                    <button onClick={() => handleStatusChange(selectedInvoice, 'APPROVED')} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleStatusChange(selectedInvoice, 'DECLINED')} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                      Decline
                    </button>
                  </>
                )}
                {selectedInvoice.type === 'INVOICE' && selectedInvoice.status === 'PENDING' && (
                  <button onClick={() => handleStatusChange(selectedInvoice, 'PAID')} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                    <DollarSign className="w-4 h-4" /> Mark as Paid
                  </button>
                )}
                <button className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CORPORATIONS VIEW ---
export const Corporations: React.FC = () => {
  const { corporations, addCorporation, updateCorporation, deleteCorporation, workOrders, navigateTo } = useData();
  const [selectedCorp, setSelectedCorp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCorp, setEditingCorp] = useState<any>(null);
  const [newCorp, setNewCorp] = useState({ name: '', properties: 0, revenue: '$0', active: true });

  const handleOpenAdd = () => {
    setEditingCorp(null);
    setNewCorp({ name: '', properties: 0, revenue: '$0', active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (corp: any) => {
    setEditingCorp(corp);
    setNewCorp({ ...corp });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCorp) {
      updateCorporation(editingCorp.id, newCorp);
    } else {
      addCorporation({
        ...newCorp,
        id: `C${Date.now()}`,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this corporation?')) {
      deleteCorporation(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Corporations</h2>
          <p className="text-sm text-slate-500">Manage commercial accounts and property portfolios</p>
        </div>
        <button onClick={handleOpenAdd} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> Add Corporation
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {corporations.map((corp) => {
          const corpOrders = workOrders.filter(wo => wo.corporation === corp.name);
          return (
            <div key={corp.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onClick={() => handleOpenEdit(corp)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(corp.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{corp.name}</h3>
                  <p className="text-xs text-slate-500">Contract: {corp.active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Properties:</span> <span className="font-medium">{corp.properties}</span></div>
                <div className="flex justify-between"><span>Open Orders:</span> <span className="font-medium">{corpOrders.length}</span></div>
                <div className="flex justify-between"><span>YTD Revenue:</span> <span className="font-medium text-green-600">{corp.revenue}</span></div>
              </div>
              <button 
                onClick={() => setSelectedCorp(corp)}
                className="w-full mt-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {/* Corporation Detail Modal */}
      {selectedCorp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">{selectedCorp.name} Details</h3>
              </div>
              <button onClick={() => setSelectedCorp(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Properties</p>
                  <p className="text-xl font-bold text-slate-900">{selectedCorp.properties}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Revenue</p>
                  <p className="text-xl font-bold text-emerald-600">{selectedCorp.revenue}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedCorp.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {selectedCorp.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-3 text-sm">Associated Work Orders</h4>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {workOrders.filter(wo => wo.corporation === selectedCorp.name).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">No work orders found for this corporation.</td>
                        </tr>
                      ) : (
                        workOrders.filter(wo => wo.corporation === selectedCorp.name).map(wo => (
                          <tr key={wo.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono text-emerald-600">{wo.id}</td>
                            <td className="px-4 py-3 font-medium">{wo.customerName}</td>
                            <td className="px-4 py-3">{wo.serviceType}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">{wo.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => {
                    navigateTo(View.WORK_ORDERS);
                  }}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                >
                  Create Work Order
                </button>
                <button className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                  View Properties
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Corporation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">{editingCorp ? 'Edit Corporation' : 'Add Corporation'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Corporation Name</label>
                <input 
                  required
                  type="text" 
                  value={newCorp.name}
                  onChange={(e) => setNewCorp({...newCorp, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. Nexzen Properties"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Properties</label>
                  <input 
                    type="number" 
                    value={newCorp.properties}
                    onChange={(e) => setNewCorp({...newCorp, properties: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Revenue</label>
                  <input 
                    type="text" 
                    value={newCorp.revenue}
                    onChange={(e) => setNewCorp({...newCorp, revenue: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="$0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={newCorp.active}
                  onChange={(e) => setNewCorp({...newCorp, active: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700">Active Contract</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
                >
                  {editingCorp ? 'Save Changes' : 'Add Corporation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- CLIENTS VIEW ---
export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, composeEmail, workOrders, invoices, navigateTo } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [viewingHistory, setViewingHistory] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    name: '',
    type: 'Residential' as 'Residential' | 'Corporation',
    contact: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({ name: '', type: 'Residential', contact: '', email: '', phone: '', address: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      type: client.type,
      contact: client.contact,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      addClient({
        id: Date.now(),
        ...formData
      });
    }
    setIsModalOpen(false);
  };

  if (viewingHistory) {
    const clientWorkOrders = workOrders.filter(wo => wo.customerName === viewingHistory.name);
    const clientInvoices = invoices.filter(inv => inv.client === viewingHistory.name);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setViewingHistory(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{viewingHistory.name} History</h2>
            <p className="text-sm text-slate-500">View all interactions, work orders, and billing for this client</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Info Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" /> Client Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</label>
                  <p className="text-sm font-medium text-slate-900">{viewingHistory.contact}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Mail className="w-3 h-3 text-slate-400" /> {viewingHistory.email}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" /> {viewingHistory.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</label>
                  <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-400" /> {viewingHistory.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes</label>
                  <p className="text-sm font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {viewingHistory.notes || 'No notes available.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => handleOpenEdit(viewingHistory)}
                className="w-full mt-6 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <Edit2 className="w-3 h-3" /> Edit Profile
              </button>
            </div>
          </div>

          {/* History Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Work Orders</h3>
              </div>
              <div className="p-0">
                {clientWorkOrders.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No work orders found for this client</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Service</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {clientWorkOrders.map(wo => (
                        <tr key={wo.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-mono text-xs text-emerald-600">{wo.id}</td>
                          <td className="px-6 py-4 font-medium">{wo.serviceType}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              wo.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {wo.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{wo.date ? new Date(wo.date).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Invoices</h3>
              </div>
              <div className="p-0">
                {clientInvoices.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No invoices found for this client</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">Invoice #</th>
                        <th className="px-6 py-3">Amount</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {clientInvoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-medium text-emerald-600">{inv.id}</td>
                          <td className="px-6 py-4 font-bold">{inv.amount}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Client Management</h2>
          <p className="text-sm text-slate-500">Manage your residential and commercial customer database</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 text-sm font-bold shadow-sm shadow-emerald-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add New Client
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search clients by name, email, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Client Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Primary Contact</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No clients found matching your search</p>
                </td>
              </tr>
            ) : (
              filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                          {client.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="font-bold text-slate-900">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        client.type === 'Corporation' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {client.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{client.contact}</td>
                    <td className="px-6 py-4 text-slate-500">{client.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => setViewingHistory(client)}
                            className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors" title="View History"
                        >
                            <History className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleOpenEdit(client)}
                            className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors" title="Edit Client"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => composeEmail(client.email, '', `Hi ${client.name},\n\n`)}
                            className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors" title="Send Email"
                        >
                            <Mail className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => { if(confirm('Delete client?')) deleteClient(client.id) }}
                            className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors" title="Delete Client"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="e.g. Acme Corporation"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Corporation">Corporation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Primary Contact</label>
                  <input 
                    required
                    type="text" 
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Contact Name"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    placeholder="555-0123"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all h-20 resize-none"
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all h-24 resize-none"
                    placeholder="Special requests or preferences..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- TASKS VIEW ---
export const Tasks: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask, moveTask } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');
  const [editingDueDate, setEditingDueDate] = useState<number | null>(null);

  const priorityWeight = {
    [Priority.URGENT]: 4,
    [Priority.HIGH]: 3,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 1,
  };

  const [formData, setFormData] = useState({
    title: '',
    status: 'To Do' as 'To Do' | 'In Progress' | 'Done',
    dueDate: new Date().toISOString().split('T')[0],
    priority: Priority.MEDIUM,
    reminderSet: false,
    description: ''
  });

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      status: 'To Do',
      dueDate: new Date().toISOString().split('T')[0],
      priority: Priority.MEDIUM,
      reminderSet: false,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTask({
      id: Date.now(),
      ...formData
    });
    setIsModalOpen(false);
  };

  const nextStatus = (current: string) => {
    if (current === 'To Do') return 'In Progress';
    if (current === 'In Progress') return 'Done';
    return 'To Do';
  };

  const filteredTasks = tasks.filter(t => {
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'dueDate') {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (sortBy === 'priority') {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return a.title.localeCompare(b.title);
  });

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.URGENT: return 'text-red-600 bg-red-50 border-red-100';
      case Priority.HIGH: return 'text-orange-600 bg-orange-50 border-orange-100';
      case Priority.MEDIUM: return 'text-blue-600 bg-blue-50 border-blue-100';
      case Priority.LOW: return 'text-slate-600 bg-slate-50 border-slate-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Task Management</h2>
          <p className="text-sm text-slate-500">Track internal operations and service follow-ups</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 text-sm font-bold shadow-sm shadow-emerald-200 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="title">Sort by Title</option>
          </select>
          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Priorities</option>
            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="All">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['To Do', 'In Progress', 'Done'].map((col) => (
          <div key={col} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 min-h-[500px] flex flex-col">
            <h3 className="font-bold text-slate-700 mb-4 flex justify-between items-center px-2">
              <span className="flex items-center gap-2">
                {col === 'To Do' && <Circle className="w-4 h-4 text-slate-400" />}
                {col === 'In Progress' && <Clock className="w-4 h-4 text-blue-500" />}
                {col === 'Done' && <CheckSquare className="w-4 h-4 text-emerald-500" />}
                {col}
              </span>
              <span className="bg-white border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {filteredTasks.filter(t => t.status === col).length}
              </span>
            </h3>
            <div className="space-y-3 flex-1">
              {filteredTasks.filter(t => t.status === col).map((task) => (
                <div 
                  key={task.id} 
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateTask(task.id, { reminderSet: !task.reminderSet })}
                        className={`p-1 rounded-md transition-colors ${task.reminderSet ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-500'}`}
                        title={task.reminderSet ? "Reminder Set" : "Set Reminder"}
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-slate-300 hover:text-red-500 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <input 
                      type="checkbox"
                      checked={task.status === 'Done'}
                      onChange={(e) => moveTask(task.id, e.target.checked ? 'Done' : 'To Do')}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                    />
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      task.priority === Priority.URGENT ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                      task.priority === Priority.HIGH ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                      task.priority === Priority.MEDIUM ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-400'
                    }`} />
                    <p 
                      className={`text-sm font-bold cursor-pointer hover:text-emerald-600 transition-colors truncate flex-1 ${task.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                      onClick={() => moveTask(task.id, nextStatus(task.status) as any)}
                    >
                      {task.title}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1.5 text-slate-400 group/date relative">
                      <Calendar className="w-3 h-3" />
                      {editingDueDate === task.id ? (
                        <input 
                          type="date"
                          autoFocus
                          value={task.dueDate}
                          onBlur={() => setEditingDueDate(null)}
                          onChange={(e) => {
                            updateTask(task.id, { dueDate: e.target.value });
                            setEditingDueDate(null);
                          }}
                          className="text-[10px] font-medium border border-slate-200 rounded px-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      ) : (
                        <span 
                          onClick={() => setEditingDueDate(task.id)}
                          className={`text-[10px] font-medium cursor-pointer hover:text-emerald-600 transition-colors border-b border-dashed border-transparent hover:border-emerald-600 ${new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'text-red-500 font-bold' : ''}`}
                        >
                          {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredTasks.filter(t => t.status === col).length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-xs italic">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-900">Create New Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. Follow up with Sarah about AC repair"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                  <input 
                    required
                    type="date" 
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all h-24 resize-none"
                  placeholder="Add more details about this task..."
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-emerald-900">Set Reminder</p>
                  <p className="text-[10px] text-emerald-600">Get notified before the due date</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, reminderSet: !formData.reminderSet})}
                  className={`w-10 h-5 rounded-full transition-all relative ${formData.reminderSet ? 'bg-emerald-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.reminderSet ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- OFFICE EXPENSE VIEW ---
export const OfficeExpense: React.FC = () => {
  const { expenses, addExpense } = useData();

  const handleAdd = () => {
    const desc = prompt("Expense Description:");
    const amount = prompt("Amount:");
    if (!desc || !amount) return;
    
    addExpense({
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}),
        category: 'MISC',
        description: desc,
        amount: parseFloat(amount)
    });
  };

  const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Office Expenses</h2>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 text-sm font-medium">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-xs font-medium uppercase">Total Spend</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-2">${total.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <button onClick={handleAdd} className="w-full h-full border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                <Plus className="w-6 h-6 mb-1" />
                <span className="font-medium text-sm">Add Expense</span>
             </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-3 font-medium text-slate-500">Date</th>
                    <th className="px-6 py-3 font-medium text-slate-500">Category</th>
                    <th className="px-6 py-3 font-medium text-slate-500">Description</th>
                    <th className="px-6 py-3 font-medium text-slate-500">Amount</th>
                    <th className="px-6 py-3 font-medium text-slate-500">Receipt</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                    <tr key={exp.id}>
                        <td className="px-6 py-4">{exp.date}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold">{exp.category}</span></td>
                        <td className="px-6 py-4">{exp.description}</td>
                        <td className="px-6 py-4 font-medium">${exp.amount}</td>
                        <td className="px-6 py-4 text-emerald-600 hover:underline cursor-pointer">View PDF</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
