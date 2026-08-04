import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminAuth } from '../../context/AuthContext';
import {
  X, Shield, Eye, EyeOff, Lock, Mail, Loader2,
  CheckCircle, AlertCircle, Sparkles, BarChart3,
  Package, Users, Settings, TrendingUp, KeyRound
} from 'lucide-react';

// =====================================================================
// ADMIN LOGIN MODAL — SECRET ACCESS
// This modal is hidden from all public-facing UI.
// Access methods:
//   1. Keyboard: Ctrl+Shift+A  (or Cmd+Shift+A on Mac)
//   2. URL hash: navigate to /#admin-access
//   3. Secret click: 5 rapid clicks on the hidden bottom-right dot
// =====================================================================

export const AdminLoginModal: React.FC = () => {
  const { isAdminLoginOpen, closeAdminLogin, adminLogin } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Clear fields when modal closes
  useEffect(() => {
    if (!isAdminLoginOpen) {
      setError('');
      setSuccess(false);
      setPassword('');
      setEmail('');
      setShowPassword(false);
    }
  }, [isAdminLoginOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    setError('');

    const result = await adminLogin(email.trim(), password);
    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1200);
    } else {
      setError(result.error || 'Authentication failed.');
    }
  };

  const ADMIN_FEATURES = [
    { icon: BarChart3, label: 'Revenue Analytics & Charts' },
    { icon: Package, label: 'Product & Inventory CRUD' },
    { icon: Users, label: 'Customer & Order Management' },
    { icon: TrendingUp, label: 'Real-time Sales Dashboard' },
    { icon: Settings, label: 'Coupons & Site Config' },
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
            className="absolute inset-0 bg-black/80 backdrop-blur-lg"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl glass-panel-strong rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          >
            {/* LEFT PANEL — ADMIN BRANDING */}
            <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-slate-950 via-[#110905] to-slate-950 flex-col justify-between p-8 relative overflow-hidden">
              {/* Ambient glows */}
              <div className="absolute top-0 left-0 w-72 h-72 bg-[#FF6B35]/15 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-56 h-56 bg-[#FF6B35]/08 blur-[80px] rounded-full pointer-events-none" />
              <div className="absolute inset-0 hero-grid opacity-20 pointer-events-none" />

              <div className="relative z-10 space-y-7">
                {/* Logo */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FF6B35] flex items-center justify-center shadow-lg shadow-[#FF6B35]/40">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-white font-extrabold text-lg tracking-tight">AURA LUXE</span>
                    <span className="block text-[10px] font-bold text-[#FF6B35] tracking-widest uppercase">Secure Admin Portal</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white leading-tight">
                    Command<br />
                    <span className="text-gradient-primary">Center</span>
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Restricted access. Authorized personnel only. All activity is logged and monitored.
                  </p>
                </div>

                {/* Feature list */}
                <div className="space-y-3">
                  {ADMIN_FEATURES.map((f, i) => (
                    <motion.div
                      key={f.label}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 + 0.15 }}
                      className="flex items-center gap-3 text-xs text-slate-300"
                    >
                      <div className="w-7 h-7 rounded-xl bg-[#FF6B35]/15 border border-[#FF6B35]/20 flex items-center justify-center shrink-0">
                        <f.icon className="w-3.5 h-3.5 text-[#FF6B35]" />
                      </div>
                      <span className="font-medium">{f.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Security notice — no public credentials shown */}
              <div className="relative z-10 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Restricted Zone</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  This portal is not publicly listed. Customers browse without any authentication requirement.
                </p>
              </div>
            </div>

            {/* RIGHT PANEL — LOGIN FORM */}
            <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center relative bg-[var(--bg-panel)]/95">
              {/* Close button */}
              <button
                onClick={closeAdminLogin}
                className="absolute top-5 right-5 p-2 rounded-xl glass-pill text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="max-w-sm mx-auto w-full space-y-6">
                {/* Mobile Logo */}
                <div className="flex md:hidden items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-[#FF6B35] flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">AURA LUXE</span>
                    <span className="block text-[10px] text-[#FF6B35] font-bold uppercase tracking-widest">Admin Console</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1.5">
                    Administrator Login
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enter your secure admin credentials. This session will be monitored.
                  </p>
                </div>

                {/* Success state */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Access Granted</p>
                        <p className="text-[11px] opacity-75">Welcome to the Command Center.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Admin Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="admin@domain.com"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-11 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all"
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

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    disabled={isLoading || success}
                    className="w-full py-3.5 rounded-2xl btn-primary text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
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

                {/* Footer notice */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Sparkles className="w-3 h-3 text-[#FF6B35] shrink-0" />
                  <span>Customers shop freely — no account required.</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
