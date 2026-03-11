import { useState } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Youtube, 
  Instagram, 
  Video,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  CheckCircle2,
  Share2
} from "lucide-react";
import { User } from "../types";
import { cn } from "../lib/utils";

interface SettingsProps {
  user: User | null;
}

export default function Settings({ user }: SettingsProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'accounts' | 'security' | 'notifications'>('profile');
  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([
    { id: 1, platform: 'YouTube', name: 'Creative Channel', followers: '12.4K', icon: Youtube, color: 'text-red-500' },
    { id: 2, platform: 'TikTok', name: '@creator_forge', followers: '45.2K', icon: Video, color: 'text-white' },
  ]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
        credentials: "include"
      });
      if (res.ok) {
        alert("Profile updated successfully!");
        window.location.reload(); // Refresh to update user in App state
      }
    } catch (error) {
      console.error("Failed to save profile", error);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: UserIcon },
    { id: 'accounts', label: 'Connected Accounts', icon: Youtube },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (!user) {
    return (
      <div className="glass-card p-24 rounded-[3rem] text-center max-w-2xl mx-auto mt-12 border border-primary/20 neon-glow">
        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 relative">
          <div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 animate-ping opacity-20"></div>
          <UserIcon className="w-12 h-12 text-primary neon-glow" />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-text-heading font-display tracking-tight">Personalize Your Forge</h2>
        <p className="text-text-body mb-10 text-lg leading-relaxed">Sign in to customize your profile, connect your social accounts, and manage your security preferences.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => (window as any).dispatchEvent(new CustomEvent('open-auth'))}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold neon-glow hover:bg-primary/90 transition-all active:scale-95"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-text-heading">Settings</h1>
        <p className="text-text-body">Manage your account and platform connections</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-200 text-left",
                activeSection === section.id 
                  ? "bg-primary text-white neon-glow" 
                  : "text-text-body hover:bg-white/5 hover:text-text-heading"
              )}
            >
              <section.icon className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-wider">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-8">
          {activeSection === 'profile' && (
            <div className="glass-card p-8 rounded-3xl space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center text-white text-4xl font-bold shadow-2xl">
                  {user.name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text-heading mb-2">Profile Picture</h3>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors">
                      Upload New
                    </button>
                    <button className="px-4 py-2 bg-white/5 text-text-body border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-heading/40 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body/40" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-text-heading"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-heading/40 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body/40" />
                    <input 
                      type="email" 
                      defaultValue={user.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl opacity-50 cursor-not-allowed text-text-heading"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm neon-glow hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'accounts' && (
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-text-heading">Connected Platforms</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors">
                    <Plus className="w-4 h-4" />
                    Connect New
                  </button>
                </div>

                <div className="space-y-4">
                  {connectedAccounts.map((acc) => (
                    <div key={acc.id} className="p-6 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group hover:border-primary/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center", acc.color)}>
                          <acc.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-text-heading">{acc.name}</p>
                          <p className="text-xs text-text-body/60">{acc.platform} • {acc.followers} followers</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg text-text-body/40 hover:text-text-heading transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded-lg text-text-body/40 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-8 rounded-3xl">
                <h3 className="text-xl font-bold text-text-heading mb-4">Available Integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { platform: 'Instagram', icon: Instagram, color: 'text-pink-500', desc: 'Auto-post reels and track engagement.' },
                    { platform: 'Twitter / X', icon: Share2, color: 'text-white', desc: 'Share content updates automatically.' },
                  ].map((plat, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                      <div className="flex items-center gap-3 mb-3">
                        <plat.icon className={cn("w-5 h-5", plat.color)} />
                        <span className="font-bold text-text-heading">{plat.platform}</span>
                      </div>
                      <p className="text-xs text-text-body/60 mb-4">{plat.desc}</p>
                      <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all">
                        Connect Account
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="glass-card p-8 rounded-3xl space-y-8">
              <h3 className="text-xl font-bold text-text-heading">Security Settings</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-text-heading/40 uppercase tracking-widest">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body/40" />
                    <input 
                      type="password" 
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-text-heading"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text-heading/40 uppercase tracking-widest">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body/40" />
                      <input 
                        type="password" 
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-text-heading"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-text-heading/40 uppercase tracking-widest">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body/40" />
                      <input 
                        type="password" 
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all text-text-heading"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-text-heading">Two-Factor Authentication</p>
                    <p className="text-xs text-text-body/60">Add an extra layer of security to your account.</p>
                  </div>
                </div>
                <button className="px-6 py-2 bg-primary text-white rounded-xl font-bold text-xs neon-glow">
                  Enable
                </button>
              </div>

              <div className="flex justify-end">
                <button className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm neon-glow hover:bg-primary/90 transition-all">
                  Update Password
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="glass-card p-8 rounded-3xl space-y-8">
              <h3 className="text-xl font-bold text-text-heading">Notification Preferences</h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Generation Complete', desc: 'Get notified when your AI assets are ready.', enabled: true },
                  { label: 'Weekly Analytics', desc: 'Receive a summary of your performance every Monday.', enabled: true },
                  { label: 'Platform Alerts', desc: 'Notifications about your connected social accounts.', enabled: false },
                  { label: 'Security Alerts', desc: 'Important updates about your account security.', enabled: true },
                ].map((notif, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-colors">
                    <div>
                      <p className="font-bold text-text-heading">{notif.label}</p>
                      <p className="text-xs text-text-body/60">{notif.desc}</p>
                    </div>
                    <button className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      notif.enabled ? "bg-primary" : "bg-white/10"
                    )}>
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        notif.enabled ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
