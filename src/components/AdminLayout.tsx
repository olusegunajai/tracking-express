import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  FileText, 
  Map, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Package, label: 'Packages', path: '/admin/packages' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: FileText, label: 'Content', path: '/admin/content' },
    { icon: Map, label: 'Routes', path: '/admin/routes' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-stone-900 text-white flex flex-col fixed h-full z-30">
        <div className="p-8 flex items-center gap-3 border-b border-stone-800">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shrink-0">
             <img src="https://ais-pre-vgrogfqn4nt5cpncslls24-458691759309.europe-west2.run.app/logo.png" alt="Logo" className="w-7 h-7 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight leading-none">TOKYO</h1>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Express Admin</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center justify-between p-4 rounded-xl transition-all group
                ${isActive ? 'bg-red-600 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-white'}
              `}
            >
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-stone-800">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 bg-stone-800 rounded-full flex items-center justify-center text-red-600 font-bold">
              {user?.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold">{user?.username}</p>
              <p className="text-[10px] text-stone-500 uppercase font-bold">Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-stone-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-12">
        {children}
      </main>
    </div>
  );
}
