import { useState, useEffect, FormEvent } from 'react';
import { Package, MapPin, TrendingUp, Clock, Plus, Search, Edit2, Trash2, X, Eye, Check, ChevronDown, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRScanner from '../components/QRScanner';

export default function AdminPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [formData, setFormData] = useState({
    tracking_number: '',
    sender_name: '',
    receiver_name: '',
    origin: '',
    destination: '',
    status: 'pending',
    weight: '',
    estimated_delivery: '',
    route_id: ''
  });

  useEffect(() => {
    fetchPackages();
    fetchRoutes();
  }, []);

  const fetchPackages = async () => {
    const res = await fetch('/api/packages');
    const data = await res.json();
    setPackages(data);
    setLoading(false);
  };

  const fetchRoutes = async () => {
    const res = await fetch('/api/routes');
    const data = await res.json();
    setRoutes(data);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tokyo_token');
    const url = editingPackage ? `/api/packages/${editingPackage.id}` : '/api/packages';
    const method = editingPackage ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      fetchPackages();
      closeModal();
    } else {
      const data = await res.json();
      alert(data.error || 'Something went wrong');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    const token = localStorage.getItem('tokyo_token');
    await fetch(`/api/packages/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchPackages();
  };

  const openModal = async (pkg: any = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        tracking_number: pkg.tracking_number,
        sender_name: pkg.sender_name,
        receiver_name: pkg.receiver_name,
        origin: pkg.origin,
        destination: pkg.destination,
        status: pkg.status,
        weight: pkg.weight.toString(),
        estimated_delivery: pkg.estimated_delivery,
        route_id: pkg.route_id?.toString() || ''
      });
      
      // Fetch history for edit form
      const token = localStorage.getItem('tokyo_token');
      const res = await fetch(`/api/packages/${pkg.id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } else {
      setEditingPackage(null);
      setHistory([]);
      setFormData({
        tracking_number: `TK-${Math.floor(100000 + Math.random() * 900000)}`,
        sender_name: '',
        receiver_name: '',
        origin: '',
        destination: '',
        status: 'pending',
        weight: '',
        estimated_delivery: '',
        route_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const openDetails = async (pkg: any) => {
    setSelectedPackage(pkg);
    setHistory([]); // Clear previous history
    const token = localStorage.getItem('tokyo_token');
    try {
      const res = await fetch(`/api/packages/${pkg.id}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
    setIsDetailsOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
    setHistory([]);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedPackage(null);
    setHistory([]);
  };

  const filteredPackages = packages.filter(p => 
    p.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPackages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPackages.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} packages?`)) return;
    const token = localStorage.getItem('tokyo_token');
    const res = await fetch('/api/packages/bulk-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: selectedIds })
    });

    if (res.ok) {
      setSelectedIds([]);
      fetchPackages();
    } else {
      alert('Failed to delete packages');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    const token = localStorage.getItem('tokyo_token');
    const res = await fetch('/api/packages/bulk-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: selectedIds, status })
    });

    if (res.ok) {
      setSelectedIds([]);
      setIsBulkStatusOpen(false);
      fetchPackages();
    } else {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Package Management</h1>
          <p className="text-stone-500 mt-1">Create, update, and track all shipments.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-5 h-5" />
          NEW PACKAGE
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <Package className="text-blue-600 w-6 h-6" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Total Shipments</p>
          <h3 className="text-3xl font-bold mt-1">{packages.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center mb-4">
            <Clock className="text-yellow-600 w-6 h-6" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">In Transit</p>
          <h3 className="text-3xl font-bold mt-1">{packages.filter(p => p.status === 'in-transit').length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="text-green-600 w-6 h-6" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Delivered</p>
          <h3 className="text-3xl font-bold mt-1">{packages.filter(p => p.status === 'delivered').length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
            <MapPin className="text-red-600 w-6 h-6" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Pending</p>
          <h3 className="text-3xl font-bold mt-1">{packages.filter(p => p.status === 'pending').length}</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by tracking number or name..."
              className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-12 pr-12 outline-none focus:border-red-600 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              onClick={() => setShowScanner(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-stone-200 rounded-lg text-stone-400 hover:text-red-600 transition-colors"
              title="Scan QR Code"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4 w-10">
                  <button 
                    onClick={handleSelectAll}
                    className={`w-5 h-5 rounded border transition-all flex items-center justify-center
                      ${selectedIds.length === filteredPackages.length && filteredPackages.length > 0
                        ? 'bg-red-600 border-red-600 text-white' 
                        : 'bg-white border-stone-200 hover:border-stone-300'}
                    `}
                  >
                    {selectedIds.length === filteredPackages.length && filteredPackages.length > 0 && <Check className="w-3 h-3" />}
                  </button>
                </th>
                <th className="px-6 py-4">Tracking Number</th>
                <th className="px-6 py-4">Sender / Receiver</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Delivery</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPackages.map((pkg) => (
                <tr key={pkg.id} className={`hover:bg-stone-50/50 transition-colors group ${selectedIds.includes(pkg.id) ? 'bg-stone-50' : ''}`}>
                  <td className="px-6 py-6">
                    <button 
                      onClick={() => toggleSelect(pkg.id)}
                      className={`w-5 h-5 rounded border transition-all flex items-center justify-center
                        ${selectedIds.includes(pkg.id) 
                          ? 'bg-red-600 border-red-600 text-white' 
                          : 'bg-white border-stone-200 hover:border-stone-300'}
                      `}
                    >
                      {selectedIds.includes(pkg.id) && <Check className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-6 py-6">
                    <span className="font-mono font-bold text-stone-900">{pkg.tracking_number}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-bold text-stone-800">{pkg.sender_name}</div>
                    <div className="text-xs text-stone-400 mt-1">to {pkg.receiver_name}</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-medium text-stone-600">{pkg.origin}</div>
                    <div className="text-xs text-stone-400 mt-1">→ {pkg.destination}</div>
                    {pkg.route_name && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-tighter bg-red-50 px-2 py-0.5 rounded-md w-fit">
                        <TrendingUp className="w-3 h-3" />
                        {pkg.route_name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6">
                    <span className={`
                      px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                      ${pkg.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                        pkg.status === 'in-transit' ? 'bg-blue-100 text-blue-600' : 
                        'bg-yellow-100 text-yellow-600'}
                    `}>
                      {pkg.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-sm text-stone-600">
                    {pkg.estimated_delivery}
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openDetails(pkg)}
                        className="p-2 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal(pkg)}
                        className="p-2 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors"
                        title="Edit Package"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(pkg.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        title="Delete Package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {isDetailsOpen && selectedPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDetails}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">{selectedPackage.tracking_number}</h2>
                    <p className="text-stone-500 text-sm">Package Details & History</p>
                  </div>
                </div>
                <button onClick={closeDetails} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Sender</p>
                      <p className="text-stone-900 font-bold">{selectedPackage.sender_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Origin</p>
                      <p className="text-stone-600">{selectedPackage.origin}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Receiver</p>
                      <p className="text-stone-900 font-bold">{selectedPackage.receiver_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Destination</p>
                      <p className="text-stone-600">{selectedPackage.destination}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Weight</p>
                    <p className="text-stone-900 font-bold">{selectedPackage.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Est. Delivery</p>
                    <p className="text-stone-900 font-bold">{selectedPackage.estimated_delivery}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Assigned Route</p>
                    {selectedPackage.route_name ? (
                      <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-stone-900">{selectedPackage.route_name}</p>
                          <p className="text-xs text-stone-500">Active transport route</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-stone-400 italic">No route assigned yet.</p>
                    )}
                  </div>
                </div>

                {/* Status History */}
                <div className="pt-8 border-t border-stone-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4 text-stone-400" />
                      Status History
                    </h3>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {history.length} Updates
                    </span>
                  </div>
                  
                  <div className="space-y-8">
                    {history.map((h, idx) => (
                      <div key={h.id} className="flex gap-6 relative">
                        {idx !== history.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-32px] w-px bg-stone-100" />
                        )}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white 
                          ${idx === 0 ? (
                            h.status === 'delivered' ? 'border-green-600' : 
                            h.status === 'in-transit' ? 'border-blue-600' : 
                            'border-red-600'
                          ) : 'border-stone-200'}
                        `}>
                          <div className={`w-2 h-2 rounded-full 
                            ${idx === 0 ? (
                              h.status === 'delivered' ? 'bg-green-600' : 
                              h.status === 'in-transit' ? 'bg-blue-600' : 
                              'bg-red-600'
                            ) : 'bg-stone-200'}
                          `} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`text-sm font-bold uppercase tracking-tight ${idx === 0 ? 'text-stone-900' : 'text-stone-500'}`}>
                                {h.status}
                              </p>
                              <p className="text-xs text-stone-400 mt-0.5">
                                Status updated to <span className="font-semibold text-stone-600">{h.status}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-stone-900 uppercase">
                                {new Date(h.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] font-medium text-stone-400 mt-0.5">
                                {new Date(h.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="bg-stone-50 rounded-2xl p-8 text-center border border-dashed border-stone-200">
                        <Clock className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                        <p className="text-sm text-stone-400 font-medium italic">No history available for this package.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-stone-900">
                  {editingPackage ? 'Edit Package' : 'New Package'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 grid md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Tracking Number</label>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600 font-mono font-bold"
                    value={formData.tracking_number}
                    onChange={e => setFormData({...formData, tracking_number: e.target.value})}
                    readOnly={!!editingPackage}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Sender Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={formData.sender_name}
                    onChange={e => setFormData({...formData, sender_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Receiver Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={formData.receiver_name}
                    onChange={e => setFormData({...formData, receiver_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Origin</label>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={formData.origin}
                    onChange={e => setFormData({...formData, origin: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Destination</label>
                  <input 
                    type="text" 
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={formData.destination}
                    onChange={e => setFormData({...formData, destination: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Status</label>
                  <select 
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600 appearance-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Estimated Delivery</label>
                  <input 
                    type="text" 
                    placeholder="e.g. March 15, 2026"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={formData.estimated_delivery}
                    onChange={e => setFormData({...formData, estimated_delivery: e.target.value})}
                    required
                  />
                </div>

                {/* History in Form */}
                <div className="col-span-2 pt-8 border-t border-stone-100">
                  <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Status History
                  </h3>
                  {editingPackage ? (
                    <div className="space-y-6">
                      {history.map((h, idx) => (
                        <div key={h.id} className="flex gap-4 relative">
                          {idx !== history.length - 1 && (
                            <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-stone-200" />
                          )}
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-white ${idx === 0 ? 'border-red-600' : 'border-stone-300'}`}>
                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-red-600' : 'bg-stone-300'}`} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-stone-800 uppercase tracking-tight">{h.status}</p>
                            <p className="text-[10px] text-stone-400 font-medium mt-1">
                              {new Date(h.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {history.length === 0 && (
                        <p className="text-sm text-stone-400 italic">No history available yet.</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-stone-50 rounded-xl p-6 border border-dashed border-stone-200 text-center">
                      <Clock className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm text-stone-400">History will be recorded once the package is created.</p>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Assign to Route</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600 appearance-none"
                      value={formData.route_id}
                      onChange={e => setFormData({...formData, route_id: e.target.value})}
                    >
                      <option value="">No Route Assigned</option>
                      {routes.map(route => (
                        <option key={route.id} value={route.id}>
                          {route.name} ({route.origin} → {route.destination})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                </div>

                <div className="col-span-2 pt-4">
                  <button className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20">
                    {editingPackage ? 'UPDATE PACKAGE' : 'CREATE PACKAGE'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-stone-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-8 border border-stone-800"
          >
            <div className="flex items-center gap-3 border-r border-stone-800 pr-8">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center font-bold text-sm">
                {selectedIds.length}
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-stone-400">Selected</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setIsBulkStatusOpen(!isBulkStatusOpen)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-stone-800 rounded-xl transition-colors text-sm font-bold uppercase tracking-widest"
                >
                  Update Status
                  <ChevronDown className={`w-4 h-4 transition-transform ${isBulkStatusOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isBulkStatusOpen && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: -4 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute bottom-full left-0 mb-2 bg-stone-800 border border-stone-700 rounded-xl overflow-hidden shadow-xl min-w-[160px]"
                    >
                      {['pending', 'in-transit', 'delivered'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleBulkStatusUpdate(status)}
                          className="w-full text-left px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-700 transition-colors border-b border-stone-700 last:border-0"
                        >
                           {status}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-600/20 text-red-500 rounded-xl transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>

              <button 
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 hover:bg-stone-800 rounded-xl transition-colors text-sm font-bold uppercase tracking-widest text-stone-500"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showScanner && (
        <QRScanner 
          onScanSuccess={(code) => {
            setSearchTerm(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
