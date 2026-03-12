import { useState, useEffect } from 'react';
import { User, Shield, Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem('tokyo_token');
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">User Management</h1>
          <p className="text-stone-500 mt-1">Manage administrative access and roles.</p>
        </div>
        <button className="bg-stone-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
          <Plus className="w-5 h-5" />
          ADD USER
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-stone-50 text-stone-400 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-8 py-4">User</th>
              <th className="px-8 py-4">Role</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50/50 transition-colors group">
                <td className="px-8 py-6 flex items-center gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-bold">
                    {u.username[0].toUpperCase()}
                  </div>
                  <span className="font-bold text-stone-900">{u.username}</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2 text-stone-600">
                    <Shield className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">{u.role}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Active
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
