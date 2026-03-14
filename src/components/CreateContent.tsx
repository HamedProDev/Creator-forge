import { useState, useEffect } from "react";
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
  Pause,
  Upload,
  CheckCircle2,
  Copy,
  Check
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
import { ContentType, Platform, User } from "../types";
import { cn } from "../lib/utils";
import FileUpload from "./FileUpload";

import { 
  collection, 
  addDoc, 
  doc, 
  runTransaction,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";

interface CreateContentProps {
  user: User | null;
  onAction: () => boolean;
}

export default function CreateContent({ user, onAction }: CreateContentProps) {
  const [activeTab, setActiveTab] = useState<ContentType | 'upload'>('thumbnail');
  const [platform, setPlatform] = useState<Platform>('youtube');
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [voice, setVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Kore');
  const [copied, setCopied] = useState<string | null>(null);
  const [scriptTemplate, setScriptTemplate] = useState<string>('none');

  const templates = [
    { id: 'none', label: 'Custom / Blank', prompt: '' },
    { id: 'explainer', label: 'Explainer Video', prompt: 'Structure: Hook, Problem, Solution, How it works, CTA. Tone: Educational and clear.' },
    { id: 'tutorial', label: 'Step-by-Step Tutorial', prompt: 'Structure: Intro, Prerequisites, Step 1, Step 2, Step 3, Troubleshooting, Conclusion. Tone: Helpful and detailed.' },
    { id: 'vlog', label: 'Vlog Intro', prompt: 'Structure: High-energy hook, Personal update, Tease what is coming, Intro music cue. Tone: Casual and engaging.' },
    { id: 'review', label: 'Product Review', prompt: 'Structure: Unboxing, First impressions, Key features, Pros & Cons, Final verdict. Tone: Honest and analytical.' },
  ];

  useEffect(() => {
    const handleSetTab = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail);
        setResult(null);
      }
    };
    window.addEventListener('set-create-tab', handleSetTab);
    return () => window.removeEventListener('set-create-tab', handleSetTab);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async () => {
    if (!topic) return;

    // Check action gating for guests
    if (!onAction()) return;

    // Define credit costs
    const costs: Record<string, number> = {
      'thumbnail': 2,
      'image': 2,
      'pro-image': 5,
      'audio': 3,
      'title': 1,
      'script': 1,
      'hashtags': 1
    };

    const cost = costs[activeTab] || 1;

    // Check if user has enough credits
    if (user && (user.credits || 0) < cost) {
      alert(`Insufficient credits. This action requires ${cost} credits.`);
      window.dispatchEvent(new CustomEvent('navigate-to-credits'));
      return;
    }

    // Check for API key if using Pro Image
    if (activeTab === 'pro-image' as any) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
        return;
      }
    }

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
        const template = templates.find(t => t.id === scriptTemplate);
        const fullPrompt = template?.id !== 'none' ? `${template?.prompt}\n\nTopic: ${topic}` : topic;
        data = await generateScript(fullPrompt, platform);
      } else if (activeTab === 'hashtags') {
        data = await generateHashtags(topic, platform);
      }

      if (data) {
        // Deduct credits using a transaction
        try {
          await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", user!.id.toString());
            const userSnap = await transaction.get(userRef);
            
            if (!userSnap.exists()) {
              throw new Error("User profile not found");
            }
            
            const currentCredits = userSnap.data().credits || 0;
            if (currentCredits < cost) {
              throw new Error("Insufficient credits");
            }
            
            transaction.update(userRef, {
              credits: currentCredits - cost
            });
          });
          
          setResult(data);
        } catch (err: any) {
          console.error("Credit deduction failed:", err);
          alert(err.message || "Failed to deduct credits");
          return;
        }
      }
    } catch (error: any) {
      console.error("Generation failed", error);
      if (error.message?.includes("Requested entity was not found")) {
        alert("API Key issue. Please re-select your API key.");
        await (window as any).aistudio.openSelectKey();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item?: any) => {
    if (!user) {
      onAction(); // This will trigger the auth modal
      return;
    }
    setSaveLoading(true);
    try {
      const contentData: any = {
        user_id: user.id.toString(),
        type: activeTab,
        platform,
        title: topic,
        status: 'draft',
        created_at: new Date().toISOString(),
        server_created_at: serverTimestamp()
      };

      if (activeTab === 'thumbnail' || activeTab === 'image' || activeTab === 'pro-image' as any) {
        contentData.image_url = result;
      } else if (activeTab === 'audio') {
        contentData.content_data = result; // Store base64 audio
      } else if (activeTab === 'title') {
        contentData.title = item.title;
        contentData.description = item.description;
      } else if (activeTab === 'script') {
        contentData.content_data = result;
      } else if (activeTab === 'hashtags') {
        contentData.content_data = result;
      }

      await addDoc(collection(db, "content"), contentData);
      alert("Saved to your library!");
    } catch (error) {
      console.error("Save failed", error);
      alert("Failed to save content");
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
    { id: 'upload', label: 'Upload Files', icon: Upload },
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
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as ContentType); setResult(null); }}
                    className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
                      activeTab === tab.id 
                        ? "bg-primary/10 border-primary text-primary neon-glow" 
                        : "border-white/5 hover:border-white/10 text-text-body hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-heading/40 mb-3 uppercase tracking-[0.2em]">Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as Platform)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                      platform === p.id 
                        ? "bg-secondary text-white border-white/20 neon-glow" 
                        : "border-white/5 hover:border-white/10 text-text-body hover:bg-white/5"
                    }`}
                  >
                    <p.icon className="w-4 h-4" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hidden sm:inline">{p.label}</span>
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

            {activeTab === 'script' && (
              <div>
                <label className="block text-xs font-bold text-text-heading/40 mb-3 uppercase tracking-[0.2em]">Script Template</label>
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setScriptTemplate(t.id)}
                      className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                        scriptTemplate === t.id 
                          ? "bg-primary/20 border-primary text-primary neon-glow" 
                          : "border-white/5 hover:border-white/10 text-text-body hover:bg-white/5"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider">{t.label}</p>
                      {t.id !== 'none' && <p className="text-[8px] opacity-60 mt-1 line-clamp-1">{t.prompt}</p>}
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
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 neon-glow"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Forging...
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5" />
                    Generate with AI
                  </div>
                  <span className="text-[10px] opacity-60 uppercase tracking-widest font-black">
                    Costs {
                      activeTab === 'thumbnail' ? 2 : 
                      activeTab === 'image' ? 2 : 
                      activeTab === 'pro-image' as any ? 5 : 
                      activeTab === 'audio' ? 3 : 1
                    } Credits
                  </span>
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
              {activeTab === 'upload' ? (
                <div className="h-full flex flex-col justify-center">
                  <FileUpload 
                    onUploadSuccess={(file) => {
                      setResult({ type: 'file', ...file });
                    }} 
                    onCreditsUpdate={(credits) => {
                      // Trigger a global user update if needed, but for now we'll just let the header handle it on next refresh or we can use a custom event
                      window.dispatchEvent(new CustomEvent('credits-updated', { detail: credits }));
                    }}
                  />
                  {result?.type === 'file' && (
                    <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold text-text-heading">{result.name}</p>
                          <p className="text-xs text-text-body/60">File uploaded successfully</p>
                        </div>
                      </div>
                      <a href={result.url} target="_blank" className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">View File</a>
                    </div>
                  )}
                </div>
              ) : (
                <>
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

                  {result && result.type !== 'file' && (
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
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-text-heading group-hover:text-primary transition-colors pr-20">{item.title}</h3>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleCopy(`${item.title}\n\n${item.description}`, `title-${i}`)}
                                    className="p-2 bg-white/5 rounded-xl border border-white/10 hover:text-primary transition-all"
                                    title="Copy to clipboard"
                                  >
                                    {copied === `title-${i}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                  </button>
                                  <button 
                                    onClick={() => handleSave(item)}
                                    className="p-2 bg-white/5 rounded-xl border border-white/10 hover:text-primary transition-all"
                                    title="Save to library"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-text-body/80 leading-relaxed">{item.description}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === 'script' && (
                        <div className="relative group">
                          <button 
                            onClick={() => handleCopy(result, 'script')}
                            className="absolute top-4 right-4 z-10 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                            title="Copy to clipboard"
                          >
                            {copied === 'script' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </button>
                          <div className="prose prose-invert prose-sm max-w-none bg-white/5 p-8 rounded-2xl border border-white/10">
                            <Markdown>{result}</Markdown>
                          </div>
                        </div>
                      )}

                      {activeTab === 'hashtags' && (
                        <div className="bg-white/5 p-8 rounded-2xl border border-white/10 relative group">
                          <button 
                            onClick={() => handleCopy(result, 'hashtags')}
                            className="absolute top-4 right-4 z-10 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100"
                            title="Copy to clipboard"
                          >
                            {copied === 'hashtags' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </button>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
