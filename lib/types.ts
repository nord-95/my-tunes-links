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
  isBot?: boolean;
}

export interface AnalyticsData {
  totalClicks: number;
  clicksByDate: { date: string; clicks: number }[];
  clicksByPlatform: { platform: string; clicks: number }[];
  clicksByCountry: { country: string; clicks: number }[];
  topReferrers: { referrer: string; clicks: number }[];
}

