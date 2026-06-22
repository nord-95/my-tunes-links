"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link, X, Loader2 } from "lucide-react";

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ImageInput({ value, onChange, placeholder = "https://example.com/image.jpg", disabled }: ImageInputProps) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      setMode("url");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex rounded-md border border-gray-200 overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "url" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Link className="h-3 w-3" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === "upload" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
      </div>

      {mode === "url" ? (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")} disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            uploading ? "border-gray-200 bg-gray-50 cursor-wait" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload className="h-6 w-6" />
              <span className="text-sm font-medium">Drop image here or click to browse</span>
              <span className="text-xs text-gray-400">JPEG, PNG, WebP, GIF, SVG — max 10MB</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Preview if URL is set */}
      {value && (
        <div className="flex items-center gap-2">
          <img
            src={value}
            alt="Preview"
            className="w-12 h-12 object-cover rounded border border-gray-200"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span className="text-xs text-gray-400 truncate max-w-xs">{value}</span>
        </div>
      )}
    </div>
  );
}
