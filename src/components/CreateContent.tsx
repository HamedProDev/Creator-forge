import { useState } from "react";
import { 
  Sparkles, 
  Youtube, 
  Video, 
  Instagram, 
  Image as ImageIcon, 
  Type as TypeIcon, 
  Hash, 
  FileText,
  Download,
  Save,
  Loader2,
  Mic2,
  Layers,
  Play,
  Pause
} from "lucide-react";
import Markdown from "react-markdown";
import { 
  generateTitlesAndDescriptions, 
  generateScript, 
  generateHashtags, 
  generateThumbnail, 
  generateImage,
  generateProImage,
  generateSpeech
} from "../services/geminiService";
import { ContentType, Platform } from "../types";
import { cn } from "../lib/utils";

export default function CreateContent() {
  const [activeTab, setActiveTab] = useState<ContentType>('thumbnail');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [voice, setVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Kore');

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setResult(null);
    try {
      let data;
      const aspectRatio = platform === 'youtube' ? '16:9' : platform === 'tiktok' ? '9:16' : '1:1';
      
      if (activeTab === 'thumbnail') {
        data = await generateThumbnail(topic);
      } else if (activeTab === 'image') {
        data = await generateImage(topic, aspectRatio);
      } else if (activeTab === 'pro-image' as any) {
        data = await generateProImage(topic, imageSize, aspectRatio);
      } else if (activeTab === 'audio') {
        data = await generateSpeech(topic, voice);
      } else if (activeTab === 'title') {
        data = await generateTitlesAndDescriptions(topic, platform);
      } else if (activeTab === 'script') {
        data = await generateScript(topic, platform);
      } else if (activeTab === 'hashtags') {
        data = await generateHashtags(topic);
      }
      setResult(data);
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item?: any) => {
    setSaveLoading(true);
    try {
      const body: any = {
        type: activeTab,
        platform,
        title: topic,
      };

      if (activeTab === 'thumbnail' || activeTab === 'image' || activeTab === 'pro-image' as any) {
        body.image_url = result;
      } else if (activeTab === 'audio') {
        body.content_data = result; // Store base64 audio
      } else if (activeTab === 'title') {
        body.title = item.title;
        body.description = item.description;
      } else if (activeTab === 'script') {
        body.content_data = result;
      } else if (activeTab === 'hashtags') {
        body.content_data = result;
      }

      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Saved to your library!");
      }
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const tabs = [
    { id: 'thumbnail', label: 'Thumbnail', icon: ImageIcon },
    { id: 'pro-image', label: 'Pro Image', icon: Layers },
    { id: 'image', label: 'AI Image', icon: Sparkles },
    { id: 'audio', label: 'AI Voice', icon: Mic2 },
    { id: 'title', label: 'Titles & SEO', icon: TypeIcon },
    { id: 'script', label: 'Video Script', icon: FileText },
    { id: 'hashtags', label: 'Hashtags', icon: Hash },
  ];

  const platforms = [
    { id: 'youtube', label: 'YouTube', icon: Youtube },
    { id: 'tiktok', label: 'TikTok', icon: Video },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2 text-text-heading">Create Content</h1>
        <p className="text-text-body">Use AI to supercharge your content creation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-6">
            <div>
              <label className="block text-xs font-bold text-text-heading/40 mb-3 uppercase tracking-[0.2em]">Select Tool</label>
              <div className="grid grid-cols-2 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as ContentType); setResult(null); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                      activeTab === tab.id 
                        ? "bg-primary/10 border-primary text-primary neon-glow" 
                        : "border-white/5 hover:border-white/10 text-text-body hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-heading/40 mb-3 uppercase tracking-[0.2em]">Platform</label>
              <div className="flex gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as Platform)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                      platform === p.id 
                        ? "bg-secondary text-white border-white/20 neon-glow" 
                        : "border-white/5 hover:border-white/10 text-text-body hover:bg-white/5"
                    }`}
                  >
                    <p.icon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'pro-image' as any && (
              <div>
                <label className="block text-xs font-bold text-text-heading/40 mb-3 uppercase tracking-[0.2em]">Image Resolution</label>
                <div className="flex gap-2">
                  {(['1K', '2K', '4K'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setImageSize(size)}
                      className={`flex-1 p-3 rounded-xl border transition-all duration-200 text-[10px] font-bold uppercase tracking-wider ${
                        imageSize === size 
                          ? "bg-primary/20 border-primary text-primary neon-glow" 
                          : "border-white/5 hover:border-white/10 text-text-body hover:bg-white/5"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div>
                <label className="block text-xs font-bold text-text-heading/40 mb-3 uppercase tracking-[0.2em]">Select Voice</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVoice(v)}
                      className={`p-2 rounded-xl border transition-all duration-200 text-[10px] font-bold uppercase tracking-wider ${
                        voice === v 
                          ? "bg-primary/20 border-primary text-primary neon-glow" 
                          : "border-white/5 hover:border-white/10 text-text-body hover:bg-white/5"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text-heading/40 mb-3 uppercase tracking-[0.2em]">Topic / Prompt</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={
                  activeTab === 'thumbnail' ? "Describe your thumbnail idea..." : 
                  activeTab === 'audio' ? "Enter the text you want to convert to speech..." :
                  "What is your video about?"
                }
                className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all resize-none text-sm text-text-heading placeholder:text-text-body/20"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 neon-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Forging...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2">
          <div className="glass-card rounded-3xl min-h-[500px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h2 className="font-bold flex items-center gap-2 text-text-heading">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Forge Preview
              </h2>
              {result && activeTab !== 'title' && (
                <button 
                  onClick={() => handleSave()}
                  disabled={saveLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save to Library
                </button>
              )}
            </div>

            <div className="flex-1 p-8 relative">
              {!result && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                    <Sparkles className="w-12 h-12" />
                  </div>
                  <p className="font-bold text-xl text-text-heading">Ready to Forge</p>
                  <p className="text-sm max-w-xs mt-2">Enter a topic and click generate to see AI-powered suggestions here.</p>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-[2rem] border-4 border-primary/10 border-t-primary animate-spin"></div>
                    <Sparkles className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 neon-glow" />
                  </div>
                  <p className="font-bold text-2xl text-text-heading animate-pulse tracking-tight">Forging Magic...</p>
                  <p className="text-sm text-text-body mt-2">Our AI is crafting the perfect assets for you.</p>
                </div>
              )}

              {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {(activeTab === 'thumbnail' || activeTab === 'image' || activeTab === 'pro-image' as any) && (
                    <div className="space-y-6">
                      <div className={cn(
                        "rounded-2xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl mx-auto",
                        platform === 'youtube' ? "aspect-video" : platform === 'tiktok' ? "aspect-[9/16] max-h-[600px]" : "aspect-square max-h-[500px]"
                      )}>
                        <img src={result} alt="Generated Asset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex justify-end gap-3">
                        <a 
                          href={result} 
                          download={`${activeTab}.png`}
                          className="flex items-center gap-2 px-6 py-3 bg-secondary text-white border border-white/10 rounded-2xl text-sm font-bold hover:bg-secondary/80 transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Download Image
                        </a>
                      </div>
                    </div>
                  )}

                  {activeTab === 'audio' && (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20"></div>
                        <Mic2 className="w-12 h-12 text-primary neon-glow" />
                      </div>
                      <h3 className="text-xl font-bold text-text-heading mb-6">AI Voice Generated</h3>
                      <audio controls src={result} className="w-full max-w-md accent-primary" />
                      <div className="mt-8 flex gap-3">
                        <a 
                          href={result} 
                          download="voiceover.wav"
                          className="flex items-center gap-2 px-6 py-3 bg-secondary text-white border border-white/10 rounded-2xl text-sm font-bold hover:bg-secondary/80 transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Download Audio
                        </a>
                      </div>
                    </div>
                  )}

                  {activeTab === 'title' && (
                    <div className="space-y-4">
                      {result.map((item: any, i: number) => (
                        <div key={i} className="p-6 bg-white/5 rounded-2xl border border-white/10 group relative hover:border-primary/40 transition-all">
                          <h3 className="font-bold text-lg mb-2 text-text-heading group-hover:text-primary transition-colors">{item.title}</h3>
                          <p className="text-sm text-text-body/80 leading-relaxed">{item.description}</p>
                          <button 
                            onClick={() => handleSave(item)}
                            className="absolute top-4 right-4 p-2 bg-secondary/80 backdrop-blur rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:text-primary"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'script' && (
                    <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-8 rounded-2xl border border-white/10">
                      <Markdown>{result}</Markdown>
                    </div>
                  )}

                  {activeTab === 'hashtags' && (
                    <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
                      <div className="flex flex-wrap gap-3">
                        {result.split(',').map((tag: string, i: number) => (
                          <span key={i} className="px-4 py-2 bg-secondary border border-white/10 rounded-xl text-sm font-bold text-primary neon-glow">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
