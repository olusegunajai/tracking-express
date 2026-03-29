import { useState, useEffect, FormEvent } from 'react';
import { Map, Plus, Search, Edit2, Trash2, X, Navigation, Ruler, Clock, Eye, Package as PackageIcon, ArrowRight, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminRoutes() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [routePackages, setRoutePackages] = useState<any[]>([]);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [selectedPackagesToAssign, setSelectedPackagesToAssign] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [packageSortOrder, setPackageSortOrder] = useState<'newest' | 'oldest' | 'weight-desc' | 'weight-asc'>('newest');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    origin: '',
    destination: '',
    distance: '',
    estimated_time: ''
  });

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    const res = await fetch('/api/routes');
    const data = await res.json();
    setRoutes(data);
    setLoading(false);
  };

  const fetchRoutePackages = async (id: number) => {
    const token = localStorage.getItem('tokyo_token');
    const res = await fetch(`/api/routes/${id}/packages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setRoutePackages(data);
  };

  const fetchAvailablePackages = async (id: number) => {
    const token = localStorage.getItem('tokyo_token');
    const res = await fetch(`/api/routes/${id}/available-packages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setAvailablePackages(data);
  };

  const assignPackages = async () => {
    if (selectedPackagesToAssign.length === 0) return;
    const token = localStorage.getItem('tokyo_token');
    const res = await fetch(`/api/routes/${selectedRoute.id}/packages/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ packageIds: selectedPackagesToAssign })
    });

    if (res.ok) {
      fetchRoutePackages(selectedRoute.id);
      fetchAvailablePackages(selectedRoute.id);
      setSelectedPackagesToAssign([]);
      setIsAssigning(false);
    }
  };

  const unassignPackage = async (packageId: number) => {
    if (!confirm('Are you sure you want to unassign this package?')) return;
    const token = localStorage.getItem('tokyo_token');
    const res = await fetch(`/api/routes/${selectedRoute.id}/packages/${packageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      fetchRoutePackages(selectedRoute.id);
      fetchAvailablePackages(selectedRoute.id);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('tokyo_token');
    const url = editingRoute ? `/api/routes/${editingRoute.id}` : '/api/routes';
    const method = editingRoute ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      fetchRoutes();
      closeModal();
    } else {
      const data = await res.json();
      alert(data.error || 'Something went wrong');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this route?')) return;
    const token = localStorage.getItem('tokyo_token');
    await fetch(`/api/routes/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    fetchRoutes();
  };

  const openModal = (route: any = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData({
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        distance: route.distance.toString(),
        estimated_time: route.estimated_time
      });
    } else {
      setEditingRoute(null);
      setFormData({
        name: '',
        origin: '',
        destination: '',
        distance: '',
        estimated_time: ''
      });
    }
    setIsModalOpen(true);
  };

  const openDetails = (route: any) => {
    setSelectedRoute(route);
    fetchRoutePackages(route.id);
    fetchAvailablePackages(route.id);
    setIsDetailsOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoute(null);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedRoute(null);
    setRoutePackages([]);
    setAvailablePackages([]);
    setSelectedPackagesToAssign([]);
    setIsAssigning(false);
    setPackageSearchTerm('');
    setPackageSortOrder('newest');
    setMinWeight('');
    setMaxWeight('');
    setShowFilters(false);
  };

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Route Management</h1>
          <p className="text-stone-500 mt-1">Define and manage logistics transit paths.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-stone-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          NEW ROUTE
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mb-4">
            <Map className="text-stone-600 w-6 h-6" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Total Routes</p>
          <h3 className="text-3xl font-bold mt-1">{routes.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mb-4">
            <Navigation className="text-stone-600 w-6 h-6" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Active Hubs</p>
          <h3 className="text-3xl font-bold mt-1">
            {new Set([...routes.map(r => r.origin), ...routes.map(r => r.destination)]).size}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mb-4">
            <Ruler className="text-stone-600 w-6 h-6" />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Avg. Distance</p>
          <h3 className="text-3xl font-bold mt-1">
            {routes.length > 0 
              ? Math.round(routes.reduce((acc, curr) => acc + curr.distance, 0) / routes.length) 
              : 0} km
          </h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search routes..."
              className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-stone-900 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Route Name</th>
                <th className="px-6 py-4">Origin</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Distance</th>
                <th className="px-6 py-4">Est. Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <span className="font-bold text-stone-900">{route.name}</span>
                  </td>
                  <td className="px-6 py-6 text-sm text-stone-600">{route.origin}</td>
                  <td className="px-6 py-6 text-sm text-stone-600">{route.destination}</td>
                  <td className="px-6 py-6 text-sm text-stone-600">{route.distance} km</td>
                  <td className="px-6 py-6 text-sm text-stone-600">{route.estimated_time}</td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openDetails(route)}
                        className="p-2 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal(route)}
                        className="p-2 hover:bg-stone-200 rounded-lg text-stone-600 transition-colors"
                        title="Edit Route"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(route.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        title="Delete Route"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRoutes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-stone-400 italic">
                    No routes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {isDetailsOpen && selectedRoute && (
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
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-600">
                    <Map className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-stone-900">{selectedRoute.name}</h2>
                    <p className="text-stone-500 text-sm flex items-center gap-2">
                      {selectedRoute.origin} <ArrowRight className="w-3 h-3" /> {selectedRoute.destination}
                    </p>
                  </div>
                </div>
                <button onClick={closeDetails} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Route Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3 text-stone-400 mb-2">
                      <Ruler className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Distance</span>
                    </div>
                    <p className="text-xl font-bold text-stone-900">{selectedRoute.distance} km</p>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3 text-stone-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Est. Time</span>
                    </div>
                    <p className="text-xl font-bold text-stone-900">{selectedRoute.estimated_time}</p>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3 text-stone-400 mb-2">
                      <PackageIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Packages</span>
                    </div>
                    <p className="text-xl font-bold text-stone-900">{routePackages.length}</p>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                    <div className="flex items-center gap-3 text-stone-400 mb-2">
                      <Ruler className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Total Weight</span>
                    </div>
                    <p className="text-xl font-bold text-stone-900">
                      {routePackages.reduce((acc, curr) => acc + (curr.weight || 0), 0).toFixed(1)} kg
                    </p>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {Object.entries(
                    routePackages.reduce((acc: any, curr) => {
                      acc[curr.status] = (acc[curr.status] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([status, count]: [string, any]) => (
                    <div key={status} className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-xl border border-stone-100 whitespace-nowrap">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'Delivered' ? 'bg-green-500' :
                        status === 'In Transit' ? 'bg-blue-500' :
                        'bg-stone-400'
                      }`} />
                      <span className="text-xs font-bold text-stone-600">{status}:</span>
                      <span className="text-xs font-bold text-stone-900">{count}</span>
                    </div>
                  ))}
                </div>

                {/* Assigned Packages Table */}
                <div>
                  <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PackageIcon className="w-5 h-5 text-stone-400" />
                      Assigned Packages
                    </div>
                    {!isAssigning && availablePackages.length > 0 && (
                      <button 
                        onClick={() => setIsAssigning(true)}
                        className="text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        ASSIGN PACKAGES
                      </button>
                    )}
                  </h3>

                  {isAssigning ? (
                    <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-stone-900 uppercase tracking-widest">Select Packages to Assign</h4>
                        <button 
                          onClick={() => {
                            setIsAssigning(false);
                            setPackageSearchTerm('');
                          }} 
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Search and Filter for available packages */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input 
                              type="text" 
                              placeholder="Search by tracking # or name..."
                              className="w-full bg-white border border-stone-100 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-stone-900"
                              value={packageSearchTerm}
                              onChange={(e) => setPackageSearchTerm(e.target.value)}
                            />
                          </div>
                          <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${
                              showFilters || minWeight || maxWeight 
                                ? 'bg-stone-900 border-stone-900 text-white' 
                                : 'bg-white border-stone-100 text-stone-600 hover:border-stone-300'
                            }`}
                          >
                            <Filter className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            Filters
                          </button>
                          <select 
                            className="bg-white border border-stone-100 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest outline-none focus:border-stone-900 appearance-none cursor-pointer"
                            value={packageSortOrder}
                            onChange={(e: any) => setPackageSortOrder(e.target.value)}
                          >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="weight-desc">Weight (High-Low)</option>
                            <option value="weight-asc">Weight (Low-High)</option>
                          </select>
                        </div>

                        <AnimatePresence>
                          {showFilters && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-white border border-stone-100 rounded-xl p-4 grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Min Weight (kg)</label>
                                  <input 
                                    type="number" 
                                    placeholder="0"
                                    className="w-full bg-stone-50 border border-stone-100 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-stone-900"
                                    value={minWeight}
                                    onChange={(e) => setMinWeight(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Max Weight (kg)</label>
                                  <input 
                                    type="number" 
                                    placeholder="Any"
                                    className="w-full bg-stone-50 border border-stone-100 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-stone-900"
                                    value={maxWeight}
                                    onChange={(e) => setMaxWeight(e.target.value)}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="flex items-center justify-between px-1">
                        <button 
                          onClick={() => {
                            const filtered = availablePackages
                              .filter(pkg => {
                                const matchesSearch = pkg.tracking_number.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                                  pkg.sender_name.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                                  pkg.receiver_name.toLowerCase().includes(packageSearchTerm.toLowerCase());
                                
                                const weight = pkg.weight || 0;
                                const matchesMinWeight = minWeight === '' || weight >= parseFloat(minWeight);
                                const matchesMaxWeight = maxWeight === '' || weight <= parseFloat(maxWeight);
                                
                                return matchesSearch && matchesMinWeight && matchesMaxWeight;
                              });
                            const filteredIds = filtered.map(p => p.id);
                            const allSelected = filteredIds.every(id => selectedPackagesToAssign.includes(id));
                            
                            if (allSelected) {
                              setSelectedPackagesToAssign(selectedPackagesToAssign.filter(id => !filteredIds.includes(id)));
                            } else {
                              setSelectedPackagesToAssign([...new Set([...selectedPackagesToAssign, ...filteredIds])]);
                            }
                          }}
                          className="text-[10px] font-bold text-stone-500 hover:text-stone-900 uppercase tracking-widest"
                        >
                          {availablePackages.filter(pkg => {
                            const matchesSearch = pkg.tracking_number.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                              pkg.sender_name.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                              pkg.receiver_name.toLowerCase().includes(packageSearchTerm.toLowerCase());
                            const weight = pkg.weight || 0;
                            const matchesMinWeight = minWeight === '' || weight >= parseFloat(minWeight);
                            const matchesMaxWeight = maxWeight === '' || weight <= parseFloat(maxWeight);
                            return matchesSearch && matchesMinWeight && matchesMaxWeight;
                          }).length > 0 && availablePackages.filter(pkg => {
                            const matchesSearch = pkg.tracking_number.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                              pkg.sender_name.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                              pkg.receiver_name.toLowerCase().includes(packageSearchTerm.toLowerCase());
                            const weight = pkg.weight || 0;
                            const matchesMinWeight = minWeight === '' || weight >= parseFloat(minWeight);
                            const matchesMaxWeight = maxWeight === '' || weight <= parseFloat(maxWeight);
                            return matchesSearch && matchesMinWeight && matchesMaxWeight;
                          }).every(p => selectedPackagesToAssign.includes(p.id)) ? 'Deselect All Visible' : 'Select All Visible'}
                        </button>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          {selectedPackagesToAssign.length} Selected
                        </span>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {availablePackages
                          .filter(pkg => {
                            const matchesSearch = pkg.tracking_number.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                              pkg.sender_name.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                              pkg.receiver_name.toLowerCase().includes(packageSearchTerm.toLowerCase());
                            
                            const weight = pkg.weight || 0;
                            const matchesMinWeight = minWeight === '' || weight >= parseFloat(minWeight);
                            const matchesMaxWeight = maxWeight === '' || weight <= parseFloat(maxWeight);
                            
                            return matchesSearch && matchesMinWeight && matchesMaxWeight;
                          })
                          .sort((a, b) => {
                            if (packageSortOrder === 'newest') return b.id - a.id;
                            if (packageSortOrder === 'oldest') return a.id - b.id;
                            if (packageSortOrder === 'weight-desc') return b.weight - a.weight;
                            if (packageSortOrder === 'weight-asc') return a.weight - b.weight;
                            return 0;
                          })
                          .map(pkg => (
                          <label key={pkg.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            selectedPackagesToAssign.includes(pkg.id) 
                              ? 'bg-stone-900 border-stone-900 text-white' 
                              : 'bg-white border-stone-100 text-stone-900 hover:border-stone-300'
                          }`}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 hidden"
                              checked={selectedPackagesToAssign.includes(pkg.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPackagesToAssign([...selectedPackagesToAssign, pkg.id]);
                                } else {
                                  setSelectedPackagesToAssign(selectedPackagesToAssign.filter(id => id !== pkg.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <p className={`text-sm font-bold ${selectedPackagesToAssign.includes(pkg.id) ? 'text-white' : 'text-stone-900'}`}>
                                {pkg.tracking_number}
                              </p>
                              <p className={`text-[10px] uppercase tracking-widest ${selectedPackagesToAssign.includes(pkg.id) ? 'text-stone-300' : 'text-stone-500'}`}>
                                {pkg.sender_name} → {pkg.receiver_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs font-bold ${selectedPackagesToAssign.includes(pkg.id) ? 'text-stone-200' : 'text-stone-600'}`}>
                                {pkg.weight} kg
                              </p>
                            </div>
                          </label>
                        ))}
                        {availablePackages.filter(pkg => {
                          const matchesSearch = pkg.tracking_number.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                            pkg.sender_name.toLowerCase().includes(packageSearchTerm.toLowerCase()) ||
                            pkg.receiver_name.toLowerCase().includes(packageSearchTerm.toLowerCase());
                          const weight = pkg.weight || 0;
                          const matchesMinWeight = minWeight === '' || weight >= parseFloat(minWeight);
                          const matchesMaxWeight = maxWeight === '' || weight <= parseFloat(maxWeight);
                          return matchesSearch && matchesMinWeight && matchesMaxWeight;
                        }).length === 0 && (
                          <div className="py-8 text-center text-stone-400 italic text-sm">
                            No matching available packages found.
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={assignPackages}
                          disabled={selectedPackagesToAssign.length === 0}
                          className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors shadow-lg shadow-stone-900/20"
                        >
                          ASSIGN SELECTED ({selectedPackagesToAssign.length})
                        </button>
                        <button 
                          onClick={() => {
                            setIsAssigning(false);
                            setSelectedPackagesToAssign([]);
                            setPackageSearchTerm('');
                            setPackageSortOrder('newest');
                            setMinWeight('');
                            setMaxWeight('');
                            setShowFilters(false);
                          }}
                          className="px-6 py-3 border border-stone-200 rounded-xl font-bold text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-stone-50 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
                            <th className="px-4 py-3">Tracking #</th>
                            <th className="px-4 py-3">Sender</th>
                            <th className="px-4 py-3">Receiver</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Weight</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {routePackages.map((pkg) => (
                            <tr key={pkg.id} className="text-sm group">
                              <td className="px-4 py-4 font-bold text-stone-900">{pkg.tracking_number}</td>
                              <td className="px-4 py-4 text-stone-600">{pkg.sender_name}</td>
                              <td className="px-4 py-4 text-stone-600">{pkg.receiver_name}</td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                  pkg.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                  pkg.status === 'In Transit' ? 'bg-blue-100 text-blue-700' :
                                  'bg-stone-100 text-stone-700'
                                }`}>
                                  {pkg.status}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-stone-600">{pkg.weight} kg</td>
                              <td className="px-4 py-4 text-right">
                                <button 
                                  onClick={() => unassignPackage(pkg.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Unassign Package"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {routePackages.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-stone-400 italic">
                                No packages currently assigned to this route.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
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
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-stone-900">
                  {editingRoute ? 'Edit Route' : 'New Route'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Route Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tokyo - Osaka Express"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Origin</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                      value={formData.origin}
                      onChange={e => setFormData({...formData, origin: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Destination</label>
                    <input 
                      type="text" 
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                      value={formData.destination}
                      onChange={e => setFormData({...formData, destination: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Distance (km)</label>
                    <input 
                      type="number" 
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                      value={formData.distance}
                      onChange={e => setFormData({...formData, distance: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Est. Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 6h 30m"
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                      value={formData.estimated_time}
                      onChange={e => setFormData({...formData, estimated_time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button className="w-full bg-stone-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all shadow-lg">
                    {editingRoute ? 'UPDATE ROUTE' : 'CREATE ROUTE'}
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
