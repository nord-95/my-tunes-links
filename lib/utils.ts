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
  botType?: string;
} {
  if (!userAgent || userAgent.trim().length === 0) {
    return { platform: "Unknown", device: "desktop", deviceType: "Unknown", browser: "Unknown", os: "Unknown", isBot: true, botType: "Empty User Agent" };
  }
  if (userAgent.trim().length < 20) {
    return { platform: "Unknown", device: "desktop", deviceType: "Unknown", browser: "Unknown", os: "Unknown", isBot: true, botType: "Suspicious User Agent" };
  }

  // Only patterns that are EXCLUSIVE to bots — never appear in real browser UAs.
  // Key rule: use exact bot token names, NOT brand names that also appear in in-app browsers.
  //   WRONG: /facebook/i  — also matches "FBAN/FBIOS" in Facebook in-app browser (real users)
  //   WRONG: /apple/i     — also matches "AppleWebKit" in every single Safari UA
  //   CORRECT: /facebookexternalhit|facebot/i  — only Facebook's link preview crawler
  //   CORRECT: /applebot/i — only Apple's search crawler
  const botPatterns: Array<{ pattern: RegExp; name: string }> = [
    // Search engine crawlers
    { pattern: /googlebot|google-inspectiontool|mediapartners-google/i, name: "Google Bot" },
    { pattern: /bingbot|msnbot|adidxbot/i, name: "Bing Bot" },
    { pattern: /slurp/i, name: "Yahoo Bot" },             // NOT /yahoo/i — Yahoo is a real site
    { pattern: /duckduckbot/i, name: "DuckDuckGo Bot" },
    { pattern: /baiduspider/i, name: "Baidu Bot" },
    { pattern: /yandexbot/i, name: "Yandex Bot" },        // NOT /yandex/i — Yandex Browser is real
    { pattern: /sogou/i, name: "Sogou Bot" },
    { pattern: /exabot/i, name: "Exalead Bot" },
    { pattern: /applebot/i, name: "Apple Bot" },          // NOT /apple/i — AppleWebKit is in ALL Safari UAs!
    { pattern: /ia_archiver|archive\.org_bot/i, name: "Archive.org Bot" },
    // SEO crawlers
    { pattern: /ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|screaming frog/i, name: "SEO Crawler" },
    // Social media preview crawlers — ONLY the exact bot-exclusive string, not the brand name
    { pattern: /facebookexternalhit|facebot/i, name: "Facebook Crawler" }, // NOT /facebook/i
    { pattern: /twitterbot/i, name: "Twitter Bot" },                        // NOT /twitter/i
    { pattern: /linkedinbot/i, name: "LinkedIn Bot" },                      // NOT /linkedin/i
    { pattern: /discordbot/i, name: "Discord Bot" },                        // NOT /discord/i
    { pattern: /slackbot|slack-linkpreview/i, name: "Slack Bot" },
    { pattern: /telegrambot/i, name: "Telegram Bot" },                      // NOT /telegram/i
    // WhatsApp link preview bot has UA like "WhatsApp/2.x A" — starts with WhatsApp/, no Mozilla
    // Real users in WhatsApp IAB have "Mozilla/5.0 ... WhatsApp/23.x" — starts with Mozilla
    { pattern: /^whatsapp\//i, name: "WhatsApp Crawler" },
    { pattern: /redditbot/i, name: "Reddit Bot" },                          // NOT /reddit/i
    { pattern: /pinterest\/0\./i, name: "Pinterest Bot" },                  // NOT /pinterest/i
    { pattern: /embedly/i, name: "Embedly" },
    { pattern: /quora link preview/i, name: "Quora Bot" },
    // Email preview fetchers (these fetch URLs automatically, not on human click)
    { pattern: /microsoft office|ms-office/i, name: "Microsoft Office" },
    { pattern: /thunderbird/i, name: "Thunderbird" },
    { pattern: /apple mail/i, name: "Apple Mail" },
    // Uptime / monitoring (specific service names, not generic words)
    { pattern: /pingdom|uptimerobot|site24x7|statuscake/i, name: "Uptime Monitor" },
    { pattern: /newrelic|datadog/i, name: "Monitoring" },
    // Security scanners
    { pattern: /nmap|nikto|sqlmap|nessus|openvas|acunetix/i, name: "Security Scanner" },
    // HTTP tools / programmatic clients
    { pattern: /^curl\//i, name: "cURL" },
    { pattern: /^wget\//i, name: "Wget" },
    { pattern: /python-requests|python-urllib/i, name: "Python HTTP" },
    { pattern: /^go-http-client/i, name: "Go HTTP" },
    { pattern: /okhttp/i, name: "OkHttp" },
    { pattern: /^java\//i, name: "Java HTTP" },
    { pattern: /postman/i, name: "Postman" },
    { pattern: /insomnia/i, name: "Insomnia" },
    // Headless / automation browsers
    { pattern: /headlesschrome/i, name: "Headless Chrome" },
    { pattern: /phantomjs/i, name: "PhantomJS" },
    { pattern: /selenium/i, name: "Selenium" },
    { pattern: /puppeteer/i, name: "Puppeteer" },
    { pattern: /playwright/i, name: "Playwright" },
    // Generic fallback — word-boundary safe: \bbot\b won't match "Googlebot" (no boundary before b)
    // but WILL match standalone "bot" tokens like "SomeBot/1.0" where "/" follows
    { pattern: /\bcrawler\b|\bspider\b|\bscraper\b/i, name: "Web Crawler" },
    { pattern: /\bbot\b/i, name: "Bot" },
  ];

  let isBot = false;
  let botType: string | undefined = undefined;

  for (const { pattern, name } of botPatterns) {
    if (pattern.test(userAgent)) {
      isBot = true;
      botType = name;
      break;
    }
  }

  const ua = userAgent.toLowerCase();

  // Device detection
  let device = "desktop";
  let deviceType = "Unknown";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|windows ce|palm|smartphone|iemobile/i.test(ua)) {
    device = "mobile";
    if (/iphone/i.test(ua)) deviceType = "iPhone";
    else if (/ipod/i.test(ua)) deviceType = "iPod";
    else if (/android/i.test(ua)) {
      if (/samsung/i.test(ua)) deviceType = "Samsung";
      else if (/pixel/i.test(ua)) deviceType = "Google Pixel";
      else if (/oneplus/i.test(ua)) deviceType = "OnePlus";
      else if (/xiaomi|redmi/i.test(ua)) deviceType = "Xiaomi";
      else deviceType = "Android";
    }
    else if (/blackberry/i.test(ua)) deviceType = "BlackBerry";
  } else if (/ipad|tablet|playbook|silk/i.test(ua)) {
    device = "tablet";
    if (/ipad/i.test(ua)) deviceType = "iPad";
    else deviceType = "Android Tablet";
  }

  // OS detection
  let os = "Unknown";
  if (/windows phone/i.test(ua)) os = "Windows Phone";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  // Browser detection — check in-app browsers FIRST before generic Chrome/Safari
  // In-app browsers show as Chrome/Safari but have additional identifiers
  let browser = "Unknown";
  if (/fban|fb_iab|fbios|fbav\//i.test(ua)) browser = "Facebook IAB";
  else if (/instagram/i.test(ua)) browser = "Instagram IAB";
  else if (/twitter for iphone|twitter for android|twitterandroid/i.test(ua)) browser = "Twitter IAB";
  else if (/ whatsapp\//i.test(ua)) browser = "WhatsApp IAB";  // space before = Mozilla UA, not bot UA
  else if (/\btelegram\//i.test(ua)) browser = "Telegram IAB";
  else if (/snapchat/i.test(ua)) browser = "Snapchat IAB";
  else if (/tiktok|musically/i.test(ua)) browser = "TikTok IAB";
  else if (/linkedinapp/i.test(ua)) browser = "LinkedIn IAB";
  else if (/discord\//i.test(ua)) browser = "Discord IAB";    // "Discord/" token, not "Discordbot"
  else if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/msie|trident/i.test(ua)) browser = "IE";

  // Platform
  let platform = os;
  if (os === "iOS") platform = "iOS";
  else if (os === "Android") platform = "Android";

  return { platform, device, deviceType, browser, os, isBot, botType };
}

export function detectSocialSource(referrer: string, urlParams?: URLSearchParams): string | undefined {
  // No referrer and no UTM = direct traffic
  if (!referrer && (!urlParams || !urlParams.get("utm_source"))) {
    return "Direct";
  }

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

