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

export function parseUserAgent(userAgent: string): {
  platform: string;
  device: string;
  deviceType: string;
  browser: string;
  os: string;
  isBot: boolean;
} {
  const ua = userAgent.toLowerCase();
  
  // Detect bots
  const botPatterns = /bot|crawler|spider|crawling/i;
  const isBot = botPatterns.test(userAgent);

  // Detect device type
  let device = "desktop";
  let deviceType = "Unknown";
  
  if (/mobile|android|iphone|ipod|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) {
    device = "mobile";
    if (/iphone/i.test(ua)) deviceType = "iPhone";
    else if (/ipod/i.test(ua)) deviceType = "iPod";
    else if (/android/i.test(ua)) {
      if (/samsung/i.test(ua)) deviceType = "Samsung";
      else if (/google/i.test(ua)) deviceType = "Google Pixel";
      else if (/oneplus/i.test(ua)) deviceType = "OnePlus";
      else if (/xiaomi/i.test(ua)) deviceType = "Xiaomi";
      else deviceType = "Android Device";
    }
    else if (/blackberry/i.test(ua)) deviceType = "BlackBerry";
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    device = "tablet";
    if (/ipad/i.test(ua)) deviceType = "iPad";
    else if (/android/i.test(ua)) deviceType = "Android Tablet";
  }

  // Detect OS
  let os = "Unknown";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/windows phone/i.test(ua)) os = "Windows Phone";

  // Detect browser
  let browser = "Unknown";
  if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/opera|opr/i.test(ua)) browser = "Opera";
  else if (/msie|trident/i.test(ua)) browser = "IE";

  // Detect platform (for mobile)
  let platform = os;
  if (os === "iOS") platform = "iOS";
  else if (os === "Android") platform = "Android";
  else if (os === "Windows" || os === "macOS" || os === "Linux") platform = os;

  return {
    platform,
    device,
    deviceType,
    browser,
    os,
    isBot,
  };
}

export function detectSocialSource(referrer: string): string | undefined {
  if (!referrer) return undefined;
  
  const ref = referrer.toLowerCase();
  
  const socialSources: Record<string, string> = {
    "facebook.com": "Facebook",
    "fb.com": "Facebook",
    "m.facebook.com": "Facebook",
    "twitter.com": "Twitter",
    "x.com": "Twitter",
    "t.co": "Twitter",
    "instagram.com": "Instagram",
    "linkedin.com": "LinkedIn",
    "pinterest.com": "Pinterest",
    "reddit.com": "Reddit",
    "tiktok.com": "TikTok",
    "youtube.com": "YouTube",
    "youtu.be": "YouTube",
    "snapchat.com": "Snapchat",
    "whatsapp.com": "WhatsApp",
    "telegram.org": "Telegram",
    "discord.com": "Discord",
    "messenger.com": "Messenger",
  };

  for (const [domain, source] of Object.entries(socialSources)) {
    if (ref.includes(domain)) {
      return source;
    }
  }

  return undefined;
}

export async function getLocationFromIP(ipAddress: string): Promise<{
  country?: string;
  city?: string;
  region?: string;
}> {
  if (!ipAddress || ipAddress === "localhost" || ipAddress.startsWith("127.") || ipAddress.startsWith("192.168.")) {
    return {};
  }

  try {
    // Using ip-api.com (free, no API key required, 45 requests/minute)
    // Use HTTPS for production, HTTP for localhost
    const protocol = typeof window === "undefined" && process.env.NODE_ENV === "production" ? "https" : "http";
    const response = await fetch(`${protocol}://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city`);
    const data = await response.json();
    
    if (data.status === "success") {
      return {
        country: data.country || undefined,
        city: data.city || undefined,
        region: data.regionName || undefined,
      };
    }
  } catch (error) {
    console.error("Error fetching location:", error);
  }

  return {};
}

