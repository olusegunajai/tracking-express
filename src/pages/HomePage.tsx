import { useState, useEffect } from 'react';
import { Search, Package, MapPin, Clock, ShieldCheck, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function HomePage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [content, setContent] = useState<any>({});

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => {
        const hero = data.find((c: any) => c.section === 'hero');
        if (hero) setContent(hero);
      });
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPackageInfo(null);
    try {
      const res = await fetch(`/api/packages/${trackingNumber}`);
      if (!res.ok) throw new Error('Package not found');
      const data = await res.json();
      setPackageInfo(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Navbar */}
      <nav className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center overflow-hidden">
             <img src="https://ais-pre-vgrogfqn4nt5cpncslls24-458691759309.europe-west2.run.app/logo.png" alt="Tokyo Express" className="w-8 h-8 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900">TOKYO EXPRESS</span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-stone-600">
          <a href="#" className="hover:text-red-600 transition-colors">Services</a>
          <a href="#" className="hover:text-red-600 transition-colors">Global Network</a>
          <a href="#" className="hover:text-red-600 transition-colors">About</a>
          <a href="#" className="hover:text-red-600 transition-colors">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-stone-900">
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          alt="Logistics"
          referrerPolicy="no-referrer"
        />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tighter"
          >
            {content.title || "Fast & Reliable Logistics"}
          </motion.h1>
          <p className="text-xl text-stone-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            {content.body || "Tokyo Express provides seamless package delivery across the globe with real-time tracking."}
          </p>
          
          {/* Tracking Form */}
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleTrack}
            className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl mx-auto"
          >
            <div className="flex-1 flex items-center px-4 gap-3">
              <Search className="text-stone-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Enter Tracking Number (e.g. TK-123456)" 
                className="w-full py-3 outline-none text-stone-800 font-medium"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all transform active:scale-95">
              TRACK PACKAGE
            </button>
          </motion.form>
          
          {error && <p className="text-red-400 mt-4 font-medium">{error}</p>}
        </div>
      </section>

      {/* Tracking Result */}
      {packageInfo && (
        <section className="max-w-4xl mx-auto -mt-20 relative z-20 px-4 mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden"
          >
            <div className="bg-stone-900 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-1">Tracking Number</p>
                <h3 className="text-2xl font-mono font-bold">{packageInfo.tracking_number}</h3>
              </div>
              <div className="bg-red-600 px-4 py-2 rounded-lg font-bold text-sm">
                {packageInfo.status.toUpperCase()}
              </div>
            </div>
            <div className="p-8 grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="text-stone-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs font-bold uppercase">From</p>
                    <p className="text-lg font-bold text-stone-800">{packageInfo.origin}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="text-red-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs font-bold uppercase">To</p>
                    <p className="text-lg font-bold text-stone-800">{packageInfo.destination}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
                    <Clock className="text-stone-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs font-bold uppercase">Estimated Delivery</p>
                    <p className="text-lg font-bold text-stone-800">{packageInfo.estimated_delivery}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center shrink-0">
                    <Package className="text-stone-600 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-stone-400 text-xs font-bold uppercase">Weight</p>
                    <p className="text-lg font-bold text-stone-800">{packageInfo.weight} kg</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">Why Choose Tokyo Express?</h2>
          <div className="w-20 h-1 bg-red-600 mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <Globe className="text-red-600 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Global Reach</h3>
            <p className="text-stone-600 leading-relaxed">Connecting over 220 countries and territories with our extensive logistics network.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="text-red-600 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure Handling</h3>
            <p className="text-stone-600 leading-relaxed">State-of-the-art security systems ensure your packages arrive safely and intact.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-shadow">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <Clock className="text-red-600 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Express Speed</h3>
            <p className="text-stone-600 leading-relaxed">Next-day delivery options for urgent shipments across major metropolitan areas.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center overflow-hidden">
                  <img src="https://ais-pre-vgrogfqn4nt5cpncslls24-458691759309.europe-west2.run.app/logo.png" alt="Tokyo Express" className="w-6 h-6 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
               </div>
              <span className="text-lg font-bold tracking-tight">TOKYO EXPRESS</span>
            </div>
            <p className="text-stone-400 max-w-sm">
              The world's leading logistics provider, committed to delivering excellence every time.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-stone-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-stone-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-stone-800 text-stone-500 text-xs flex flex-col md:flex-row justify-between gap-4">
          <p>© 2026 Tokyo Express Logistics. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/admin" className="hover:text-stone-300">Admin Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
