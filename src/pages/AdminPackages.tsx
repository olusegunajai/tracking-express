import { useState, useEffect, FormEvent } from 'react';
import { Package, MapPin, TrendingUp, Clock, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPackages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    tracking_number: '',
    sender_name: '',
    receiver_name: '',
    origin: '',
    destination: '',
    status: 'pending',
    weight: '',
    estimated_delivery: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const res = await fetch('/api/packages');
    const data = await res.json();
    setPackages(data);
    setLoading(false);
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

  const openModal = (pkg: any = null) => {
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
        estimated_delivery: pkg.estimated_delivery
      });
    } else {
      setEditingPackage(null);
      setFormData({
        tracking_number: `TK-${Math.floor(100000 + Math.random() * 900000)}`,
        sender_name: '',
        receiver_name: '',
        origin: '',
        destination: '',
        status: 'pending',
        weight: '',
        estimated_delivery: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const filteredPackages = packages.filter(p => 
    p.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sender_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-red-600 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
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
                <tr key={pkg.id} className="hover:bg-stone-50/50 transition-colors group">
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
                        onClick={() => openModal(pkg)}
                        className="p-2 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(pkg.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
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
              <form onSubmit={handleSubmit} className="p-8 grid md:grid-cols-2 gap-6">
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
    </div>
  );
}
