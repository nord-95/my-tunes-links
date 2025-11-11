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

export function detectSocialSource(referrer: string, urlParams?: URLSearchParams): string | undefined {
  // First check UTM source parameter (most accurate)
  if (urlParams) {
    const utmSource = urlParams.get("utm_source");
    if (utmSource) {
      // Normalize common UTM sources
      const normalized = utmSource.toLowerCase();
      const utmMap: Record<string, string> = {
        "facebook": "Facebook",
        "fb": "Facebook",
        "twitter": "Twitter",
        "x": "Twitter",
        "instagram": "Instagram",
        "ig": "Instagram",
        "linkedin": "LinkedIn",
        "pinterest": "Pinterest",
        "reddit": "Reddit",
        "tiktok": "TikTok",
        "youtube": "YouTube",
        "yt": "YouTube",
        "snapchat": "Snapchat",
        "whatsapp": "WhatsApp",
        "telegram": "Telegram",
        "discord": "Discord",
        "messenger": "Messenger",
        "spotify": "Spotify",
        "apple_music": "Apple Music",
        "soundcloud": "SoundCloud",
      };
      if (utmMap[normalized]) {
        return utmMap[normalized];
      }
      // Return capitalized version if not in map
      return utmSource.charAt(0).toUpperCase() + utmSource.slice(1).toLowerCase();
    }
  }

  if (!referrer) return undefined;
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    // More comprehensive social media detection
    const socialSources: Record<string, string> = {
      // Facebook
      "facebook.com": "Facebook",
      "fb.com": "Facebook",
      "m.facebook.com": "Facebook",
      "www.facebook.com": "Facebook",
      "l.facebook.com": "Facebook",
      // Twitter/X
      "twitter.com": "Twitter",
      "x.com": "Twitter",
      "www.twitter.com": "Twitter",
      "www.x.com": "Twitter",
      "t.co": "Twitter",
      // Instagram
      "instagram.com": "Instagram",
      "www.instagram.com": "Instagram",
      "m.instagram.com": "Instagram",
      "l.instagram.com": "Instagram",
      "instagram": "Instagram", // For subdomain matching
      // LinkedIn
      "linkedin.com": "LinkedIn",
      "www.linkedin.com": "LinkedIn",
      // Pinterest
      "pinterest.com": "Pinterest",
      "www.pinterest.com": "Pinterest",
      "pin.it": "Pinterest",
      // Reddit
      "reddit.com": "Reddit",
      "www.reddit.com": "Reddit",
      // TikTok
      "tiktok.com": "TikTok",
      "www.tiktok.com": "TikTok",
      "vm.tiktok.com": "TikTok",
      // YouTube
      "youtube.com": "YouTube",
      "www.youtube.com": "YouTube",
      "youtu.be": "YouTube",
      "m.youtube.com": "YouTube",
      // Snapchat
      "snapchat.com": "Snapchat",
      // WhatsApp
      "whatsapp.com": "WhatsApp",
      "wa.me": "WhatsApp",
      // Telegram
      "telegram.org": "Telegram",
      "t.me": "Telegram",
      // Discord
      "discord.com": "Discord",
      "discord.gg": "Discord",
      // Messenger
      "messenger.com": "Messenger",
      "m.me": "Messenger",
      // Music platforms (often shared on social)
      "open.spotify.com": "Spotify",
      "spotify.com": "Spotify",
      "music.apple.com": "Apple Music",
      "soundcloud.com": "SoundCloud",
    };

    // Check exact hostname match first
    if (socialSources[hostname]) {
      return socialSources[hostname];
    }

    // Check if hostname contains any social domain (prioritize more specific matches)
    // Sort by domain length (longer = more specific) to match Instagram before generic "instagram"
    const sortedDomains = Object.entries(socialSources).sort((a, b) => b[0].length - a[0].length);
    
    for (const [domain, source] of sortedDomains) {
      const domainToMatch = domain.replace("www.", "");
      // Match if hostname contains the domain (for subdomains like l.instagram.com)
      if (hostname.includes(domainToMatch)) {
        return source;
      }
    }
  } catch (error) {
    // If URL parsing fails, fall back to simple string matching
    const ref = referrer.toLowerCase();
    const simpleSources: Record<string, string> = {
      "facebook": "Facebook",
      "twitter": "Twitter",
      "x.com": "Twitter",
      "instagram": "Instagram",
      "linkedin": "LinkedIn",
      "pinterest": "Pinterest",
      "reddit": "Reddit",
      "tiktok": "TikTok",
      "youtube": "YouTube",
      "snapchat": "Snapchat",
      "whatsapp": "WhatsApp",
      "telegram": "Telegram",
      "discord": "Discord",
    };

    for (const [key, source] of Object.entries(simpleSources)) {
      if (ref.includes(key)) {
        return source;
      }
    }
  }

  return undefined;
}

export async function getLocationFromIP(ipAddress: string): Promise<{
  country?: string;
  city?: string;
  region?: string;
  countryCode?: string;
  timezone?: string;
}> {
  if (!ipAddress || 
      ipAddress === "localhost" || 
      ipAddress.startsWith("127.") || 
      ipAddress.startsWith("192.168.") ||
      ipAddress.startsWith("10.") ||
      ipAddress.startsWith("172.")) {
    return {};
  }

  // Try ip-api.com first (free, reliable)
  try {
    const protocol = typeof window === "undefined" && process.env.NODE_ENV === "production" ? "https" : "http";
    const response = await fetch(`${protocol}://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,regionName,city,timezone`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === "success") {
      return {
        country: data.country || undefined,
        city: data.city || undefined,
        region: data.regionName || undefined,
        countryCode: data.countryCode || undefined,
        timezone: data.timezone || undefined,
      };
    }
  } catch (error) {
    console.warn("ip-api.com failed, trying fallback:", error);
    
    // Fallback to ipapi.co (also free, different provider)
    try {
      const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.country_name) {
          return {
            country: data.country_name || undefined,
            city: data.city || undefined,
            region: data.region || undefined,
            countryCode: data.country_code || undefined,
            timezone: data.timezone || undefined,
          };
        }
      }
    } catch (fallbackError) {
      console.warn("Fallback location API also failed:", fallbackError);
    }
  }

  return {};
}

