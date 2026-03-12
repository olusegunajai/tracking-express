import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Mail, Globe, Shield, Save } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings');
    const data = await res.json();
    setSettings(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('tokyo_token');
    await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    setSaving(false);
    alert('Settings saved successfully');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">System Settings</h1>
        <p className="text-stone-500 mt-1">Configure global application parameters and branding.</p>
      </div>

      <form onSubmit={handleSave} className="max-w-3xl space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden"
        >
          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Site Name
                </label>
                <input 
                  type="text" 
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600 font-bold"
                  value={settings.site_name || ''}
                  onChange={(e) => setSettings({...settings, site_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Support Email
                </label>
                <input 
                  type="email" 
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600 font-bold"
                  value={settings.contact_email || ''}
                  onChange={(e) => setSettings({...settings, contact_email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield className="w-3 h-3" /> Admin Security
              </label>
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                <p className="text-sm text-stone-600 mb-4">Password changes require a full system restart in the current configuration.</p>
                <button type="button" className="text-red-600 font-bold text-sm hover:underline">Change Admin Password</button>
              </div>
            </div>
          </div>
          
          <div className="bg-stone-50 p-8 border-t border-stone-100 flex justify-end">
            <button 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'SAVING...' : 'SAVE CONFIGURATION'}
            </button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
