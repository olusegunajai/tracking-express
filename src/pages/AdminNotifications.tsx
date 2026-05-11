import { useState, useEffect } from 'react';
import { Bell, Mail, Clock, CheckCircle2, Trash2, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.isRead).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { isRead: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteDoc(doc(db, 'notifications', id));
      } catch (err) {
        console.error('Error deleting notification:', err);
      }
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' ? true : (filter === 'unread' ? !n.isRead : n.isRead);
    const matchesSearch = n.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         n.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'signup': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'password_reset': return <Mail className="w-5 h-5 text-blue-500" />;
      case 'admin_reset': return <Bell className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-stone-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight flex items-center gap-4">
            System Notifications
            <span className="bg-stone-200 text-stone-600 text-xs px-2 py-1 rounded-full font-bold">
              {notifications.filter(n => !n.isRead).length} UNREAD
            </span>
          </h1>
          <p className="text-stone-500 mt-2 font-medium">Monitor system activity and email logs</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="flex items-center gap-2 px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl font-bold transition-all text-sm"
        >
          MARK ALL AS READ
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-stone-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl outline-none focus:border-stone-900 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-stone-200">
            {['all', 'unread', 'read'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                  ${filter === f 
                    ? 'bg-stone-900 text-white' 
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'}
                `}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-stone-100">
          <AnimatePresence initial={false}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`group p-6 hover:bg-stone-50 transition-all ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center shrink-0">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-bold transition-all ${!n.isRead ? 'text-stone-900' : 'text-stone-600'}`}>
                          {n.subject}
                        </h3>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.isRead && (
                            <button 
                              onClick={() => markAsRead(n.id)}
                              className="p-2 hover:bg-white rounded-lg text-stone-400 hover:text-green-600 shadow-sm border border-transparent hover:border-green-100 transition-all"
                              title="Mark as read"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(n.id)}
                            className="p-2 hover:bg-white rounded-lg text-stone-400 hover:text-red-600 shadow-sm border border-transparent hover:border-red-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <Mail className="w-3 h-3" />
                          <span>Sent to: <span className="font-bold text-stone-900">{n.email}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(n.createdAt).toLocaleString()}</span>
                        </div>
                        {n.isRead && (
                          <span className="text-[10px] font-bold bg-stone-100 text-stone-400 px-2 py-0.5 rounded uppercase tracking-widest">
                            READ
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-stone-500 line-clamp-2 mt-2 leading-relaxed">
                        {n.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-20 text-center space-y-4">
                <Bell className="w-12 h-12 text-stone-200 mx-auto" />
                <div>
                  <p className="text-stone-500 font-medium">No notifications found</p>
                  <p className="text-stone-400 text-sm">System alerts and email logs will appear here</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
