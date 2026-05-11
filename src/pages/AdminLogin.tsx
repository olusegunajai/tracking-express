import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, LogIn, Mail, Lock, ShieldCheck, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo';
import { auth, db } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [loginMethod, setLoginMethod] = useState<'email' | 'google'>('email');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Attempt to load settings from Firestore instead of /api/settings if possible
    const loadSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setSiteSettings(data);
          if (data.site_name) {
            document.title = `Admin Login | ${data.site_name}`;
          }
        } else {
          // Fallback to API if Firestore document doesn't exist yet
          const res = await fetch('/api/settings');
          if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            const data = await res.json();
            setSiteSettings(data);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Network request failed. This may be due to a strict firewall, blocked third-party cookies, or being offline.');
      } else {
        setError(err.message === 'Firebase: Error (auth/user-not-found).' ? 'User not found.' : 
                  err.message === 'Firebase: Error (auth/wrong-password).' ? 'Incorrect password.' : 
                  err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Ensure we ask for account selection to "repair" potential session stickiness
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Check for whitelisted email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', result.user.email));
        const querySnapshot = await getDocs(q);
        
        let initialRole = 'admin';
        if (!querySnapshot.empty) {
          const whitelistDoc = querySnapshot.docs[0];
          initialRole = whitelistDoc.data().role || 'admin';
          // Delete old whitelist entry if its ID isn't the UID
          if (whitelistDoc.id !== result.user.uid) {
            await deleteDoc(doc(db, 'users', whitelistDoc.id));
          }
        }

        await setDoc(userDocRef, {
          displayName: result.user.displayName,
          email: result.user.email,
          role: initialRole,
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          uid: result.user.uid
        });
      } else {
        // Update user info if it exists
        await setDoc(userDocRef, {
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastLogin: serverTimestamp()
        }, { merge: true });
      }
      
      navigate('/admin/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login popup was closed. Please try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network request failed. Please check your connection.');
      } else {
        setError(err.message);
      }
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
               <Logo className="w-12 h-12" />
             )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-stone-400 mt-2">Manage {siteSettings.site_name || 'Tokyo Express'}</p>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex border-b border-stone-100">
            <button 
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${
                loginMethod === 'email' ? 'bg-white text-stone-900' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
              }`}
            >
              Email Login
            </button>
            <button 
              onClick={() => setLoginMethod('google')}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors ${
                loginMethod === 'google' ? 'bg-white text-stone-900' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'
              }`}
            >
              Google Login
            </button>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {loginMethod === 'email' ? (
                <motion.form 
                  key="email-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleEmailLogin} 
                  className="space-y-6"
                >
                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Email Address
                    </label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Password
                      </label>
                      <Link to="/admin/forgot-password/reset" className="text-xs text-stone-400 hover:text-stone-900">
                        Forgot?
                      </Link>
                    </div>
                    <input 
                      type="password" 
                      required
                      className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-stone-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all group disabled:opacity-50 shadow-lg shadow-stone-900/20"
                  >
                    <LogIn className="w-5 h-5 transition-transform group-hover:scale-110" />
                    {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="google-login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6 text-center"
                >
                  <div className="py-4">
                    <p className="text-sm text-stone-600 mb-6">
                      Use your authorized Google account to access the administration panel.
                    </p>
                    <button 
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full bg-white border-2 border-stone-100 hover:border-stone-900 text-stone-900 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all group disabled:opacity-50"
                    >
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                      {loading ? 'AUTHENTICATING...' : 'CONTINUE WITH GOOGLE'}
                    </button>
                  </div>
                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100 text-left">
                      {error}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-8 border-t border-stone-100 text-center">
              <p className="text-stone-500 text-sm">
                Don't have an account?{' '}
                <Link to="/admin/register" className="text-stone-900 font-bold hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-stone-500 text-xs mt-8 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          Authorized Personnel Only. Secure Environment.
        </p>
      </motion.div>
    </div>
  );
}

