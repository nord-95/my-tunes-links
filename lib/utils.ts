import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    spotify: "🎵",
    "apple-music": "🍎",
    "youtube-music": "▶️",
    soundcloud: "☁️",
    deezer: "🎧",
    tidal: "🌊",
    "amazon-music": "📦",
    pandora: "📻",
  };
  return icons[platform] || "🔗";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

