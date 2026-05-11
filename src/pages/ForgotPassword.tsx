import { useState, useEffect, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Send, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
      
      // Trigger System Notification
      try {
        await fetch('/api/notify/system', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'password_reset',
            email: email,
            details: { 
              resetLink: `https://${window.location.host}/admin/login` // Fallback since Firebase handles the actual link
            }
          })
        });
      } catch (notifyErr) {
        console.warn('Notification trigger failed:', notifyErr);
      }
    } catch (err: any) {
      setError(err.message);
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Reset Password</h1>
          <p className="text-stone-400 mt-2">We'll send you instructions via email</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {message ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-green-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-stone-900">Check your inbox</h2>
                <p className="text-stone-500 text-sm leading-relaxed">
                  We've sent a secure password reset link to <br/>
                  <span className="font-bold text-stone-900">{email}</span>
                </p>
              </div>
              <div className="pt-6">
                <Link 
                  to="/admin/login" 
                  className="bg-stone-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> BACK TO LOGIN
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Registered Email
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

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 hover:bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all group disabled:opacity-50 shadow-lg shadow-stone-900/20"
              >
                <Send className="w-5 h-5 transition-transform group-hover:scale-110" />
                {loading ? 'SENDING EMAIL...' : 'SEND RESET LINK'}
              </button>

              <div className="text-center pt-4">
                <Link to="/admin/login" className="inline-flex items-center gap-2 text-stone-500 text-sm hover:text-stone-900 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Return to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
