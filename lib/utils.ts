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
  botType?: string; // Type of bot if detected
} {
  const ua = userAgent.toLowerCase();
  
  // Enhanced bot detection - check for various bot types
  let isBot = false;
  let botType: string | undefined = undefined;
  
  // Search engine crawlers
  const searchEngineBots = [
    { pattern: /googlebot|google-inspectiontool|mediapartners-google/i, name: "Google Bot" },
    { pattern: /bingbot|msnbot|adidxbot/i, name: "Bing Bot" },
    { pattern: /slurp|yahoo/i, name: "Yahoo Bot" },
    { pattern: /duckduckbot/i, name: "DuckDuckGo Bot" },
    { pattern: /baiduspider/i, name: "Baidu Bot" },
    { pattern: /yandexbot|yandex/i, name: "Yandex Bot" },
    { pattern: /sogou/i, name: "Sogou Bot" },
    { pattern: /exabot/i, name: "Exalead Bot" },
    { pattern: /facebot|facebookexternalhit/i, name: "Facebook Crawler" },
    { pattern: /ia_archiver|archive\.org_bot/i, name: "Archive.org Bot" },
  ];
  
  // Social media link preview services
  const linkPreviewServices = [
    { pattern: /facebookexternalhit|Facebot|facebook/i, name: "Facebook Link Preview" },
    { pattern: /twitterbot|twitter/i, name: "Twitter Link Preview" },
    { pattern: /linkedinbot|linkedin/i, name: "LinkedIn Link Preview" },
    { pattern: /slackbot|slack-linkpreview/i, name: "Slack Link Preview" },
    { pattern: /discordbot|discord/i, name: "Discord Link Preview" },
    { pattern: /whatsapp|whatsappbot/i, name: "WhatsApp Link Preview" },
    { pattern: /telegrambot|telegram/i, name: "Telegram Link Preview" },
    { pattern: /skypebot|skype/i, name: "Skype Link Preview" },
    { pattern: /redditbot|reddit/i, name: "Reddit Bot" },
    { pattern: /pinterest|pinterestbot/i, name: "Pinterest Bot" },
    { pattern: /applebot|apple/i, name: "Apple Bot" },
    { pattern: /embedly|embedly/i, name: "Embedly" },
    { pattern: /quora link preview/i, name: "Quora Link Preview" },
    { pattern: /slackbot-linkpreview/i, name: "Slack Link Preview" },
  ];
  
  // Email clients (often fetch links for preview)
  const emailClients = [
    { pattern: /microsoft office|outlook|ms-office/i, name: "Microsoft Outlook" },
    { pattern: /thunderbird/i, name: "Mozilla Thunderbird" },
    { pattern: /apple mail|mail\.app/i, name: "Apple Mail" },
    { pattern: /gmail|google.*mail/i, name: "Gmail" },
    { pattern: /yahoo.*mail|ymail/i, name: "Yahoo Mail" },
    { pattern: /aol.*mail/i, name: "AOL Mail" },
    { pattern: /protonmail/i, name: "ProtonMail" },
  ];
  
  // Monitoring and uptime services
  const monitoringServices = [
    { pattern: /pingdom|uptimerobot|monitor/i, name: "Uptime Monitor" },
    { pattern: /newrelic|datadog/i, name: "Monitoring Service" },
    { pattern: /site24x7|statuscake/i, name: "Status Monitor" },
    { pattern: /uptime|ping|healthcheck/i, name: "Health Check" },
  ];
  
  // Security scanners
  const securityScanners = [
    { pattern: /nmap|masscan|zmap/i, name: "Security Scanner" },
    { pattern: /nikto|sqlmap|w3af/i, name: "Security Scanner" },
    { pattern: /nessus|openvas/i, name: "Vulnerability Scanner" },
    { pattern: /acunetix|burpsuite/i, name: "Security Scanner" },
  ];
  
  // Generic bot patterns
  const genericBots = [
    { pattern: /bot|crawler|spider|crawling|scraper/i, name: "Generic Bot" },
    { pattern: /curl|wget|python-requests|go-http-client|java|okhttp/i, name: "HTTP Client" },
    { pattern: /postman|insomnia|httpie/i, name: "API Client" },
    { pattern: /headless|phantom|selenium|puppeteer|playwright/i, name: "Headless Browser" },
  ];
  
  // Check in order of specificity (most specific first)
  const allBotTypes = [
    ...searchEngineBots,
    ...linkPreviewServices,
    ...emailClients,
    ...monitoringServices,
    ...securityScanners,
    ...genericBots,
  ];
  
  for (const bot of allBotTypes) {
    if (bot.pattern.test(userAgent)) {
      isBot = true;
      botType = bot.name;
      break; // Use first match (most specific)
    }
  }
  
  // Additional checks for empty or suspicious user agents
  if (!userAgent || userAgent.trim().length === 0) {
    isBot = true;
    botType = "Empty User Agent";
  }
  
  // Check for very short user agents (often bots)
  if (userAgent.length < 10) {
    isBot = true;
    botType = botType || "Suspicious User Agent";
  }

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
      ipAddress.startsWith("172.16.") ||
      ipAddress.startsWith("172.17.") ||
      ipAddress.startsWith("172.18.") ||
      ipAddress.startsWith("172.19.") ||
      ipAddress.startsWith("172.20.") ||
      ipAddress.startsWith("172.21.") ||
      ipAddress.startsWith("172.22.") ||
      ipAddress.startsWith("172.23.") ||
      ipAddress.startsWith("172.24.") ||
      ipAddress.startsWith("172.25.") ||
      ipAddress.startsWith("172.26.") ||
      ipAddress.startsWith("172.27.") ||
      ipAddress.startsWith("172.28.") ||
      ipAddress.startsWith("172.29.") ||
      ipAddress.startsWith("172.30.") ||
      ipAddress.startsWith("172.31.") ||
      ipAddress === "::1" ||
      ipAddress.startsWith("fe80:")) {
    return {};
  }

  // Clean IP address (remove port if present)
  const cleanIP = ipAddress.split(':')[0].trim();

  // Try multiple services with timeout and retries
  const services = [
    // Service 1: ip-api.com (free, reliable, no API key needed) - PRIMARY
    async () => {
      try {
        // Always use HTTPS in browser to avoid mixed content issues
        const protocol = typeof window !== "undefined" ? "https" : (process.env.NODE_ENV === "production" ? "https" : "http");
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // Increased timeout
        
        const response = await fetch(`${protocol}://ip-api.com/json/${cleanIP}?fields=status,message,country,countryCode,regionName,city,timezone`, {
          headers: {
            'Accept': 'application/json',
            // Don't send User-Agent in browser to avoid CORS issues
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
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
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn("ip-api.com error:", error.message);
        }
      }
      return null;
    },
    
    // Service 2: ipapi.co (free tier, reliable)
    async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(`https://ipapi.co/${cleanIP}/json/`, {
          headers: {
            'Accept': 'application/json',
            // Don't send User-Agent in browser to avoid CORS issues
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.country_name && !data.error) {
            return {
              country: data.country_name || undefined,
              city: data.city || undefined,
              region: data.region || undefined,
              countryCode: data.country_code || undefined,
              timezone: data.timezone || undefined,
            };
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn("ipapi.co error:", error.message);
        }
      }
      return null;
    },
    
    // Service 3: ip-api.io (free, alternative)
    async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(`https://ip-api.io/json/${cleanIP}`, {
          headers: {
            'Accept': 'application/json',
            // Don't send User-Agent in browser to avoid CORS issues
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.country_name) {
            return {
              country: data.country_name || undefined,
              city: data.city || undefined,
              region: data.region_name || undefined,
              countryCode: data.country_code || undefined,
              timezone: data.time_zone?.name || undefined,
            };
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn("ip-api.io error:", error.message);
        }
      }
      return null;
    },
    
    // Service 4: geojs.io (free, simple)
    async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(`https://get.geojs.io/v1/ip/geo/${cleanIP}.json`, {
          headers: {
            'Accept': 'application/json',
            // Don't send User-Agent - geojs.io doesn't allow it in CORS
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.country) {
            return {
              country: data.country || undefined,
              city: data.city || undefined,
              region: data.region || undefined,
              countryCode: data.country_code || undefined,
              timezone: data.timezone || undefined,
            };
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn("geojs.io error:", error.message);
        }
      }
      return null;
    },
    
    // Service 5: ipwhois.app (free, reliable)
    async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(`https://ipwhois.app/json/${cleanIP}`, {
          headers: {
            'Accept': 'application/json',
            // Don't send User-Agent in browser to avoid CORS issues
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.country) {
            return {
              country: data.country || undefined,
              city: data.city || undefined,
              region: data.region || undefined,
              countryCode: data.country_code || undefined,
              timezone: data.timezone || undefined,
            };
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn("ipwhois.app error:", error.message);
        }
      }
      return null;
    },
    
    // Service 6: ip-api.com batch (alternative endpoint)
    async () => {
      try {
        const protocol = typeof window === "undefined" && process.env.NODE_ENV === "production" ? "https" : "http";
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        // Try without fields parameter as fallback
        // Always use HTTPS in browser
        const fallbackProtocol = typeof window !== "undefined" ? "https" : (process.env.NODE_ENV === "production" ? "https" : "http");
        const response = await fetch(`${fallbackProtocol}://ip-api.com/json/${cleanIP}`, {
          headers: {
            'Accept': 'application/json',
            // Don't send User-Agent in browser to avoid CORS issues
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
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
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.warn("ip-api.com (fallback) error:", error.message);
        }
      }
      return null;
    },
  ];

  // Try all services in parallel for faster results
  const servicePromises = services.map(async (service, index) => {
    try {
      const result = await service();
      if (result && (result.country || result.countryCode)) {
        return { success: true, result, serviceIndex: index };
      }
      return { success: false, result: null, serviceIndex: index };
    } catch (error: any) {
      console.warn(`Service ${index + 1} failed:`, error.message || error);
      return { success: false, result: null, serviceIndex: index, error: error.message };
    }
  });

  // Wait for all services, but return as soon as one succeeds
  const results = await Promise.allSettled(servicePromises);
  
  // Check results in order of preference
  for (const settledResult of results) {
    if (settledResult.status === 'fulfilled' && settledResult.value.success && settledResult.value.result) {
      const result = settledResult.value.result;
      console.log(`✅ Location found via service ${settledResult.value.serviceIndex + 1} for IP ${cleanIP}:`, result);
      return result;
    }
  }

  // If all failed, log detailed error info
  console.warn(`⚠️ Could not determine location for IP: ${cleanIP}`);
  console.warn('Service results:', results.map((r, i) => 
    r.status === 'fulfilled' 
      ? `Service ${i + 1}: ${r.value.success ? 'success' : 'failed'}`
      : `Service ${i + 1}: rejected`
  ));
  
  return {};
}

