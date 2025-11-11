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
  platform?: string;
  device?: string;
}

export interface AnalyticsData {
  totalClicks: number;
  clicksByDate: { date: string; clicks: number }[];
  clicksByPlatform: { platform: string; clicks: number }[];
  clicksByCountry: { country: string; clicks: number }[];
  topReferrers: { referrer: string; clicks: number }[];
}

