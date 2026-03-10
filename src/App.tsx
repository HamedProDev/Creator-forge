import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  FolderOpen, 
  BarChart3, 
  Settings, 
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

type View = 'dashboard' | 'create' | 'manage' | 'analytics' | 'admin' | 'settings' | 'pricing';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={checkAuth} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Content', icon: PlusCircle },
    { id: 'manage', label: 'Manage Content', icon: FolderOpen },
    { id: 'pricing', label: 'Pricing & Plans', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (user.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <PayPalScriptProvider options={{ 
      clientId: (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || "test",
      currency: "USD",
      intent: "capture"
    }}>
      <div className="min-h-screen bg-bg-dark flex text-text-body">
        {/* Sidebar */}
      <aside 
        className={cn(
          "bg-secondary border-r border-white/5 transition-all duration-300 flex flex-col z-50",
          isSidebarOpen ? "w-64" : "w-20"
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
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                currentView === item.id 
                  ? "bg-primary text-white neon-glow" 
                  : "text-text-body hover:bg-white/5 hover:text-text-heading"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className={cn("flex items-center gap-3 px-4 py-3 mb-2", !isSidebarOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(239,68,68,0.4)]">
              {user.name[0]}
            </div>
            {isSidebarOpen && (
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
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-body hover:bg-red-500/10 hover:text-red-400 transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
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
              <p className="text-sm font-medium text-text-heading">Welcome back, {user.name}</p>
              <p className="text-xs text-text-body/60">Ready to create something amazing?</p>
            </div>
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
              {currentView === 'create' && <CreateContent />}
              {currentView === 'manage' && <ManageContent />}
              {currentView === 'admin' && user.role === 'admin' && <AdminPanel />}
              {currentView === 'pricing' && <Pricing user={user} onRefresh={checkAuth} />}
              {currentView === 'analytics' && (
                <div className="glass-card p-12 rounded-3xl text-center">
                  <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4 opacity-40" />
                  <h2 className="text-2xl font-bold mb-2 text-text-heading">Analytics Dashboard</h2>
                  <p className="text-text-body">Detailed analytics for your social accounts will appear here.</p>
                </div>
              )}
              {currentView === 'settings' && (
                <div className="glass-card p-12 rounded-3xl text-center">
                  <Settings className="w-16 h-16 text-primary mx-auto mb-4 opacity-40" />
                  <h2 className="text-2xl font-bold mb-2 text-text-heading">Account Settings</h2>
                  <p className="text-text-body">Manage your profile and connected social accounts.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
    </PayPalScriptProvider>
  );
}
