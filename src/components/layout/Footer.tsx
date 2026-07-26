import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNotification } from '../../context/NotificationContext';
import {
  Mail, ArrowRight, ShieldCheck, Truck, RefreshCw, CreditCard,
  Sparkles, Instagram, Twitter, MessageCircle, Github,
  ArrowUp, MapPin, Phone, Clock
} from 'lucide-react';

export const Footer: React.FC<{ onSelectCategory: (catId: string) => void }> = ({ onSelectCategory }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { showToast } = useNotification();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    showToast('Subscribed!', 'Use coupon code AURA20 for 20% off your first order!', 'success');
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const SOCIAL_LINKS = [
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Twitter, label: 'X / Twitter', href: '#' },
    { icon: MessageCircle, label: 'Discord', href: '#' },
    { icon: Github, label: 'GitHub', href: '#' },
  ];

  const FOOTER_LINKS = {
    Categories: [
      { label: 'Cyber Tech & Audio', action: () => onSelectCategory('cat-1') },
      { label: 'Luxury Timepieces', action: () => onSelectCategory('cat-2') },
      { label: 'Haute Apparel', action: () => onSelectCategory('cat-3') },
      { label: 'Performance Footwear', action: () => onSelectCategory('cat-4') },
      { label: 'Leather Goods', action: () => onSelectCategory('cat-5') },
    ],
    'Customer Service': [
      { label: 'Order Status & Tracking', href: '#tracking' },
      { label: 'Shipping & Customs', href: '#shipping' },
      { label: 'Concierge Returns', href: '#returns' },
      { label: 'Aura 2-Year Warranty', href: '#warranty' },
      { label: 'Contact Concierge', href: '#contact' },
    ],
    'Company & Legal': [
      { label: 'About AURA Studio', href: '#about' },
      { label: 'Sustainability Report', href: '#sustainability' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Security & RLS', href: '#security' },
    ],
  };

  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-slate-800/60 bg-slate-900 text-slate-100 dark:bg-[#06060A] pt-16 pb-10 transition-colors relative">
      {/* Back to top */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={scrollToTop}
        className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shadow-lg shadow-[#FF6B35]/35 hover:bg-[#E85A24] transition-colors z-10"
        title="Back to top"
      >
        <ArrowUp className="w-4 h-4" />
      </motion.button>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-14">

        {/* NEWSLETTER SECTION */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-[#160A04] to-slate-900 border border-white/10 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          {/* Glow orb */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF6B35]/12 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/08 blur-[80px] rounded-full pointer-events-none" />

          <div className="space-y-2.5 text-center lg:text-left z-10">
            <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#FF6B35]/20 text-[#FF6B35] inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> VIP Access & Drops
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Unlock 20% Off Your First<br />Aura Purchase
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              Join our insider list for private flash drops, early release access, and bespoke luxury styling guides.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full lg:w-auto z-10">
            <div className="relative flex-1 lg:w-80">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition-all"
                required
              />
            </div>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              className={`py-3 px-6 rounded-2xl text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                subscribed
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25'
                  : 'bg-[#FF6B35] hover:bg-[#E85A24] shadow-lg shadow-[#FF6B35]/25'
              }`}
            >
              {subscribed ? '✓ Subscribed!' : (<>Subscribe <ArrowRight className="w-4 h-4" /></>)}
            </motion.button>
          </form>
        </div>

        {/* VALUE PROPS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 py-8 border-y border-slate-800/60">
          {[
            { icon: Truck, title: 'Express Global Shipping', sub: 'Complimentary on orders over $200' },
            { icon: ShieldCheck, title: 'Authenticity Guaranteed', sub: '100% verified luxury provenance' },
            { icon: RefreshCw, title: '30-Day Concierge Returns', sub: 'Hassle-free global collection' },
            { icon: CreditCard, title: 'Multi-Gateway Checkout', sub: 'Stripe, PayPal, JazzCash, COD & Bank' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-[#FF6B35]/12 text-[#FF6B35] shrink-0">
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h5 className="font-bold text-white text-xs">{item.title}</h5>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN FOOTER LINKS */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-10 text-xs">
          {/* Brand column */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center font-black text-lg shadow-lg shadow-[#FF6B35]/30">
                A
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">AURA LUXE</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              The premier destination for next-generation spatial audio, high-performance timepieces, and modern haute couture.
            </p>

            {/* Contact info */}
            <div className="space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                <span>123 Aura Boulevard, Tech District, NY 10001</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                <span>+1 (800) AURA-LUX</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                <span>Mon–Sat 9AM–8PM EST</span>
              </div>
            </div>

            {/* Payment methods */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Supported Gateways</span>
              <div className="flex flex-wrap gap-2">
                {['Stripe', 'PayPal', 'JazzCash', 'EasyPaisa', 'Bank Wire', 'COD'].map((m) => (
                  <span key={m} className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Links columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="font-extrabold text-white uppercase text-[10px] tracking-widest mb-4">{heading}</h4>
              <ul className="space-y-2.5 text-slate-400">
                {links.map((link: any) => (
                  <li key={link.label}>
                    {link.action ? (
                      <button
                        onClick={link.action}
                        className="hover:text-[#FF6B35] transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a href={link.href} className="hover:text-[#FF6B35] transition-colors">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* BOTTOM BAR */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 AURA LUXE Inc. All rights reserved. Powered by Supabase & Gemini AI.</p>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <motion.a
                key={social.label}
                href={social.href}
                whileHover={{ scale: 1.15, color: '#FF6B35' }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-[#FF6B35] hover:border-[#FF6B35]/40 hover:bg-[#FF6B35]/10 transition-all"
                title={social.label}
              >
                <social.icon className="w-3.5 h-3.5" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
