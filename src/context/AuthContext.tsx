import React, { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// ====================================
// ADMIN-ONLY AUTHENTICATION
// No customer/vendor login required
// Shoppers browse freely as guests
// ====================================

export type AdminRole = 'admin';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  avatarUrl?: string;
  lastLogin?: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  isAdminLoginOpen: boolean;
  openAdminLogin: () => void;
  closeAdminLogin: () => void;
}

// Demo admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@auraluxe.com',
  password: 'AuraAdmin2026',
};

const DEMO_ADMIN: AdminUser = {
  id: 'admin-001',
  email: 'admin@auraluxe.com',
  fullName: 'Alexander Vance',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  lastLogin: new Date().toISOString(),
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('aura_admin_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  useEffect(() => {
    if (admin) {
      localStorage.setItem('aura_admin_session', JSON.stringify(admin));
    } else {
      localStorage.removeItem('aura_admin_session');
    }
  }, [admin]);

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Try Supabase first if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const loggedAdmin: AdminUser = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || 'Administrator',
            role: 'admin',
            avatarUrl: data.user.user_metadata?.avatar_url,
            lastLogin: new Date().toISOString(),
          };
          setAdmin(loggedAdmin);
          setIsAdminLoginOpen(false);
          return { success: true };
        }
      } catch (_) {}
    }

    // Fallback: demo credentials
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      const loggedAdmin = { ...DEMO_ADMIN, lastLogin: new Date().toISOString() };
      setAdmin(loggedAdmin);
      setIsAdminLoginOpen(false);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid credentials. Use admin@auraluxe.com / AuraAdmin2026',
    };
  };

  const adminLogout = () => {
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAdminAuthenticated: Boolean(admin),
        adminLogin,
        adminLogout,
        isAdminLoginOpen,
        openAdminLogin: () => setIsAdminLoginOpen(true),
        closeAdminLogin: () => setIsAdminLoginOpen(false),
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AuthProvider');
  return context;
};

// Legacy compat alias (used by Navbar, AdminPanel etc.)
export const useAuth = () => {
  const ctx = useAdminAuth();
  return {
    user: ctx.admin as any,
    isAuthenticated: ctx.isAdminAuthenticated,
    isAdmin: ctx.isAdminAuthenticated,
    isVendor: false,
    logout: ctx.adminLogout,
    switchRole: (_: any) => {},
    updateProfile: (_: any) => {},
    isAuthModalOpen: ctx.isAdminLoginOpen,
    openAuthModal: ctx.openAdminLogin,
    closeAuthModal: ctx.closeAdminLogin,
    loginWithGoogle: async () => {},
    loginWithGithub: async () => {},
    login: async () => {},
  };
};
