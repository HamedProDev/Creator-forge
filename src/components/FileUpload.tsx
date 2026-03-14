import { useState, useRef } from "react";
import { Upload, File, Image as ImageIcon, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface FileUploadProps {
  onUploadSuccess: (file: { id: number; url: string; name: string }) => void;
  onCreditsUpdate: (credits: number) => void;
}

export default function FileUpload({ onUploadSuccess, onCreditsUpdate }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        onUploadSuccess(data.file);
        onCreditsUpdate(data.remainingCredits);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        if (res.status === 402) {
          setError("Insufficient credits. Please buy more credits.");
        } else {
          setError(data.error || "Upload failed");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
          uploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
          accept="image/*,.txt,.pdf,.doc,.docx"
        />

        <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4 neon-glow">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          ) : (
            <Upload className="w-8 h-8 text-primary" />
          )}
        </div>

        <h3 className="text-lg font-bold text-text-heading mb-1">
          {uploading ? "Uploading..." : "Click or drag to upload"}
        </h3>
        <p className="text-sm text-text-body/60 text-center max-w-xs">
          Supports images (PNG, JPG) and text files (TXT, PDF). 
          <span className="block mt-1 text-primary/80 font-bold">Costs 1 credit per file</span>
        </p>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-secondary/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-10"
            >
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-2" />
              <p className="text-emerald-500 font-bold">Upload Successful!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
