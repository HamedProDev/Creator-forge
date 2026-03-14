import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
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
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, ContentItem, Role } from "./types";
import { cn } from "./lib/utils";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import CreateContent from "./components/CreateContent";
import ManageContent from "./components/ManageContent";
import AdminPanel from "./components/AdminPanel";
import Pricing from "./components/Pricing";
import Analytics from "./components/Analytics";
import Settings from "./components/Settings";
import CreditsManager from "./components/CreditsManager";

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="w-10 h-10 text-red-500 neon-glow" />
          </div>
          <h1 className="text-2xl font-bold text-text-heading mb-4">Something went wrong</h1>
          <div className="max-w-md bg-white/5 border border-white/10 p-4 rounded-2xl mb-6">
            <p className="text-sm text-text-body/60 font-mono break-all">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold neon-glow hover:bg-primary/90 transition-all"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

type View = 'dashboard' | 'create' | 'manage' | 'analytics' | 'admin' | 'settings' | 'pricing' | 'credits';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [cookiesBlocked, setCookiesBlocked] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [guestActionCount, setGuestActionCount] = useState(0);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const checkAuth = async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUser({ id: firebaseUser.uid as any, ...userDoc.data() } as User);
      }
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user profile from Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUser({ id: firebaseUser.uid as any, ...userDoc.data() } as User);
        } else {
          // Create initial profile if it doesn't exist
          const newUser: Partial<User> = {
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "New Creator",
            role: "user",
            credits: 10,
            subscription_status: "free",
            created_at: new Date().toISOString()
          };
          await setDoc(userDocRef, newUser);
          setUser({ id: firebaseUser.uid as any, ...newUser } as User);
        }

        setShowAuthModal(false);
      } else {
        setUser(null);
      }
      setLoading(false);
      setIsAuthReady(true);
    });

    // Handle payment redirects
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setNotification({ type: 'success', message: 'Payment successful! Your account has been updated.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('payment') === 'cancel') {
      setNotification({ type: 'error', message: 'Payment cancelled.' });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    const handleCreditsUpdate = (e: any) => {
      setUser(prev => prev ? { ...prev, credits: e.detail } : null);
    };
    const handleNavigateToCredits = () => {
      setCurrentView('credits');
    };
    const handleNavigateToCreate = (e: any) => {
      setCurrentView('create');
      if (e.detail?.tab) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('set-create-tab', { detail: e.detail.tab }));
        }, 100);
      }
    };
    window.addEventListener('credits-updated', handleCreditsUpdate);
    window.addEventListener('navigate-to-credits', handleNavigateToCredits);
    window.addEventListener('navigate-to-create', handleNavigateToCreate);
    return () => {
      unsubscribeAuth();
      window.removeEventListener('credits-updated', handleCreditsUpdate);
      window.removeEventListener('navigate-to-credits', handleNavigateToCredits);
      window.removeEventListener('navigate-to-create', handleNavigateToCreate);
    };
  }, []);

  // Real-time credits listener
  useEffect(() => {
    if (isAuthReady && user) {
      const unsubscribe = onSnapshot(doc(db, "users", user.id.toString()), (doc) => {
        if (doc.exists()) {
          setUser(prev => prev ? { ...prev, ...doc.data() } : null);
        }
      });
      return () => unsubscribe();
    }
  }, [isAuthReady, user?.id]);

  const handleAction = () => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleLogout = async () => {
    await signOut(auth);
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Content', icon: PlusCircle },
    { id: 'manage', label: 'Manage Content', icon: FolderOpen },
    { id: 'credits', label: 'Credits & Referrals', icon: Sparkles },
    { id: 'pricing', label: 'Pricing & Plans', icon: ShieldCheck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  return (
    <ErrorBoundary>
      <PayPalScriptProvider options={{ 
        clientId: (import.meta as any).env.VITE_PAYPAL_CLIENT_ID || "test",
        currency: "USD",
        intent: "capture"
      }}>
        <div className="min-h-screen bg-bg-dark flex text-text-body relative overflow-hidden">
          {/* Auth Modal */}
          <AnimatePresence>
            {showAuthModal && (
              <Auth onClose={() => setShowAuthModal(false)} />
            )}
          </AnimatePresence>

          {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={cn(
              "fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border",
              notification.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              notification.type === 'success' ? "bg-emerald-500" : "bg-red-500"
            )} />
            <p className="text-sm font-bold">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
          "bg-secondary border-r border-white/5 transition-all duration-300 flex flex-col z-50 fixed lg:static inset-y-0 left-0",
          isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-20 lg:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/5 overflow-hidden">
          <div className="bg-primary p-2 rounded-lg neon-glow shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className={cn(
            "font-display font-bold text-xl tracking-tight text-text-heading transition-opacity duration-300",
            !isSidebarOpen && "lg:opacity-0 lg:w-0"
          )}>
            CreatorForge
          </span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as View);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                currentView === item.id 
                  ? "bg-primary text-white neon-glow" 
                  : "text-text-body hover:bg-white/5 hover:text-text-heading"
              )}
              title={!isSidebarOpen ? item.label : ""}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={cn(
                "font-medium transition-opacity duration-300",
                !isSidebarOpen && "lg:opacity-0 lg:w-0"
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 overflow-hidden">
          {user ? (
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(239,68,68,0.4)] shrink-0">
                {user.name[0]}
              </div>
              <div className={cn(
                "flex-1 min-w-0 transition-opacity duration-300",
                !isSidebarOpen && "lg:opacity-0 lg:w-0"
              )}>
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
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white neon-glow mb-2"
            >
              <UserIcon className="w-5 h-5 shrink-0" />
              <span className={cn(
                "font-bold transition-opacity duration-300",
                !isSidebarOpen && "lg:opacity-0 lg:w-0"
              )}>
                Login / Register
              </span>
            </button>
          )}
          
          {user && (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-body hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className={cn(
                "font-medium transition-opacity duration-300",
                !isSidebarOpen && "lg:opacity-0 lg:w-0"
              )}>
                Logout
              </span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-secondary/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-body"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-3 sm:gap-4">
            {user ? (
              <div 
                onClick={() => setCurrentView('credits')}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-2 sm:px-3 py-1.5 rounded-full cursor-pointer hover:bg-primary/20 transition-all"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest">{user.credits || 0} Credits</span>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold neon-glow"
              >
                Get Started
              </button>
            )}
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-text-heading">
                {user ? `Welcome back, ${user.name}` : "Welcome, Guest"}
              </p>
              <p className="text-xs text-text-body/60">
                {user ? "Ready to create something amazing?" : "Login to save your work"}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent">
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
              {currentView === 'credits' && <CreditsManager user={user} onCreditsUpdate={(credits) => setUser(prev => prev ? { ...prev, credits } : null)} />}
              {currentView === 'admin' && user?.role === 'admin' && <AdminPanel />}
              {currentView === 'pricing' && <Pricing user={user} onRefresh={checkAuth} />}
              {currentView === 'analytics' && <Analytics user={user} />}
              {currentView === 'settings' && <Settings user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
    </PayPalScriptProvider>
    </ErrorBoundary>
  );
}
