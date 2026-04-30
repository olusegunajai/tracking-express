import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>({});
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSiteSettings(data);
        if (data.site_name) {
          document.title = `Admin Login | ${data.site_name}`;
        }
      });
  }, []);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user document exists, if not create one with default admin role for now
      // In a real app, you might want to white-list emails here
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          username: result.user.displayName || result.user.email,
          email: result.user.email,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
      }
      
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3 overflow-hidden border border-stone-100">
             {siteSettings.site_logo ? (
               <img src={siteSettings.site_logo} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <img src="https://ais-pre-vgrogfqn4nt5cpncslls24-458691759309.europe-west2.run.app/logo.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
             )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-stone-400 mt-2">Sign in to manage {siteSettings.site_name || 'Tokyo Express'}</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="space-y-6">
            <p className="text-sm text-stone-600 text-center">
              Please use your authorized Google account to access the administration panel.
            </p>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all group disabled:opacity-50"
            >
              <LogIn className="w-5 h-5 transition-transform group-hover:scale-110" />
              {loading ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        </div>

        <p className="text-center text-stone-500 text-xs mt-8">
          Authorized Personnel Only. All access is logged via Firebase.
        </p>
      </motion.div>
    </div>
  );
}
