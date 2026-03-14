import { useState, useEffect } from "react";
import { 
  FolderOpen, 
  Search, 
  Filter, 
  MoreVertical, 
  Download, 
  Trash2, 
  ExternalLink,
  Youtube,
  Video,
  Instagram,
  Sparkles,
  FileText,
  Hash,
  Image as ImageIcon,
  Mic2
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  orderBy,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import { User, ContentItem, ContentType, Platform } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ManageContentProps {
  user: User | null;
  onNavigate: (view: any) => void;
}

export default function ManageContent({ user, onNavigate }: ManageContentProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<ContentType | 'all'>('all');

  useEffect(() => {
    if (user) {
      fetchContent();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchContent = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "content"), 
        where("user_id", "==", user.id.toString()),
        orderBy("created_at", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any)
      })) as ContentItem[];
      setContent(data);
    } catch (error) {
      console.error("Failed to fetch content", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    try {
      await deleteDoc(doc(db, "content", id));
      setContent(content.filter(item => item.id.toString() !== id));
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: ContentType) => {
    switch (type) {
      case 'thumbnail': return ImageIcon;
      case 'image': return Sparkles;
      case 'audio': return Mic2;
      case 'title': return Sparkles;
      case 'script': return FileText;
      case 'hashtags': return Hash;
      default: return FolderOpen;
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'youtube': return Youtube;
      case 'tiktok': return Video;
      case 'instagram': return Instagram;
      default: return Sparkles;
    }
  };

  if (!user) {
    return (
      <div className="glass-card p-24 rounded-[3rem] text-center max-w-2xl mx-auto mt-12 border border-primary/20 neon-glow">
        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-primary/20 relative">
          <div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 animate-ping opacity-20"></div>
          <FolderOpen className="w-12 h-12 text-primary neon-glow" />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-text-heading font-display tracking-tight">Your Library Awaits</h2>
        <p className="text-text-body mb-10 text-lg leading-relaxed">Sign in to save your AI-generated assets, organize your content, and access them from anywhere.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => (window as any).dispatchEvent(new CustomEvent('open-auth'))}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold neon-glow hover:bg-primary/90 transition-all active:scale-95"
          >
            Sign In Now
          </button>
          <button 
            onClick={() => onNavigate('create')}
            className="px-8 py-4 bg-white/5 text-text-heading border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all active:scale-95"
          >
            Try Creator Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-text-heading">Content Library</h1>
          <p className="text-text-body">Manage and organize your AI-generated assets</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body/40" />
            <input 
              type="text" 
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/40 outline-none text-sm text-text-heading placeholder:text-text-body/20"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-body/40" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary/40 outline-none text-sm appearance-none text-text-heading"
            >
              <option value="all" className="bg-bg-dark">All Types</option>
              <option value="thumbnail" className="bg-bg-dark">Thumbnails</option>
              <option value="image" className="bg-bg-dark">AI Images</option>
              <option value="audio" className="bg-bg-dark">AI Voices</option>
              <option value="title" className="bg-bg-dark">Titles</option>
              <option value="script" className="bg-bg-dark">Scripts</option>
              <option value="hashtags" className="bg-bg-dark">Hashtags</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-24 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto"></div>
        </div>
      ) : filteredContent.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContent.map((item) => {
            const Icon = getIcon(item.type);
            const PlatformIcon = getPlatformIcon(item.platform);
            
            return (
              <div key={item.id} className="glass-card rounded-[2rem] overflow-hidden group hover:border-primary/40 hover:neon-glow transition-all duration-300">
                <div className="aspect-video bg-black/40 relative overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : item.type === 'audio' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 p-4">
                      <Mic2 className="w-12 h-12 text-primary mb-2 opacity-40" />
                      <audio src={item.content_data} controls className="w-full scale-75 opacity-60 hover:opacity-100 transition-opacity" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/10">
                      <Icon className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="p-2 bg-secondary/80 backdrop-blur rounded-xl border border-white/10 shadow-lg">
                      <PlatformIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="p-2 bg-secondary/80 backdrop-blur rounded-xl border border-white/10 shadow-lg">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button className="p-3 bg-white/10 hover:bg-primary rounded-full text-white transition-all hover:scale-110">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id.toString())}
                      className="p-3 bg-white/10 hover:bg-red-500 rounded-full text-white transition-all hover:scale-110"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-text-heading leading-tight line-clamp-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <button className="p-1 text-text-body/20 hover:text-text-heading transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-text-body/60 mb-5 line-clamp-2 leading-relaxed">
                    {item.description || "No description provided."}
                  </p>
                  <div className="flex items-center justify-between pt-5 border-t border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-body/40">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card p-24 rounded-[3rem] text-center">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-10 h-10 text-primary/20" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-text-heading">No content found</h2>
          <p className="text-text-body">Try adjusting your search or filters, or create some new magic.</p>
        </div>
      )}
    </div>
  );
}
