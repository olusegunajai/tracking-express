import { useState, useEffect, FormEvent } from 'react';
import { Save, Layout, Type, AlignLeft, Plus, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminContent() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSection, setNewSection] = useState({ section: '', title: '', body: '' });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const res = await fetch('/api/content');
    const data = await res.json();
    setContent(data);
    setLoading(false);
  };

  const handleUpdate = async (section: string, title: string, body: string) => {
    setSaving(true);
    const token = localStorage.getItem('tokyo_token');
    await fetch(`/api/content/${section}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, body })
    });
    setSaving(false);
    fetchContent();
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('tokyo_token');
    const res = await fetch('/api/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newSection)
    });
    
    if (res.ok) {
      setShowAddModal(false);
      setNewSection({ section: '', title: '', body: '' });
      fetchContent();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to add section');
    }
    setSaving(false);
  };

  const handleDelete = async (section: string) => {
    if (!confirm(`Are you sure you want to delete the "${section}" section?`)) return;
    
    const token = localStorage.getItem('tokyo_token');
    await fetch(`/api/content/${section}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    fetchContent();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Content Management</h1>
          <p className="text-stone-500 mt-1">Edit the text and media across your public website.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
        >
          <Plus className="w-5 h-5" />
          ADD SECTION
        </button>
      </div>

      <div className="grid gap-8">
        {content.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden"
          >
            <div className="bg-stone-50 p-6 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layout className="text-red-600 w-5 h-5" />
                <h3 className="font-bold text-stone-900 uppercase tracking-widest text-xs">Section: {item.section}</h3>
              </div>
              <button 
                onClick={() => handleDelete(item.section)}
                className="text-stone-400 hover:text-red-600 transition-colors p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Type className="w-3 h-3" /> Heading
                </label>
                <input 
                  type="text" 
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600 font-bold text-lg"
                  defaultValue={item.title}
                  onBlur={(e) => handleUpdate(item.section, e.target.value, item.body)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <AlignLeft className="w-3 h-3" /> Body Text
                </label>
                <textarea 
                  rows={4}
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-4 px-4 outline-none focus:border-red-600 leading-relaxed"
                  defaultValue={item.body}
                  onBlur={(e) => handleUpdate(item.section, item.title, e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => handleUpdate(item.section, item.title, item.body)}
                  disabled={saving}
                  className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-stone-900">Add New Section</h3>
                <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-900">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Section Identifier</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600 font-bold"
                    placeholder="e.g. services, about_us"
                    value={newSection.section}
                    onChange={(e) => setNewSection({...newSection, section: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Heading</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600 font-bold"
                    value={newSection.title}
                    onChange={(e) => setNewSection({...newSection, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Body Text</label>
                  <textarea 
                    rows={4}
                    required
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-4 px-4 outline-none focus:border-red-600"
                    value={newSection.body}
                    onChange={(e) => setNewSection({...newSection, body: e.target.value})}
                  />
                </div>
                <button 
                  disabled={saving}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
                >
                  {saving ? 'ADDING...' : 'ADD SECTION'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
