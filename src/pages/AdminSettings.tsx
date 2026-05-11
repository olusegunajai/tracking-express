import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { Settings as SettingsIcon, Mail, Globe, Shield, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from '../components/Logo';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, getDocs, setDoc, query, limit } from 'firebase/firestore';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const q = query(collection(db, 'settings'), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setSettings(snapshot.docs[0].data());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(key);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Keep using the server for file storage as it's easier than Firebase Storage setup for now
      const res = await fetch('/api/settings/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const { filePath } = await res.json();
        setSettings({ ...settings, [key]: filePath });
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Save to Firestore 'settings/global'
      await setDoc(doc(db, 'settings', 'global'), settings);
      alert('Settings saved successfully');
      
      if (settings.site_name) {
        document.title = `Admin | ${settings.site_name}`;
      }
      
      if (settings.site_favicon) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.site_favicon;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('This will trigger a system-wide admin password reset process. Proceed?')) return;
    
    setResettingPassword(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: settings.contact_email })
      });
      
      if (res.ok) {
        alert('Password reset process initiated. Check email for instructions.');
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering password reset');
    } finally {
      setResettingPassword(false);
    }
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

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Site Logo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-center overflow-hidden">
                    {settings.site_logo ? (
                      <img src={settings.site_logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Logo className="w-12 h-12" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={logoInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'site_logo')}
                  />
                  <button 
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploading === 'site_logo'}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading === 'site_logo' ? 'UPLOADING...' : 'UPLOAD LOGO'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Favicon
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-stone-50 border border-stone-100 rounded-xl flex items-center justify-center overflow-hidden">
                    {settings.site_favicon ? (
                      <img src={settings.site_favicon} alt="Favicon" className="w-8 h-8 object-contain" />
                    ) : (
                      <Logo className="w-8 h-8" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={faviconInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'site_favicon')}
                  />
                  <button 
                    type="button"
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploading === 'site_favicon'}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    {uploading === 'site_favicon' ? 'UPLOADING...' : 'UPLOAD FAVICON'}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-8">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Notification Settings (SMTP)
              </label>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">SMTP Host</label>
                  <input 
                    type="text" 
                    placeholder="smtp.example.com"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={settings.smtp_host || ''}
                    onChange={(e) => setSettings({...settings, smtp_host: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">SMTP Port</label>
                  <input 
                    type="text" 
                    placeholder="587"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={settings.smtp_port || ''}
                    onChange={(e) => setSettings({...settings, smtp_port: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">SMTP User</label>
                  <input 
                    type="text" 
                    placeholder="user@example.com"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={settings.smtp_user || ''}
                    onChange={(e) => setSettings({...settings, smtp_user: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">SMTP Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={settings.smtp_pass || ''}
                    onChange={(e) => setSettings({...settings, smtp_pass: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">From Address</label>
                  <input 
                    type="email" 
                    placeholder="notifications@tokyoexpress.com"
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-red-600"
                    value={settings.smtp_from || ''}
                    onChange={(e) => setSettings({...settings, smtp_from: e.target.value})}
                  />
                </div>
              </div>
              <p className="mt-4 text-xs text-stone-400 italic">
                Notifications will be sent to the receiver's email when a package status changes to 'Delivered' or 'In Transit'.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield className="w-3 h-3" /> Admin Security
              </label>
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4">
                <p className="text-sm text-stone-600">Access control is managed via Firebase Authentication.</p>
                <div className="pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resettingPassword}
                    className="bg-stone-900 hover:bg-black text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Shield className="w-4 h-4" />
                    {resettingPassword ? 'PROCESSING...' : 'TRIGGER ADMIN PASSWORD RESET'}
                  </button>
                  <p className="mt-2 text-[10px] text-stone-400 font-medium">Sends an automated reset link to the configured support email.</p>
                </div>
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
