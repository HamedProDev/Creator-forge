import { useState, useEffect } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Youtube,
  Instagram,
  Video,
  Zap
} from "lucide-react";
import { User, ContentItem } from "../types";

interface DashboardProps {
  user: User | null;
  onNavigate: (view: any) => void;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchContent();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchContent = async () => {
    try {
      const res = await fetch("/api/content", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRecentContent(data.content.slice(0, 4));
      }
    } catch (error) {
      console.error("Failed to fetch content", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Assets', value: recentContent.length, icon: Sparkles, color: 'text-primary' },
    { label: 'Published', value: '0', icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Pending', value: recentContent.length, icon: Clock, color: 'text-accent' },
    { label: 'Growth', value: '+12%', icon: TrendingUp, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-text-heading">Dashboard</h1>
        <p className="text-text-body">Overview of your creative workspace</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-text-body text-sm font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold text-text-heading mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {(!user || user.subscription_status === 'free') && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Zap className="w-24 h-24 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-text-heading mb-2">
                {user ? "Upgrade to Pro" : "Unlock Full Power"}
              </h3>
              <p className="text-sm text-text-body/80 mb-6">
                {user 
                  ? "Unlock unlimited AI generation, 4K images, and AI voiceovers."
                  : "Sign in to save your content, track analytics, and use advanced AI models."
                }
              </p>
              <button 
                onClick={() => user ? onNavigate('pricing') : (window as any).dispatchEvent(new CustomEvent('open-auth'))}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm neon-glow hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {user ? "View Plans" : "Get Started Now"}
              </button>
            </div>
          )}
          
          <h2 className="text-xl font-bold text-text-heading">Quick Create</h2>
          <div className="grid gap-4">
            {[
              { label: 'YouTube Thumbnail', icon: Youtube, color: 'text-red-500' },
              { label: 'TikTok Script', icon: Video, color: 'text-white' },
              { label: 'Instagram Hashtags', icon: Instagram, color: 'text-pink-500' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => onNavigate('create')}
                className="flex items-center gap-4 p-5 glass-card rounded-2xl hover:border-primary/40 hover:neon-glow transition-all group text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${action.color} shrink-0`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text-heading">{action.label}</p>
                  <p className="text-xs text-text-body/60">Generate with AI</p>
                </div>
                <ArrowRight className="w-5 h-5 text-text-body/20 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Recent Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-heading">Recent Content</h2>
            <button 
              onClick={() => onNavigate('manage')}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-widest"
            >
              View all
            </button>
          </div>
          
          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mx-auto"></div>
              </div>
            ) : recentContent.length > 0 ? (
              <div className="divide-y divide-white/5">
                {recentContent.map((item) => (
                  <div key={item.id} className="p-5 flex items-center gap-4 hover:bg-white/5 transition-colors">
                    <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden shrink-0 border border-white/10">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/40">
                          {item.type === 'script' ? <Video /> : <Sparkles />}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-heading truncate">{item.title}</p>
                      <p className="text-xs text-text-body/60 flex items-center gap-2 mt-1">
                        <span className="capitalize font-bold text-primary/80">{item.platform}</span>
                        <span className="opacity-20">•</span>
                        <span className="capitalize">{item.type}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                        {item.status}
                      </span>
                      <p className="text-[10px] text-text-body/40 mt-2 font-medium">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary/20" />
                </div>
                <p className="text-text-body font-medium">No content generated yet.</p>
                <button 
                  onClick={() => onNavigate('create')}
                  className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-bold text-sm neon-glow hover:bg-primary/90 transition-all"
                >
                  Start Creating
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
