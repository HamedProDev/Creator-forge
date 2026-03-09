import { useState, useEffect } from "react";
import { 
  Users, 
  FileText, 
  ShieldCheck, 
  Activity, 
  Search, 
  MoreHorizontal,
  ArrowUpRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { AdminStats } from "../types";

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch admin stats", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-24 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const metrics = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', trend: '+5%' },
    { label: 'Total Content', value: stats?.totalContent || 0, icon: FileText, color: 'text-primary', trend: '+12%' },
    { label: 'AI Usage', value: '84%', icon: Activity, color: 'text-accent', trend: '+2%' },
    { label: 'Premium Users', value: '12', icon: ShieldCheck, color: 'text-green-500', trend: '+1%' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-text-heading">Admin Dashboard</h1>
        <p className="text-text-body">System monitoring and user management</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${metric.color}`}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-green-400 text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                {metric.trend}
              </div>
            </div>
            <p className="text-text-body text-sm font-bold uppercase tracking-widest">{metric.label}</p>
            <p className="text-3xl font-bold text-text-heading mt-1">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-heading">Recent Users</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body/40" />
              <input 
                type="text" 
                placeholder="Search users..."
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/40 outline-none text-sm text-text-heading placeholder:text-text-body/20"
              />
            </div>
          </div>
          
          <div className="glass-card rounded-3xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-body/60">User</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-body/60">Email</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-body/60">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-body/60">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-body/60"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats?.recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                          {user.name?.[0]}
                        </div>
                        <span className="font-bold text-text-heading">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-body/80">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-text-body/80">
                      {new Date(user.created_at!).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-text-body/20 hover:text-text-heading transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Alerts */}
        <div className="lg:col-span-1 space-y-6">
          <h2 className="text-xl font-bold text-text-heading">System Health</h2>
          <div className="space-y-4">
            {[
              { title: 'API Status', status: 'Operational', color: 'bg-green-500' },
              { title: 'Database', status: 'Healthy', color: 'bg-green-500' },
              { title: 'AI Engine', status: 'High Load', color: 'bg-yellow-500' },
            ].map((item, i) => (
              <div key={i} className="p-5 glass-card rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.color} shadow-[0_0_8px_rgba(34,197,94,0.4)]`}></div>
                  <span className="font-bold text-text-heading text-sm">{item.title}</span>
                </div>
                <span className="text-[10px] font-bold text-text-body uppercase tracking-widest">{item.status}</span>
              </div>
            ))}
          </div>

          <div className="p-8 bg-secondary border border-white/10 rounded-[2.5rem] space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-[60px] rounded-full"></div>
            <div className="flex items-center gap-3 relative z-10">
              <AlertCircle className="w-6 h-6 text-accent" />
              <h3 className="font-bold text-text-heading">Maintenance Notice</h3>
            </div>
            <p className="text-sm text-text-body leading-relaxed relative z-10">
              Scheduled database optimization will occur on Sunday at 02:00 UTC. Expect minor latency.
            </p>
            <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 relative z-10 uppercase tracking-widest">
              View Schedule
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
