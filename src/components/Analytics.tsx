import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Share2, 
  Youtube, 
  Instagram, 
  Video,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

import { User } from '../types';

interface AnalyticsProps {
  user: User | null;
}

export default function Analytics({ user }: AnalyticsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/stats", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoading(false);
    }
  };

  const data = [
    { name: 'Mon', views: 4000, engagement: 2400, followers: 2400 },
    { name: 'Tue', views: 3000, engagement: 1398, followers: 2210 },
    { name: 'Wed', views: 2000, engagement: 9800, followers: 2290 },
    { name: 'Thu', views: 2780, engagement: 3908, followers: 2000 },
    { name: 'Fri', views: 1890, engagement: 4800, followers: 2181 },
    { name: 'Sat', views: 2390, engagement: 3800, followers: 2500 },
    { name: 'Sun', views: 3490, engagement: 4300, followers: 2100 },
  ];

  const platformData = stats?.platformStats?.map((p: any) => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    value: p.count,
    color: p.platform === 'youtube' ? '#EF4444' : p.platform === 'tiktok' ? '#FFFFFF' : '#EC4899'
  })) || [
    { name: 'YouTube', value: 0, color: '#EF4444' },
    { name: 'TikTok', value: 0, color: '#FFFFFF' },
    { name: 'Instagram', value: 0, color: '#EC4899' },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card p-24 rounded-[3rem] text-center max-w-2xl mx-auto mt-12 border border-primary/20 neon-glow">
        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 relative">
          <div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 animate-ping opacity-20"></div>
          <TrendingUp className="w-12 h-12 text-primary neon-glow" />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-text-heading font-display tracking-tight">Data-Driven Growth</h2>
        <p className="text-text-body mb-10 text-lg leading-relaxed">Sign in to track your content performance, analyze engagement trends, and optimize your strategy across all platforms.</p>
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
        <h1 className="text-4xl font-bold mb-2 text-text-heading">Analytics</h1>
        <p className="text-text-body">Track your content performance across all platforms</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Views', value: '124.5K', icon: Eye, change: '+12.5%', trend: 'up' },
          { label: 'Engagement', value: '8.2%', icon: Share2, change: '+2.1%', trend: 'up' },
          { label: 'New Followers', value: '1,240', icon: Users, change: '-0.4%', trend: 'down' },
          { label: 'Growth Rate', value: '24.8%', icon: TrendingUp, change: '+5.4%', trend: 'up' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl bg-white/5 text-primary">
                <stat.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
                stat.trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="text-text-body text-sm font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="text-3xl font-bold text-text-heading mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-text-heading">Performance Over Time</h3>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-text-body outline-none focus:border-primary">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#ffffff60' }}
                />
                <YAxis 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#ffffff60' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1A1A1A', 
                    border: '1px solid #ffffff10', 
                    borderRadius: '16px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#8B5CF6' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="lg:col-span-1 glass-card p-8 rounded-3xl">
          <h3 className="text-xl font-bold text-text-heading mb-8">Platform Reach</h3>
          <div className="h-[250px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff20" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#ffffff60' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ 
                    backgroundColor: '#1A1A1A', 
                    border: '1px solid #ffffff10', 
                    borderRadius: '16px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {platformData.map((platform, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }}></div>
                  <span className="text-sm font-medium text-text-body">{platform.name}</span>
                </div>
                <span className="text-sm font-bold text-text-heading">{platform.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Content Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-white/5">
          <h3 className="text-xl font-bold text-text-heading">Top Performing Content</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-8 py-4 text-xs font-bold text-text-body/40 uppercase tracking-widest">Content</th>
                <th className="px-8 py-4 text-xs font-bold text-text-body/40 uppercase tracking-widest">Platform</th>
                <th className="px-8 py-4 text-xs font-bold text-text-body/40 uppercase tracking-widest">Views</th>
                <th className="px-8 py-4 text-xs font-bold text-text-body/40 uppercase tracking-widest">Engagement</th>
                <th className="px-8 py-4 text-xs font-bold text-text-body/40 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { title: 'How to use AI for Content', platform: 'YouTube', views: '45.2K', engagement: '12.4%', status: 'Viral', icon: Youtube, color: 'text-red-500' },
                { title: 'Morning Routine 2024', platform: 'TikTok', views: '128K', engagement: '18.2%', status: 'Trending', icon: Video, color: 'text-white' },
                { title: 'New Setup Tour', platform: 'Instagram', views: '12.5K', engagement: '5.4%', status: 'Stable', icon: Instagram, color: 'text-pink-500' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-text-heading">{item.title}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`flex items-center gap-2 ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.platform}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-text-heading">{item.views}</td>
                  <td className="px-8 py-6 text-sm font-bold text-text-heading">{item.engagement}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/20">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
