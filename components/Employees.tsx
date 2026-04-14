
import React, { useState } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, X, User, 
  Phone, Mail, MapPin, Briefcase, GraduationCap, Users, FileText, 
  Shield, Check, ChevronRight, Upload, Calendar, Heart, Fingerprint,
  AlertCircle, Building2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Employee, View } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export const Employees: React.FC = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, corporations, currentUser } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'family' | 'education' | 'experience' | 'documents' | 'access'>('personal');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  const filteredEmployees = employees.filter(emp => 
    (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    const newEmp: Employee = {
      id: `E${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      role: 'Field Technician',
      status: 'Pending Approval',
      dob: '',
      bloodGroup: '',
      nidPassport: '',
      presentAddress: '',
      permanentAddress: '',
      fathersName: '',
      mothersName: '',
      maritalStatus: 'Single',
      emergencyContact: { name: '', relationship: '', phone: '' },
      education: {
        school: '',
        schoolYear: '',
        college: '',
        collegeYear: '',
        university: '',
        universityYear: '',
        highestDegree: ''
      },
      experience: {
        lastCompany: '',
        designation: '',
        yearsOfExperience: '',
        currentPosition: {
          department: '',
          designation: '',
          employeeId: '',
          salary: '',
          joinDate: new Date().toISOString().split('T')[0]
        }
      },
      documents: {},
      corporationAccess: [],
      permissions: []
    };
    setEditingEmployee(newEmp);
    setUploadedDocs({});
    setActiveTab('personal');
    setIsModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee({ 
      ...emp,
      emergencyContact: emp.emergencyContact || { name: '', relationship: '', phone: '' },
      education: emp.education || { school: '', schoolYear: '', college: '', collegeYear: '', university: '', universityYear: '', highestDegree: '' },
      experience: emp.experience || { lastCompany: '', designation: '', yearsOfExperience: '', currentPosition: { department: '', designation: '', employeeId: '', salary: '', joinDate: '' } },
      documents: emp.documents || {},
      corporationAccess: emp.corporationAccess || [],
      permissions: emp.permissions || []
    });
    setUploadedDocs(Object.keys(emp.documents || {}).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    setActiveTab('personal');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const existing = employees.find(emp => emp.id === editingEmployee.id);
    if (existing) {
      updateEmployee(editingEmployee.id, editingEmployee);
    } else {
      addEmployee(editingEmployee);
    }
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee record?')) {
      deleteEmployee(id);
    }
  };

  const togglePermission = (perm: string) => {
    if (!editingEmployee) return;
    const perms = editingEmployee.permissions.includes(perm)
      ? editingEmployee.permissions.filter(p => p !== perm)
      : [...editingEmployee.permissions, perm];
    setEditingEmployee({ ...editingEmployee, permissions: perms });
  };

  const toggleCorpAccess = (corpId: string) => {
    if (!editingEmployee) return;
    const access = editingEmployee.corporationAccess.includes(corpId)
      ? editingEmployee.corporationAccess.filter(id => id !== corpId)
      : [...editingEmployee.corporationAccess, corpId];
    setEditingEmployee({ ...editingEmployee, corporationAccess: access });
  };

  const isAdmin = currentUser?.role === 'Master Admin' || currentUser?.role === 'Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employee Management</h2>
          <p className="text-sm text-slate-500">Manage staff profiles, permissions, and documentation</p>
        </div>
        {isAdmin && (
          <button 
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 flex items-center gap-2 text-sm font-bold shadow-sm shadow-emerald-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add New Employee
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Role & Dept</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEmployees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold">
                      {(emp.name || '?').split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono uppercase">{emp.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-700">{emp.role}</p>
                  <p className="text-xs text-slate-500">{emp.experience?.currentPosition?.department || 'Unassigned'}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-slate-600 text-xs">
                      <Mail className="w-3 h-3" /> {emp.email}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-600 text-xs">
                      <Phone className="w-3 h-3" /> {emp.phone}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    emp.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                    emp.status === 'Pending Approval' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {(emp.status || 'Unknown').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(emp)}
                      className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(emp.id)}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Employee Detail/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-200">
                    {editingEmployee.name ? editingEmployee.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-slate-900">
                      {editingEmployee.name || 'New Employee Profile'}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {editingEmployee.role} • {editingEmployee.id}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row h-[600px]">
                {/* Sidebar Tabs */}
                <div className="w-full md:w-56 bg-slate-50 border-r border-slate-100 p-4 space-y-1">
                  {[
                    { id: 'personal', label: 'Personal Info', icon: User },
                    { id: 'family', label: 'Family Info', icon: Users },
                    { id: 'education', label: 'Education', icon: GraduationCap },
                    { id: 'experience', label: 'Experience', icon: Briefcase },
                    { id: 'documents', label: 'Documents', icon: FileText },
                    isAdmin && { id: 'access', label: 'Access & Perms', icon: Shield },
                  ].filter(Boolean).map((tab: any) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        activeTab === tab.id 
                          ? 'bg-white text-emerald-600 shadow-sm border border-slate-200' 
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {activeTab === 'personal' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Legal Name</label>
                            <input 
                              required
                              type="text" 
                              value={editingEmployee.name}
                              onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              placeholder="John Doe"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date of Birth</label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                type="date" 
                                value={editingEmployee.dob}
                                onChange={(e) => setEditingEmployee({...editingEmployee, dob: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Blood Group</label>
                            <div className="relative">
                              <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <select 
                                value={editingEmployee.bloodGroup}
                                onChange={(e) => setEditingEmployee({...editingEmployee, bloodGroup: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              >
                                <option value="">Select Blood Group</option>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                  <option key={bg} value={bg}>{bg}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                type="tel" 
                                value={editingEmployee.phone}
                                onChange={(e) => setEditingEmployee({...editingEmployee, phone: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="555-0123"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                type="email" 
                                value={editingEmployee.email}
                                onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="john@example.com"
                              />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">NID / Passport Number</label>
                            <div className="relative">
                              <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input 
                                type="text" 
                                value={editingEmployee.nidPassport}
                                onChange={(e) => setEditingEmployee({...editingEmployee, nidPassport: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                placeholder="ID Number"
                              />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Present Address</label>
                            <textarea 
                              value={editingEmployee.presentAddress}
                              onChange={(e) => setEditingEmployee({...editingEmployee, presentAddress: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all h-20 resize-none"
                              placeholder="Current living address..."
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Permanent Address</label>
                            <textarea 
                              value={editingEmployee.permanentAddress}
                              onChange={(e) => setEditingEmployee({...editingEmployee, permanentAddress: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all h-20 resize-none"
                              placeholder="Permanent home address..."
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'family' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Father's Name</label>
                            <input 
                              type="text" 
                              value={editingEmployee.fathersName}
                              onChange={(e) => setEditingEmployee({...editingEmployee, fathersName: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mother's Name</label>
                            <input 
                              type="text" 
                              value={editingEmployee.mothersName}
                              onChange={(e) => setEditingEmployee({...editingEmployee, mothersName: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Marital Status</label>
                            <select 
                              value={editingEmployee.maritalStatus}
                              onChange={(e) => setEditingEmployee({...editingEmployee, maritalStatus: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            >
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Widowed">Widowed</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" /> Emergency Contact
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Name</label>
                              <input 
                                type="text" 
                                value={editingEmployee.emergencyContact.name}
                                onChange={(e) => setEditingEmployee({
                                  ...editingEmployee, 
                                  emergencyContact: { ...editingEmployee.emergencyContact, name: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Relationship</label>
                              <input 
                                type="text" 
                                value={editingEmployee.emergencyContact.relationship}
                                onChange={(e) => setEditingEmployee({
                                  ...editingEmployee, 
                                  emergencyContact: { ...editingEmployee.emergencyContact, relationship: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
                              <input 
                                type="tel" 
                                value={editingEmployee.emergencyContact.phone}
                                onChange={(e) => setEditingEmployee({
                                  ...editingEmployee, 
                                  emergencyContact: { ...editingEmployee.emergencyContact, phone: e.target.value }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'education' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">School Name</label>
                            <input 
                              type="text" 
                              value={editingEmployee.education.school}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                education: { ...editingEmployee.education, school: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Passing Year</label>
                            <input 
                              type="text" 
                              value={editingEmployee.education.schoolYear}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                education: { ...editingEmployee.education, schoolYear: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">College Name</label>
                            <input 
                              type="text" 
                              value={editingEmployee.education.college}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                education: { ...editingEmployee.education, college: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Passing Year</label>
                            <input 
                              type="text" 
                              value={editingEmployee.education.collegeYear}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                education: { ...editingEmployee.education, collegeYear: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">University Name</label>
                            <input 
                              type="text" 
                              value={editingEmployee.education.university}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                education: { ...editingEmployee.education, university: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Passing Year</label>
                            <input 
                              type="text" 
                              value={editingEmployee.education.universityYear}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                education: { ...editingEmployee.education, universityYear: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Highest Degree</label>
                            <input 
                              type="text" 
                              value={editingEmployee.education.highestDegree}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                education: { ...editingEmployee.education, highestDegree: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              placeholder="e.g. Master of Business Administration"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'experience' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Last Company</label>
                            <input 
                              type="text" 
                              value={editingEmployee.experience.lastCompany}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                experience: { ...editingEmployee.experience, lastCompany: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Designation</label>
                            <input 
                              type="text" 
                              value={editingEmployee.experience.designation}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                experience: { ...editingEmployee.experience, designation: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Years of Experience</label>
                            <input 
                              type="text" 
                              value={editingEmployee.experience.yearsOfExperience}
                              onChange={(e) => setEditingEmployee({
                                ...editingEmployee, 
                                experience: { ...editingEmployee.experience, yearsOfExperience: e.target.value }
                              })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-emerald-600" /> Current Position (Internal)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                              <input 
                                type="text" 
                                value={editingEmployee.experience.currentPosition.department}
                                onChange={(e) => setEditingEmployee({
                                  ...editingEmployee, 
                                  experience: { 
                                    ...editingEmployee.experience, 
                                    currentPosition: { ...editingEmployee.experience.currentPosition, department: e.target.value } 
                                  }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Position / Designation</label>
                              <input 
                                type="text" 
                                value={editingEmployee.experience.currentPosition.designation}
                                onChange={(e) => setEditingEmployee({
                                  ...editingEmployee, 
                                  experience: { 
                                    ...editingEmployee.experience, 
                                    currentPosition: { ...editingEmployee.experience.currentPosition, designation: e.target.value } 
                                  }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Employee ID</label>
                              <input 
                                type="text" 
                                value={editingEmployee.experience.currentPosition.employeeId}
                                onChange={(e) => setEditingEmployee({
                                  ...editingEmployee, 
                                  experience: { 
                                    ...editingEmployee.experience, 
                                    currentPosition: { ...editingEmployee.experience.currentPosition, employeeId: e.target.value } 
                                  }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Salary</label>
                              <input 
                                type="text" 
                                value={editingEmployee.experience.currentPosition.salary}
                                onChange={(e) => setEditingEmployee({
                                  ...editingEmployee, 
                                  experience: { 
                                    ...editingEmployee.experience, 
                                    currentPosition: { ...editingEmployee.experience.currentPosition, salary: e.target.value } 
                                  }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Join Date</label>
                              <input 
                                type="date" 
                                value={editingEmployee.experience.currentPosition.joinDate}
                                onChange={(e) => setEditingEmployee({
                                  ...editingEmployee, 
                                  experience: { 
                                    ...editingEmployee.experience, 
                                    currentPosition: { ...editingEmployee.experience.currentPosition, joinDate: e.target.value } 
                                  }
                                })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'documents' && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'applicantPhoto', label: 'Applicant Photo' },
                            { id: 'nidPassportCopy', label: 'NID / Passport Copy' },
                            { id: 'guardianPhoto', label: 'Guardian Photo' },
                            { id: 'cvResume', label: 'CV / Resume' },
                            { id: 'sscCertificate', label: 'SSC Certificate' },
                            { id: 'hscCertificate', label: 'HSC Certificate' },
                            { id: 'familyMembersPhotos', label: 'Family Members Photos' },
                            { id: 'emergencyContactIdPhotos', label: 'Emergency Contact ID Photos' },
                            { id: 'certificatePhotos', label: 'Other Certificate Photos' },
                          ].map(doc => (
                            <div key={doc.id} className="p-4 border border-slate-200 border-dashed rounded-2xl bg-slate-50 flex items-center justify-between group/doc">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                                  uploadedDocs[doc.id] ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400'
                                }`}>
                                  {uploadedDocs[doc.id] ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-slate-700 block">{doc.label}</span>
                                  {uploadedDocs[doc.id] && <span className="text-[10px] text-emerald-600 font-medium">Uploaded successfully</span>}
                                </div>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setUploadedDocs(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                                className={`p-2 rounded-lg transition-colors shadow-sm border ${
                                  uploadedDocs[doc.id] ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' : 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {uploadedDocs[doc.id] ? <Trash2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'access' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account Status</label>
                            <select 
                              value={editingEmployee.status}
                              onChange={(e) => setEditingEmployee({...editingEmployee, status: e.target.value as any})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            >
                              <option value="Active">Active</option>
                              <option value="Pending Approval">Pending Approval</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">System Role</label>
                            <select 
                              value={editingEmployee.role}
                              onChange={(e) => setEditingEmployee({...editingEmployee, role: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            >
                              <option value="Master Admin">Master Admin</option>
                              <option value="Admin">Admin</option>
                              <option value="Team Lead">Team Lead</option>
                              <option value="Field Technician">Field Technician</option>
                              <option value="Dispatcher">Dispatcher</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-600" /> Corporation Access
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {corporations.map(corp => (
                              <button
                                key={corp.id}
                                type="button"
                                onClick={() => toggleCorpAccess(corp.id)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                                  editingEmployee.corporationAccess.includes(corp.id)
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {corp.name}
                                {editingEmployee.corporationAccess.includes(corp.id) && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-600" /> Permissions & Sanctions
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                              { id: 'work_orders.manage', label: 'Manage Work Orders' },
                              { id: 'clients.manage', label: 'Manage Clients' },
                              { id: 'invoices.manage', label: 'Manage Invoices' },
                              { id: 'inventory.manage', label: 'Manage Inventory' },
                              { id: 'employees.manage', label: 'Manage Employees' },
                              { id: 'reports.view', label: 'View Reports' },
                              { id: 'settings.manage', label: 'Manage Settings' },
                              { id: 'automation.manage', label: 'Manage Automations' },
                              { id: 'technicians.manage', label: 'Manage Technicians' },
                              { id: 'scheduler.manage', label: 'Manage Scheduler' },
                              { id: 'dispatch.manage', label: 'Manage Dispatch' },
                              { id: 'chat.access', label: 'Access Chat' },
                              { id: 'email.access', label: 'Access Email' },
                            ].map(perm => (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => togglePermission(perm.id)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
                                  editingEmployee.permissions.includes(perm.id)
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {perm.label}
                                {editingEmployee.permissions.includes(perm.id) && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                  Save Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
