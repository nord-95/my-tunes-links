export type MusicPlatform = 
  | "spotify"
  | "apple-music"
  | "youtube-music"
  | "soundcloud"
  | "deezer"
  | "tidal"
  | "amazon-music"
  | "pandora";

export interface MusicLink {
  platform: MusicPlatform;
  url: string;
  title?: string;
}

export interface Link {
  id: string;
  userId: string;
  slug: string;
  title: string;
  description?: string;
  destinationUrl: string;
  musicLinks?: MusicLink[];
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  clicks: number;
  isActive: boolean;
  // Metadata fields
  tags?: string[]; // Tags for categorizing links
  category?: string; // Category (e.g., "Music", "Promotion", "Social")
  notes?: string; // Internal notes about the link
  // Internal UTM parameters (not added to URL, used for internal tracking)
  internalUtmSource?: string;
  internalUtmMedium?: string;
  internalUtmCampaign?: string;
  internalUtmContent?: string;
  internalUtmTerm?: string;
  // Open Graph / Social Media Metadata
  ogTitle?: string; // Open Graph title (defaults to title if not set)
  ogDescription?: string; // Open Graph description (defaults to description if not set)
  ogImage?: string; // Open Graph image URL
  ogType?: string; // Open Graph type (e.g., "website", "music.song", "music.album")
  ogSiteName?: string; // Site name for Open Graph
  twitterCard?: string; // Twitter card type (e.g., "summary", "summary_large_image")
  twitterTitle?: string; // Twitter title
  twitterDescription?: string; // Twitter description
  twitterImage?: string; // Twitter image URL
}

export interface Click {
  id: string;
  linkId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  country?: string;
  city?: string;
  region?: string;
  countryCode?: string;
  timezone?: string;
  platform?: string; // iOS, Android, Windows, macOS, Linux
  device?: string; // mobile, desktop, tablet
  deviceType?: string; // iPhone, iPad, Samsung, etc.
  browser?: string; // Chrome, Safari, Firefox, etc.
  os?: string; // Operating system
  socialSource?: string; // facebook, twitter, instagram, etc.
  utmSource?: string; // UTM source parameter
  utmMedium?: string; // UTM medium parameter
  utmCampaign?: string; // UTM campaign parameter
  utmContent?: string; // UTM content parameter
  utmTerm?: string; // UTM term parameter (keywords)
  fbclid?: string; // Facebook click ID
  isBot?: boolean;
  botType?: string; // Type of bot if detected (e.g., "Google Bot", "Facebook Link Preview", "Email Client")
}

export interface AnalyticsData {
  totalClicks: number;
  clicksByDate: { date: string; clicks: number }[];
  clicksByPlatform: { platform: string; clicks: number }[];
  clicksByCountry: { country: string; clicks: number }[];
  topReferrers: { referrer: string; clicks: number }[];
}

