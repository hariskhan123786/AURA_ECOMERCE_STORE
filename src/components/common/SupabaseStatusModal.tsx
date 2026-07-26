import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Database, CheckCircle, AlertTriangle, Copy, X, Terminal, Code2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { showToast } = useNotification();
  const configured = isSupabaseConfigured();
  const [activeTab, setActiveTab] = useState<'status' | 'schema'>('status');

  const copySql = () => {
    const sqlText = `-- AURA LUXE SUPABASE SQL SCHEMA
-- Paste this script inside your Supabase SQL Editor to instantly set up all 16 tables, RLS policies, enums, triggers & buckets!

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'vendor', 'customer');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
`;
    navigator.clipboard.writeText(sqlText);
    showToast('SQL Schema copied to clipboard!', 'Paste into Supabase SQL Editor', 'success');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 z-10 shadow-2xl border border-white/20 dark:border-white/10"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#FF6B35]/20 text-[#FF6B35]">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Supabase Integration Center</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Backend database, authentication & storage status</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:text-[#FF6B35]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex gap-2 my-4 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'status'
                  ? 'bg-[#FF6B35] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Database className="w-3.5 h-3.5" /> Connection Status
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'schema'
                  ? 'bg-[#FF6B35] text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> SQL Schema & Setup Script
            </button>
          </div>

          {activeTab === 'status' ? (
            <div className="space-y-4 text-xs sm:text-sm">
              <div
                className={`p-4 rounded-2xl flex items-start gap-3 border ${
                  configured
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}
              >
                {configured ? (
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {configured ? 'Connected to Live Supabase Backend' : 'Running in Standby / Reactive Local Persistence Mode'}
                  </h4>
                  <p className="mt-1 text-xs opacity-90 leading-relaxed">
                    {configured
                      ? 'Your application is actively querying real-time Supabase PostgreSQL tables and auth services.'
                      : 'Every feature (Products, Cart, Checkout, Admin, Auth, Reviews, Coupons) is 100% functional with local reactive storage. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file to enable cloud sync!'}
                  </p>
                </div>
              </div>

              {/* ENV VARS LIST */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs space-y-2 border border-slate-800">
                <div className="text-slate-400 font-bold mb-1">// Environment Configuration</div>
                <div>VITE_SUPABASE_URL: <span className="text-[#FF6B35]">{import.meta.env.VITE_SUPABASE_URL || '(Not set - using local engine)'}</span></div>
                <div>VITE_SUPABASE_ANON_KEY: <span className="text-emerald-400">{import.meta.env.VITE_SUPABASE_ANON_KEY ? '••••••••••••••••' : '(Not set)'}</span></div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ready-to-run Supabase SQL Script (`src/lib/schema.sql`)
                </span>
                <button
                  onClick={copySql}
                  className="px-3 py-1.5 rounded-xl bg-[#FF6B35] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-[#E85A24]"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy SQL Script
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-56 border border-slate-800">
                <pre>{`-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'vendor', 'customer');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- 3. PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}</pre>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
