
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  Box, Package, AlertTriangle, Plus, Search, 
  Filter, MoreVertical, ArrowUpRight, ArrowDownLeft,
  History, Settings, ShoppingCart, CheckCircle2,
  X, Edit2, Trash2, Loader2, RefreshCw, Sparkles
} from 'lucide-react';
import { InventoryItem, InventoryAlert } from '../types';

export const Inventory: React.FC = () => {
  const { 
    inventoryItems, inventoryAlerts, addInventoryItem, 
    updateInventoryItem, deleteInventoryItem, workOrders 
  } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(inventoryItems.map(i => i.category))];

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) return { label: 'Out of Stock', color: 'text-rose-600 bg-rose-50 border-rose-100' };
    if (item.quantity <= item.minQuantity) return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50 border-amber-100' };
    return { label: 'In Stock', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSyncing(false);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-sm text-slate-500">Track parts, materials, and stock levels</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 transition-all shadow-sm"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Inventory Alerts */}
      {inventoryAlerts.filter(a => !a.isResolved).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventoryAlerts.filter(a => !a.isResolved).slice(0, 3).map(alert => (
            <div key={alert.id} className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-rose-900 truncate">{alert.itemName}</p>
                <p className="text-[10px] text-rose-700 font-medium">{alert.message}</p>
              </div>
              <button className="text-[10px] font-bold text-rose-600 uppercase tracking-widest hover:underline">
                Reorder
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Box className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Items</span>
          </div>
          <h4 className="text-2xl font-bold text-slate-900">{inventoryItems.length}</h4>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Across {categories.length - 1} categories</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low Stock</span>
          </div>
          <h4 className="text-2xl font-bold text-amber-600">
            {inventoryItems.filter(i => i.quantity <= i.minQuantity && i.quantity > 0).length}
          </h4>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Requires attention</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Out of Stock</span>
          </div>
          <h4 className="text-2xl font-bold text-rose-600">
            {inventoryItems.filter(i => i.quantity === 0).length}
          </h4>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Immediate action needed</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory Value</span>
          </div>
          <h4 className="text-2xl font-bold text-emerald-600">
            ${inventoryItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toLocaleString()}
          </h4>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Total asset value</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or SKU..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Level</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-slate-900">{item.quantity} {item.unit}</span>
                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              item.quantity === 0 ? 'bg-rose-500' : 
                              item.quantity <= item.minQuantity ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, (item.quantity / (item.minQuantity * 2)) * 100)}%` }}
                          ></div>
                        </div>
                        {item.workOrderIds.length > 0 && (
                          <span className="text-[9px] text-slate-400 font-medium">Used in {item.workOrderIds.length} jobs</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">${item.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-emerald-600 transition-all border border-transparent hover:border-slate-200">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-rose-600 transition-all border border-transparent hover:border-slate-200">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DollarSign: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);
