import { useState, useEffect } from 'react';
import { Save, Layout, Type, AlignLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminContent() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Content Management</h1>
        <p className="text-stone-500 mt-1">Edit the text and media across your public website.</p>
      </div>

      <div className="grid gap-8">
        {content.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden"
          >
            <div className="bg-stone-50 p-6 border-b border-stone-100 flex items-center gap-3">
              <Layout className="text-red-600 w-5 h-5" />
              <h3 className="font-bold text-stone-900 uppercase tracking-widest text-xs">Section: {item.section}</h3>
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
    </div>
  );
}
