import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminAuth } from '../../context/AuthContext';
import {
  X, Shield, Eye, EyeOff, Lock, Mail, Loader2,
  CheckCircle, AlertCircle, Sparkles, BarChart3,
  Package, Users, Settings, TrendingUp
} from 'lucide-react';

export const AdminLoginModal: React.FC = () => {
  const { isAdminLoginOpen, closeAdminLogin, adminLogin } = useAdminAuth();
  const [email, setEmail] = useState('admin@auraluxe.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    setError('');

    const result = await adminLogin(email, password);
    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPassword('');
      }, 800);
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  const ADMIN_FEATURES = [
    { icon: BarChart3, label: 'Revenue Analytics' },
    { icon: Package, label: 'Product Management' },
    { icon: Users, label: 'Order Oversight' },
    { icon: TrendingUp, label: 'Sales Dashboard' },
    { icon: Settings, label: 'Site Configuration' },
  ];

  return (
    <AnimatePresence>
      {isAdminLoginOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAdminLogin}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl glass-panel-strong rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* LEFT PANEL — ADMIN BRANDING */}
            <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-slate-900 via-[#1A0D08] to-slate-900 flex-col justify-between p-8 relative overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF6B35]/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#FF6B35]/10 blur-[60px] rounded-full pointer-events-none" />

              {/* Grid texture */}
              <div className="absolute inset-0 hero-grid opacity-30 pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FF6B35] flex items-center justify-center shadow-lg shadow-[#FF6B35]/30">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-extrabold text-lg tracking-tight">AURA LUXE</span>
                    <span className="block text-[10px] font-bold text-[#FF6B35] tracking-widest uppercase">Admin Console</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white leading-tight">
                    Command Center<br />
                    <span className="text-gradient-primary">Access Portal</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Secure administrative access to monitor orders, manage products, and view real-time analytics.
                  </p>
                </div>

                {/* Feature list */}
                <div className="space-y-3">
                  {ADMIN_FEATURES.map((f, i) => (
                    <motion.div
                      key={f.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 + 0.2 }}
                      className="flex items-center gap-3 text-xs text-slate-300"
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#FF6B35]/15 border border-[#FF6B35]/25 flex items-center justify-center shrink-0">
                        <f.icon className="w-3.5 h-3.5 text-[#FF6B35]" />
                      </div>
                      <span className="font-medium">{f.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Credentials hint */}
              <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-[11px]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Demo Credentials</p>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                  <span className="font-mono">admin@auraluxe.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
                  <span className="font-mono">AuraAdmin2026</span>
                </div>
              </div>
            </div>

            {/* RIGHT PANEL — LOGIN FORM */}
            <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center relative">
              {/* Close button */}
              <button
                onClick={closeAdminLogin}
                className="absolute top-5 right-5 p-2 rounded-xl glass-pill text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="max-w-sm mx-auto w-full space-y-7">
                {/* Mobile Logo */}
                <div className="flex md:hidden items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#FF6B35] flex items-center justify-center">
                    <Shield className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">AURA LUXE</span>
                    <span className="block text-[10px] text-[#FF6B35] font-bold uppercase tracking-widest">Admin Console</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1.5">
                    Admin Sign In
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter your admin credentials to access the full control panel.
                  </p>
                </div>

                {/* Success state */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Access Granted!</p>
                        <p className="text-[11px] opacity-80">Welcome to the Admin Console.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400"
                    >
                      <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                      <p className="text-xs font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@auraluxe.com"
                        className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Admin Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-11 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Quick-fill hint */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      type="button"
                      onClick={() => { setEmail('admin@auraluxe.com'); setPassword('AuraAdmin2026'); setError(''); }}
                      className="text-[#FF6B35] font-semibold hover:underline"
                    >
                      ✦ Use Demo Credentials
                    </button>
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl btn-primary text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Access Admin Console
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Security notice */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <Sparkles className="w-3 h-3 text-[#FF6B35] shrink-0" />
                  <span>Customers & shoppers browse freely without any login requirement.</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
