import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  FolderOpen, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut, 
  User as UserIcon,
  ShieldCheck,
  Menu,
  X,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, ContentItem, Role } from "./types";
import { cn } from "./lib/utils";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import CreateContent from "./components/CreateContent";
import ManageContent from "./components/ManageContent";
import AdminPanel from "./components/AdminPanel";
import Pricing from "./components/Pricing";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";

type View = 'dashboard' | 'create' | 'manage' | 'analytics' | 'admin' | 'settings' | 'pricing';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cookiesBlocked, setCookiesBlocked] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [guestActionCount, setGuestActionCount] = useState(0);

  useEffect(() => {
    // Check if cookies are enabled
    const areCookiesEnabled = () => {
      try {
        document.cookie = "testcookie=1; SameSite=None; Secure";
        const cookieEnabled = document.cookie.indexOf("testcookie=") !== -1;
        document.cookie = "testcookie=1; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
        return cookieEnabled;
      } catch (e) {
        return false;
      }
    };

    if (!areCookiesEnabled()) {
      setCookiesBlocked(true);
    }

    checkAuth();

    const handleOpenAuth = () => setShowAuthModal(true);
    window.addEventListener('open-auth', handleOpenAuth);
    return () => window.removeEventListener('open-auth', handleOpenAuth);
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setShowAuthModal(false);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (user) return true;
    
    if (guestActionCount >= 1) {
      setShowAuthModal(true);
      return false;
    }
    
    setGuestActionCount(prev => prev + 1);
    return true;
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setGuestActionCount(0);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Content', icon: PlusCircle },
    { id: 'manage', label: 'Manage Content', icon: FolderOpen },
    { id: 'pricing', label: 'Pricing & Plans', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <PayPalScriptProvider options={{ 
      clientId: (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || "test",
      currency: "USD",
      intent: "capture"
    }}>
      <div className="min-h-screen bg-bg-dark flex text-text-body relative overflow-hidden">
        {/* Cookie Warning */}
        <AnimatePresence>
          {cookiesBlocked && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center py-2 text-xs font-bold z-[200] flex items-center justify-center gap-2"
            >
              <span>Cookies are blocked in your browser. Login will not work in this iframe.</span>
              <a 
                href={window.location.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:no-underline"
              >
                Open in new tab
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Overlay Backdrop */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
      <aside 
        className={cn(
          "bg-secondary border-r border-white/5 transition-all duration-300 flex flex-col z-50 fixed inset-y-0 left-0",
          isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="bg-primary p-2 rounded-lg neon-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && <span className="font-display font-bold text-xl tracking-tight text-text-heading">CreatorForge</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as View);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                currentView === item.id 
                  ? "bg-primary text-white neon-glow" 
                  : "text-text-body hover:bg-white/5 hover:text-text-heading"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                  {user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate text-text-heading">{user.name}</p>
                    {user.subscription_status && user.subscription_status !== 'free' && (
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/30">
                        {user.subscription_status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-body/60 truncate uppercase tracking-wider font-bold">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-body hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="font-medium">Logout</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white neon-glow transition-all"
            >
              <UserIcon className="w-5 h-5 shrink-0" />
              <span className="font-medium">Sign In</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-secondary/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-body"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text-heading">
                {user ? `Welcome back, ${user.name}` : "Welcome, Guest"}
              </p>
              <p className="text-xs text-text-body/60">
                {user ? "Ready to create something amazing?" : "Sign in to save your work!"}
              </p>
            </div>
            {!user && (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold neon-glow"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {currentView === 'dashboard' && <Dashboard user={user} onNavigate={setCurrentView} />}
              {currentView === 'create' && <CreateContent user={user} onAction={handleAction} />}
              {currentView === 'manage' && <ManageContent user={user} onNavigate={setCurrentView} />}
              {currentView === 'admin' && user?.role === 'admin' && <AdminPanel />}
              {currentView === 'pricing' && <Pricing user={user} onRefresh={checkAuth} />}
              {currentView === 'analytics' && <Analytics user={user} />}
              {currentView === 'settings' && <Settings user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Auth Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <div className="relative w-full max-w-md">
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="absolute top-4 right-4 p-2 text-text-body/60 hover:text-text-heading z-[110]"
                >
                  <X className="w-6 h-6" />
                </button>
                <Auth onLogin={checkAuth} isModal />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
    </PayPalScriptProvider>
  );
}
