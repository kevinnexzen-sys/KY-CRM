import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Map as MapIcon, List, Phone, Star, Briefcase, Plus, X, Trash2, Edit2, Calendar, Clock, Award, User } from 'lucide-react';
import L from 'leaflet';
import { Technician } from '../types';

// Fix for default Leaflet marker icons in React
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface TechniciansProps {
  initialViewMode?: 'list' | 'map';
}

export const Technicians: React.FC<TechniciansProps> = ({ initialViewMode = 'list' }) => {
  const { technicians, updateTechnician, addTechnician, deleteTechnician } = useData();
  const [viewMode, setViewMode] = useState<'list' | 'map'>(initialViewMode);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTech, setNewTech] = useState<Partial<Technician>>({
    name: '',
    trade: 'General',
    status: 'Active',
    skills: [],
    rating: 5.0,
    workload: 0,
    lat: 30.2672,
    lng: -97.7431
  });

  // Update internal state if prop changes (e.g. navigation from sidebar)
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  const toggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Busy' : currentStatus === 'Busy' ? 'On Leave' : 'Active';
    updateTechnician(id, { status: newStatus as any });
  };

  const handleAddTech = (e: React.FormEvent) => {
    e.preventDefault();
    const tech: Technician = {
      ...newTech as Technician,
      id: `T${Date.now()}`,
      performanceHistory: [],
      schedule: []
    };
    addTechnician(tech);
    setIsAddModalOpen(false);
    setNewTech({
        name: '',
        trade: 'General',
        status: 'Active',
        skills: [],
        rating: 5.0,
        workload: 0,
        lat: 30.2672,
        lng: -97.7431
    });
  };

  const handleDeleteTech = (id: string) => {
    if (confirm('Are you sure you want to delete this technician?')) {
        deleteTechnician(id);
        if (selectedTech?.id === id) setSelectedTech(null);
    }
  };

  if (selectedTech) {
    return (
        <div className="space-y-6 overflow-y-auto pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => setSelectedTech(null)} className="p-2 hover:bg-slate-200 rounded-full">
                    <X className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-900">{selectedTech.name}'s Profile</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-700 mb-4">
                            {selectedTech.name.charAt(0)}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">{selectedTech.name}</h3>
                        <p className="text-slate-500">{selectedTech.trade} Specialist</p>
                        <div className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                            {selectedTech.status}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Rating</span>
                            <span className="font-bold flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {selectedTech.rating}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Workload</span>
                            <span className="font-bold">{selectedTech.workload}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Email</span>
                            <span className="font-medium">{selectedTech.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Phone</span>
                            <span className="font-medium">{selectedTech.phone || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="pt-4">
                        <h4 className="text-sm font-bold mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedTech.skills.map(skill => (
                                <span key={skill} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleDeleteTech(selectedTech.id)}
                        className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Technician
                    </button>
                </div>

                {/* Schedule */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-900">Upcoming Schedule</h3>
                        </div>
                        
                        {selectedTech.schedule.length === 0 ? (
                            <p className="text-center py-10 text-slate-400 text-sm">No jobs scheduled</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedTech.schedule.map((job, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="w-12 text-center">
                                            <p className="text-xs font-bold text-slate-900">{job.startTime}</p>
                                            <p className="text-[10px] text-slate-500">{job.endTime}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900">{job.jobId}</p>
                                            <p className="text-xs text-slate-500">{job.date}</p>
                                        </div>
                                        <button className="px-3 py-1 bg-white border border-slate-200 rounded text-xs font-medium hover:bg-slate-50">
                                            View Job
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Award className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-900">Performance History</h3>
                        </div>
                        
                        {selectedTech.performanceHistory.length === 0 ? (
                            <p className="text-center py-10 text-slate-400 text-sm">No history available</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedTech.performanceHistory.map((entry, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-slate-900">{entry.jobId}</p>
                                                <p className="text-xs text-slate-500">{entry.date}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <Star className="w-3 h-3 fill-current" />
                                                <span className="text-sm font-bold">{entry.rating}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 italic">"{entry.comment}"</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">
             {viewMode === 'map' ? 'Live Technician Map' : 'Technician Directory'}
           </h2>
           <p className="text-sm text-slate-500">Track and dispatch field agents</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Technician
          </button>
          <div className="flex bg-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
              viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
              viewMode === 'map' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" /> Map
          </button>
        </div>
      </div>
    </div>

    {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-6">
          {technicians.map((tech) => (
            <div key={tech.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{tech.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Briefcase className="w-3 h-3" /> {tech.trade}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => toggleStatus(tech.id, tech.status)}
                  className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 ${
                    tech.status === 'Active' ? 'bg-green-100 text-green-700' :
                    tech.status === 'Busy' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                  }`}
                  title="Click to toggle status"
                >
                  {tech.status}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-slate-100">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1 font-bold text-slate-800">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {tech.rating}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Workload</p>
                  <div className="font-bold text-slate-800">{tech.workload}%</div>
                </div>
              </div>

                  <div className="flex gap-2">
                     <button 
                        onClick={() => setSelectedTech(tech)}
                        className="flex-1 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                     >
                       <User className="w-4 h-4" /> Profile
                     </button>
                     <button className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
                       Edit
                     </button>
                  </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 relative z-0">
          <MapContainer 
            center={[30.2672, -97.7431]} 
            zoom={12} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {technicians.map((tech) => (
              <Marker key={tech.id} position={[tech.lat, tech.lng]} icon={icon}>
                <Popup>
                  <div className="p-1">
                    <strong className="block text-sm mb-1">{tech.name}</strong>
                    <span className="text-xs text-slate-500">{tech.trade} - {tech.status}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
      {/* Add Technician Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Add New Technician</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddTech}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input 
                        required 
                        type="text" 
                        value={newTech.name}
                        onChange={(e) => setNewTech({...newTech, name: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="e.g. Mike Ross" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Trade</label>
                    <select 
                        value={newTech.trade}
                        onChange={(e) => setNewTech({...newTech, trade: e.target.value as any})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                        <option>HVAC</option>
                        <option>Plumbing</option>
                        <option>Electrical</option>
                        <option>General</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input 
                        type="email" 
                        value={newTech.email}
                        onChange={(e) => setNewTech({...newTech, email: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="mike@example.com" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone</label>
                    <input 
                        type="text" 
                        value={newTech.phone}
                        onChange={(e) => setNewTech({...newTech, phone: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:outline-none" 
                        placeholder="(555) 000-0000" 
                    />
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium shadow-sm">Add Technician</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
