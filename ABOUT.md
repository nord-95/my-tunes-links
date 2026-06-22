# My Tunes

My Tunes is a link management and music release platform built for musicians, artists, and labels. It replaces tools like Bitly and Linkfire with a self-hosted alternative that keeps all analytics data in your own database.

---

## What it does

### Link shortening

Create branded short links at `mytune.es/{slug}` that redirect users to any destination URL. Each link tracks every click with full analytics — no data shared with third parties.

### Music release pages

Create landing pages for singles, EPs, and albums. Each release page displays the artwork, artist info, and buttons linking to Spotify, Apple Music, YouTube Music, Tidal, Deezer, SoundCloud, Amazon Music, and Pandora. Both the page view and each button click are tracked separately.

### Artist bio pages

Create public artist profile pages with a bio, social media links, and a newsletter subscription form. Fans can subscribe directly on the page, and emails are stored in Firestore.

---

## Analytics

Every interaction — link click, release page view, or platform button click — records:

- **Device**: iPhone, iPad, Samsung, desktop, etc.
- **Browser**: Chrome, Safari, Firefox, Edge, and in-app browsers (Facebook IAB, Instagram IAB, WhatsApp IAB, TikTok IAB, etc.)
- **Operating system**: iOS, Android, Windows, macOS, Linux
- **Geolocation**: Country, city, region, timezone — resolved locally via MaxMind GeoLite2 (no external API calls, no latency added)
- **Social source**: Facebook, Instagram, Twitter, TikTok, YouTube, WhatsApp, Telegram, Discord, Direct, or UTM-attributed source
- **UTM parameters**: utm_source, utm_medium, utm_campaign, utm_content, utm_term
- **fbclid**: Facebook click ID for cross-device attribution
- **Bot detection**: Search engine crawlers, social media preview bots, headless browsers, and HTTP tools are identified and separated from real human traffic

Analytics are tracked using Next.js `after()` — tracking runs after the HTTP response is sent, so it never delays the redirect or page load for the visitor.

### Unique visitors

Analytics pages show unique visitor counts based on distinct IP addresses, separate from total clicks. Bot traffic is excluded from both counts.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.5 |
| UI | React 19, Tailwind CSS, shadcn/ui, Lucide |
| Forms | React Hook Form + Zod |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Image storage | Cloudflare R2 (S3-compatible) |
| Geolocation | MaxMind GeoLite2 City (local .mmdb) |
| Charts | Recharts |
| Hosting | Vercel |

---

## URL structure

| URL | What it serves |
|---|---|
| `/{slug}` | Link redirect or release page (auto-detected) |
| `/r/{slug}` | Release page (legacy route, still works) |
| `/artist-bio/{slug}` | Public artist bio page |
| `/dashboard` | Admin — link and release management |
| `/analytics/{id}` | Admin — link analytics |
| `/releases/analytics/{id}` | Admin — release analytics |
| `/link/{id}` | Admin — link detail |
| `/release/{id}` | Admin — release detail |
| `/artist/{id}` | Admin — artist detail |

---

## Data stored per click

```
linkId / releaseId
timestamp
isBot
botType
ipAddress
userAgent
referrer
platform_type (iOS / Android / Windows / macOS)
device (mobile / desktop / tablet)
deviceType (iPhone / Samsung / iPad / ...)
browser (Chrome / Safari / Facebook IAB / ...)
os (iOS / Android / Windows / ...)
socialSource (Facebook / Instagram / Direct / ...)
country / city / region / countryCode / timezone
utmSource / utmMedium / utmCampaign / utmContent / utmTerm
fbclid
```

---

## Image uploads

Images can be added either by pasting a URL or uploading a file directly. Uploaded files go to Cloudflare R2 (`music/mytunes/`) and are served via a CDN subdomain (`cdn.mytunes.es`). Supported formats: JPEG, PNG, WebP, GIF, SVG — up to 10MB.

---

## SEO

- Release pages are indexed by Google with full Open Graph and Twitter Card metadata
- Link redirect pages have `noindex` — they serve social media preview bots (which read OG tags) but don't create duplicate content in search results
- A dynamic `sitemap.xml` lists all active release pages, generated from Firestore at request time
- `robots.txt` disallows all admin routes

---

## Bot detection accuracy

The bot detection uses exact bot-exclusive UA strings rather than brand names, which avoids false positives:

- `facebookexternalhit` is a bot. A user browsing in Facebook's in-app browser (`FBAN/FBIOS`) is not.
- `applebot` is a bot. Every Safari UA containing `AppleWebKit` is not.
- `twitterbot` is a bot. Twitter for iPhone is not.
- `telegrambot` is a bot. Telegram's in-app browser is not.
- WhatsApp's link preview crawler (`WhatsApp/2.x`, starts with `WhatsApp/`) is a bot. A user in WhatsApp's in-app browser (`Mozilla/5.0 ... WhatsApp/23.x`) is not.

---

## Environment variables required

```
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Cloudflare R2
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_ENDPOINT
R2_BUCKET
R2_FOLDER
R2_PUBLIC_URL

# Site
NEXT_PUBLIC_SITE_URL
```

MaxMind GeoLite2 database must be placed at `data/GeoLite2-City.mmdb`. Download free from maxmind.com with a free account.
