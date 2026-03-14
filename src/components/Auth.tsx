import { useState } from "react";
import { Sparkles, Mail, Lock, User as UserIcon, ArrowRight, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { auth } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from "firebase/auth";

interface AuthProps {
  onClose?: () => void;
}

export default function Auth({ onClose }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative"
      >
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary border border-white/10 rounded-2xl mb-4 neon-glow">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-1 text-text-heading font-display">CreatorForge</h1>
          <p className="text-text-body/60 text-sm font-medium">Empowering creators with AI magic</p>
        </div>

        <div className="glass-card p-8 rounded-[2rem] shadow-2xl relative z-20">
          <h2 className="text-xl font-bold mb-6 text-text-heading">{isLogin ? "Welcome Back" : "Create Account"}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5 relative z-30">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-text-heading/60 mb-2 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-body/40" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-text-heading placeholder:text-text-body/20"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-text-heading/60 mb-2 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-body/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-text-heading placeholder:text-text-body/20"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-heading/60 mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-body/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-text-heading placeholder:text-text-body/20"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className={cn(
                "p-4 rounded-2xl text-sm font-medium flex items-center gap-3",
                isLogin && error.includes("created") ? "bg-primary/10 text-primary border border-primary/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", isLogin && error.includes("created") ? "bg-primary" : "bg-red-400")}></div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 neon-glow mt-4 cursor-pointer relative"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1a1a1a] px-4 text-text-body/40 font-bold tracking-widest">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white/5 border border-white/10 text-text-heading py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center relative z-20">
            <button 
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(""); }}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest cursor-pointer"
            >
              {isLogin ? "New here? Create Account" : "Already a member? Sign in"}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-text-body/40 uppercase tracking-[0.2em]">
            Secure Authentication powered by Firebase
          </p>
        </div>
      </motion.div>
    </div>
  );
}
