import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { isSupabaseConfigured, supabase, profileService } from '../lib/supabase';

// =====================================================================
// TYPES — Admin-only auth. Customers browse freely as guests.
// =====================================================================

export type AdminRole = 'admin';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  avatarUrl?: string;
  lastLogin?: string;
}

interface AuthContextType {
  // Admin auth
  admin: AdminUser | null;
  isAdmin: boolean;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;

  // Secret admin login panel trigger
  isAdminLoginOpen: boolean;
  openAdminLogin: () => void;
  closeAdminLogin: () => void;

  // Legacy compatibility aliases (used by existing components)
  user: AdminUser | null;
  isAuthenticated: boolean;
  logout: () => void;
  updateProfile: (updates: Partial<AdminUser>) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
}

// =====================================================================
// DEMO ADMIN CREDENTIALS (fallback when Supabase is not configured)
// =====================================================================
const DEMO_ADMIN_EMAIL = 'admin@auraluxe.com';
const DEMO_ADMIN_PASSWORD = 'AuraAdmin2026';

const DEMO_ADMIN: AdminUser = {
  id: 'admin-001',
  email: DEMO_ADMIN_EMAIL,
  fullName: 'Alexander Vance',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  lastLogin: new Date().toISOString(),
};

// =====================================================================
// CONTEXT
// =====================================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('aura_admin_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // ── Persist admin session ──────────────────────────────────────────
  useEffect(() => {
    if (admin) {
      localStorage.setItem('aura_admin_session', JSON.stringify(admin));
    } else {
      localStorage.removeItem('aura_admin_session');
    }
  }, [admin]);

  // ── Admin Login ────────────────────────────────────────────────────
  const adminLogin = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
          const profile = await profileService.get(data.user.id);
          if (profile?.role === 'admin') {
            const loggedAdmin: AdminUser = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: profile.fullName || 'Administrator',
              role: 'admin',
              avatarUrl: profile.avatarUrl,
              lastLogin: new Date().toISOString(),
            };
            setAdmin(loggedAdmin);
            setIsAdminLoginOpen(false);
            return { success: true };
          }
          // Not an admin — sign them out
          await supabase.auth.signOut();
          return { success: false, error: 'Access denied. Admin privileges required.' };
        }
        return { success: false, error: error?.message || 'Authentication failed.' };
      } catch {
        // Fall through to demo credentials
      }
    }

    // Demo credentials fallback (when Supabase not configured)
    if (email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
      setAdmin({ ...DEMO_ADMIN, lastLogin: new Date().toISOString() });
      setIsAdminLoginOpen(false);
      return { success: true };
    }

    return {
      success: false,
      error: isSupabaseConfigured()
        ? 'Invalid credentials or insufficient privileges.'
        : `Invalid credentials. (Demo: ${DEMO_ADMIN_EMAIL} / ${DEMO_ADMIN_PASSWORD})`,
    };
  }, []);

  const adminLogout = useCallback(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
    setAdmin(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<AdminUser>) => {
    setAdmin((prev) => prev ? { ...prev, ...updates } : prev);
  }, []);

  const value: AuthContextType = {
    admin,
    isAdmin: Boolean(admin),
    isAdminAuthenticated: Boolean(admin),
    adminLogin,
    adminLogout,
    isAdminLoginOpen,
    openAdminLogin: () => setIsAdminLoginOpen(true),
    closeAdminLogin: () => setIsAdminLoginOpen(false),

    // Legacy compat
    user: admin,
    isAuthenticated: Boolean(admin),
    logout: adminLogout,
    updateProfile,
    openAuthModal: () => setIsAdminLoginOpen(true),
    closeAuthModal: () => setIsAdminLoginOpen(false),
    isAuthModalOpen: isAdminLoginOpen,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// =====================================================================
// HOOKS
// =====================================================================

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const useAdminAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AuthProvider');
  return {
    admin: ctx.admin,
    isAdminAuthenticated: ctx.isAdminAuthenticated,
    adminLogin: ctx.adminLogin,
    adminLogout: ctx.adminLogout,
    isAdminLoginOpen: ctx.isAdminLoginOpen,
    openAdminLogin: ctx.openAdminLogin,
    closeAdminLogin: ctx.closeAdminLogin,
  };
};

// =====================================================================
// SECRET ADMIN TRIGGER HOOK
// Used in components that need to detect the secret unlock sequence
// =====================================================================
export const useSecretAdminTrigger = (onTrigger: () => void) => {
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Method 1: 5 rapid clicks on a hidden element
  const handleSecretClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0;
      onTrigger();
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);
  }, [onTrigger]);

  // Method 2: Keyboard shortcut Ctrl+Shift+A (or Cmd+Shift+A on Mac)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        onTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTrigger]);

  // Method 3: URL hash #admin-access
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin-access') {
        history.replaceState(null, '', window.location.pathname);
        onTrigger();
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [onTrigger]);

  return { handleSecretClick };
};
