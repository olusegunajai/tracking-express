import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, collection, query, where, getDocs, deleteDoc, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { ArrowRight, UserPlus, Mail, Lock, User } from 'lucide-react';
import Logo from '../components/Logo';

export default function SignUp() {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: formData.displayName
      });

      // Create user document in Firestore - check for whitelisted email first
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', formData.email));
      const querySnapshot = await getDocs(q);
      
      let initialRole = 'viewer'; // Default fallback (security measure)
      let whitelistDocId = null;

      // Check if this is the first user ever
      const allUsersQuery = query(collection(db, 'users'), limit(1));
      const allUsersSnap = await getDocs(allUsersQuery);
      const isFirstUser = allUsersSnap.empty;
      
      if (isFirstUser) {
        initialRole = 'admin';
      }
      
      if (!querySnapshot.empty) {
        const whitelistDoc = querySnapshot.docs[0];
        const whitelistData = whitelistDoc.data();
        
        // If it's already a full account, block signup
        if (whitelistData.uid) {
           setError('An account with this email already exists.');
           setLoading(false);
           return;
        }
        
        // If it's a whitelist entry, take the role
        if (whitelistData.isWhitelisted) {
          initialRole = whitelistData.role || 'admin';
          whitelistDocId = whitelistDoc.id;
        }
      }

      const userDocData = {
        displayName: formData.displayName,
        email: formData.email,
        role: initialRole,
        photoURL: null,
        createdAt: new Date().toISOString(),
        uid: user.uid,
        isWhitelisted: false // Now a full user
      };

      await setDoc(doc(db, 'users', user.uid), userDocData);

      // Clean up whitelist doc if it was a separate temporary document
      if (whitelistDocId && whitelistDocId !== user.uid) {
        try {
          await deleteDoc(doc(db, 'users', whitelistDocId));
        } catch (err) {
          console.warn('Could not delete whitelist doc (might be the same doc):', err);
        }
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check your internet or ensure third-party cookies are enabled.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('The password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'An error occurred during account creation.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl rotate-3 overflow-hidden border border-stone-100">
            <Logo className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-stone-400 mt-2">Join the administration team</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <User className="w-3 h-3" /> Full Name
              </label>
              <input 
                type="text" 
                required
                className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={e => setFormData({...formData, displayName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Address
              </label>
              <input 
                type="email" 
                required
                className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Lock className="w-3 h-3" /> Password
              </label>
              <input 
                type="password" 
                required
                className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Lock className="w-3 h-3" /> Confirm Password
              </label>
              <input 
                type="password" 
                required
                className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 px-4 outline-none focus:border-stone-900"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all group disabled:opacity-50 shadow-lg shadow-stone-900/20"
            >
              <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
              {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-stone-100 text-center">
            <p className="text-stone-500 text-sm">
              Already have an account?{' '}
              <Link to="/admin/login" className="text-stone-900 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
