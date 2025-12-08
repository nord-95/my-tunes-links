# My Tunes - Comprehensive Platform Documentation

## 📖 What is My Tunes?

**My Tunes** is a comprehensive link tracking, music release management, and artist promotion platform designed to help musicians, artists, and content creators manage their online presence, track engagement, and distribute their music across multiple streaming platforms. It serves as a modern alternative to platforms like Linkfire, providing advanced analytics, beautiful landing pages, and comprehensive tracking capabilities.

The platform combines three core functionalities:
1. **Link Shortening & Tracking** - Create custom short links with detailed analytics
2. **Music Release Management** - Create beautiful landing pages for music releases
3. **Artist Profile Management** - Build artist bio pages with newsletter subscriptions

---

## 🎯 Core Features

### 1. Link Management System

#### Link Creation & Customization
- **Custom Short Links**: Create memorable, branded short links (e.g., `mytune.es/your-slug`)
- **Destination URL Management**: Redirect users to any destination URL
- **Music Platform Integration**: Add multiple streaming platform links (Spotify, Apple Music, YouTube Music, SoundCloud, Deezer, Tidal, Amazon Music, Pandora)
- **Link Metadata**: 
  - Custom titles and descriptions
  - Thumbnail images
  - Tags and categories for organization
  - Internal notes for personal tracking
  - Internal UTM parameters for campaign tracking

#### Social Media Optimization
- **Open Graph Tags**: Customize how links appear when shared on social media
  - Custom OG title, description, and images
  - OG type specification (website, music.song, music.album, etc.)
  - Site name customization
- **Twitter Cards**: Optimized Twitter sharing with custom cards
  - Summary or summary_large_image card types
  - Custom Twitter titles, descriptions, and images
- **Site Icons**: Custom favicon/icons for social sharing contexts

#### Link Management
- **Activate/Deactivate Links**: Control link availability without deletion
- **Edit Links**: Update all link properties after creation
- **Delete Links**: Permanently remove links
- **Link Analytics**: Comprehensive tracking and analytics (see Analytics section)

### 2. Music Release Management

#### Release Creation
- **Release Information**:
  - Artist name
  - Release name
  - Artwork (high-quality image URL)
  - Artist logo (optional, displays artist name if not provided)
  - Release type: Single, EP, Album, Playlist, Live Version, Music Video, or Custom type
  - Custom slug for URL generation
  - Release year (automatically extracted from creation date)

#### Streaming Platform Links
- Add links to multiple music streaming platforms:
  - Spotify
  - Apple Music
  - YouTube Music
  - SoundCloud
  - Deezer
  - Tidal
  - Amazon Music
  - Pandora
- Each platform link is tracked individually

#### Release Landing Pages
- **Beautiful Design**: Responsive landing pages matching professional music release templates
- **Mobile Optimized**: Special mobile layout with full-screen artwork
- **Gradient Overlays**: Black-transparent gradient overlays for better text readability
- **Platform Buttons**: Grid layout on desktop, vertical list on mobile
- **Social Media Metadata**: Full Open Graph and Twitter Card support for sharing

#### Release Analytics
- **Page Views**: Track every visit to release pages
- **Button Clicks**: Track clicks on streaming platform buttons
- **Platform-Specific Tracking**: See which platforms get the most clicks
- **Detailed Interaction Data**: Device, browser, location, and referrer information for each interaction

### 3. Artist Management

#### Artist Profiles
- **Artist Information**:
  - Artist name
  - Custom slug for bio page URLs
  - Bio/description (with read more/less functionality)
  - Profile image
  - Website URL
  - Social media links (Instagram, Twitter, Facebook, YouTube, TikTok, SoundCloud, Spotify, etc.)

#### Artist Bio Pages
- **Public Bio Pages**: Auto-generated beautiful bio pages at `/artist-bio/{slug}`
- **Newsletter Integration**: 
  - Email subscription form
  - Stores emails in Firestore under `newsletter/{artistName}/emails`
  - Duplicate email prevention
  - Success/error messaging
- **Social Links Display**: All artist social media links displayed as platform tiles
- **Responsive Design**: Mobile-optimized with logo animations and neon flicker effects
- **Template-Based Design**: Matches professional artist bio page templates

#### Artist Gallery
- View all artists in a responsive grid
- Quick access to artist details, editing, and management

### 4. Advanced Analytics & Tracking

#### Link Analytics
- **Total Clicks**: Overall click count for each link
- **Time-Based Analytics**: 
  - Clicks over time (line charts)
  - Daily, weekly, monthly breakdowns
- **Platform Analytics**: 
  - Clicks by platform (desktop, mobile, tablet)
  - Device type breakdown (iPhone, iPad, Samsung, etc.)
- **Geographic Analytics**:
  - Clicks by country
  - City and region data
  - Country codes and timezones
- **Referrer Analytics**:
  - Top referrers
  - Social source detection (Facebook, Twitter, Instagram, etc.)
  - Direct traffic identification
- **UTM Parameter Tracking**:
  - utm_source, utm_medium, utm_campaign, utm_content, utm_term
  - Facebook click ID (fbclid) tracking
- **Device & Browser Analytics**:
  - Operating system (iOS, Android, Windows, macOS, Linux)
  - Browser type (Chrome, Safari, Firefox, etc.)
  - Device type and model
- **Bot Detection**: 
  - Identifies search engine crawlers
  - Detects social media link preview services
  - Identifies email clients
  - Tracks monitoring services

#### Release Analytics
- **View Tracking**: Track every page view on release pages
- **Button Click Tracking**: Track clicks on streaming platform buttons
- **Interaction Details**: Same comprehensive tracking as link analytics
- **Platform Performance**: See which streaming platforms perform best
- **Recent Interactions**: View detailed logs of recent views and clicks

#### Analytics Features
- **Real-Time Updates**: Live data updates using Firestore real-time listeners
- **Charts & Visualizations**: 
  - Line charts for time-based data
  - Bar charts for platform/country breakdowns
  - Pie charts for distribution analysis
- **Data Export**: View detailed interaction logs with all metadata
- **Location Enrichment**: Automatic IP geolocation for location data
- **Update Missing Data**: Button to update location data for existing clicks

### 5. User Authentication & Security

#### Authentication
- **Firebase Authentication**: Secure email/password authentication
- **User Isolation**: Each user can only access their own data
- **Session Management**: Automatic session handling
- **Protected Routes**: All user pages require authentication

#### Security Features
- **Firestore Security Rules**: Comprehensive security rules for all collections
- **Data Validation**: Server-side and client-side validation
- **User ID Verification**: All operations verify user ownership
- **Public Read Access**: Controlled public access for active links and releases
- **Private Data Protection**: User data, analytics, and settings are private

### 6. Settings & Configuration

#### App Settings
- **404 Redirect URL**: Customize where users are redirected for inactive/deleted links
- **Global Configuration**: App-wide settings management

---

## 🛠️ Technology Stack & Frameworks

### Frontend Framework
- **Next.js 16.0.7** (App Router)
  - Server-Side Rendering (SSR)
  - Static Site Generation (SSG)
  - API Routes
  - Dynamic Routing
  - Metadata API for SEO

### Programming Language
- **TypeScript 5.5.4**: Full type safety throughout the application

### UI Framework & Styling
- **React 19.2.1**: Latest React with Server Components support
- **Tailwind CSS 3.4.7**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components built on Radix UI
  - Dialog, Dropdown Menu, Label, Select, Tabs, Toast components
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Beautiful icon library
- **Tailwind Merge**: Utility for merging Tailwind classes
- **clsx**: Conditional class name utility

### Form Management
- **React Hook Form 7.52.1**: Performant form library
- **Zod 3.23.8**: Schema validation
- **@hookform/resolvers**: Zod integration for React Hook Form

### Backend & Database
- **Firebase 10.12.2**:
  - **Firestore**: NoSQL database for all data storage
  - **Authentication**: User authentication service
  - **Security Rules**: Comprehensive access control

### Data Visualization
- **Recharts 2.12.7**: Composable charting library built on D3.js
  - Line charts
  - Bar charts
  - Pie charts

### Utilities
- **date-fns 3.6.0**: Date manipulation and formatting
- **class-variance-authority**: Component variant management

### Development Tools
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

### Deployment
- **Vercel**: Production hosting and deployment
- **Git/GitHub**: Version control and CI/CD

---

## 👥 What Can Users Do?

### Registered Users (Artists/Creators)

#### Link Management
1. **Create Custom Links**
   - Generate branded short links
   - Add destination URLs
   - Customize slugs
   - Add multiple music platform links
   - Set up social media metadata

2. **Manage Links**
   - View all links in dashboard
   - Edit link properties
   - Activate/deactivate links
   - Delete links
   - Copy link URLs for sharing

3. **Track Link Performance**
   - View comprehensive analytics
   - See click trends over time
   - Analyze geographic distribution
   - Track referrers and social sources
   - Monitor device and browser breakdowns
   - Export interaction data

#### Release Management
1. **Create Music Releases**
   - Add release information (artist, name, type)
   - Upload artwork and artist logos
   - Add streaming platform links
   - Customize release slugs
   - Set up social media metadata

2. **Manage Releases**
   - View all releases in gallery
   - Edit release details
   - View release overview pages
   - Delete releases
   - Access release analytics

3. **Track Release Performance**
   - Monitor page views
   - Track platform button clicks
   - Analyze which platforms perform best
   - View detailed interaction logs
   - See geographic and device data

#### Artist Management
1. **Create Artist Profiles**
   - Add artist information
   - Write artist bio
   - Upload profile images
   - Add website and social media links
   - Generate custom slugs

2. **Manage Artists**
   - View all artists in gallery
   - Edit artist profiles
   - View artist detail pages
   - Delete artists
   - Manage newsletter subscriptions

3. **Newsletter Management**
   - View subscriber emails
   - Track subscription counts
   - Manage subscriber lists

#### Dashboard & Navigation
- **Central Dashboard**: View all links and releases in one place
- **Quick Actions**: Fast access to create new links, releases, and artists
- **Navigation Menu**: Easy access to all platform sections
- **Settings**: Configure app-wide settings

---

## 👁️ What Can Viewers Do?

### Public Access (No Authentication Required)

#### Link Redirection
1. **Access Short Links**
   - Visit any active short link (e.g., `mytune.es/your-slug`)
   - Automatic redirection to destination URL
   - Fast, seamless redirection (200ms delay)
   - All interactions are tracked automatically

2. **View Link Information** (Before Redirect)
   - See link title and description
   - View music platform links (if available)
   - See thumbnail images

#### Release Pages
1. **View Release Landing Pages**
   - Access release pages via slug (e.g., `mytune.es/release-slug`)
   - Beautiful, responsive release pages
   - View artwork and artist information
   - See release type and year
   - Access all streaming platform links

2. **Interact with Releases**
   - Click streaming platform buttons
   - All clicks are tracked
   - Mobile-optimized experience
   - Share release pages on social media

#### Artist Bio Pages
1. **View Artist Profiles**
   - Access artist bio pages (e.g., `mytune.es/artist-bio/artist-slug`)
   - View artist information and bio
   - See artist profile images
   - Access artist website and social media links

2. **Subscribe to Newsletters**
   - Enter email address
   - Subscribe to artist newsletters
   - Receive confirmation messages
   - Duplicate prevention

#### Social Sharing
- **Share Links**: Share short links on social media with custom previews
- **Share Releases**: Share release pages with optimized social media cards
- **Share Artist Pages**: Share artist bio pages with custom metadata

---

## 📄 Platform Pages

### Public Pages (No Authentication)

#### Link Redirection
- **Route**: `/{slug}`
- **Purpose**: Redirect users to destination URLs
- **Features**: Fast redirection, click tracking, metadata display

#### Release Pages
- **Route**: `/{slug}` (for releases)
- **Purpose**: Display music release landing pages
- **Features**: Artwork display, streaming links, responsive design, view tracking

#### Artist Bio Pages
- **Route**: `/artist-bio/{slug}`
- **Purpose**: Display artist profiles and bio pages
- **Features**: Artist information, bio, social links, newsletter subscription

### User Pages (Authentication Required)

#### Dashboard
- **Route**: `/`
- **Purpose**: Main user dashboard
- **Features**: Overview of links and releases, quick actions, statistics

#### Links Management
- **Route**: `/` (dashboard section)
- **Purpose**: Manage all user links
- **Features**: Create, edit, delete, view, activate/deactivate links

#### Link Details
- **Route**: `/link/{id}`
- **Purpose**: View detailed link information
- **Features**: Link overview, statistics, edit/delete actions, analytics access

#### Link Edit
- **Route**: `/link/edit/{id}`
- **Purpose**: Edit existing links
- **Features**: Update all link properties, save changes

#### Link Analytics
- **Route**: `/analytics/{id}`
- **Purpose**: View comprehensive link analytics
- **Features**: Charts, graphs, detailed interaction logs, geographic data

#### Releases Gallery
- **Route**: `/releases`
- **Purpose**: View all user releases
- **Features**: Grid view, release cards, quick actions (Details, Edit, Analytics)

#### Create Release
- **Route**: `/releases/new`
- **Purpose**: Create new music releases
- **Features**: Release form, artwork upload, platform links, metadata setup

#### Release Details
- **Route**: `/release/{id}`
- **Purpose**: View release overview
- **Features**: Release information, statistics, artwork, music links, edit/delete actions

#### Release Edit
- **Route**: `/release/edit/{id}`
- **Purpose**: Edit existing releases
- **Features**: Update release properties, save changes

#### Release Analytics
- **Route**: `/releases/analytics/{id}`
- **Purpose**: View release analytics
- **Features**: View tracking, button click analytics, interaction logs

#### Artists Gallery
- **Route**: `/artists`
- **Purpose**: View all user artists
- **Features**: Grid view, artist cards, quick actions (Details, Edit)

#### Create Artist
- **Route**: `/artists/new`
- **Purpose**: Create new artist profiles
- **Features**: Artist form, profile image, bio, social links

#### Artist Details
- **Route**: `/artist/{id}`
- **Purpose**: View artist overview
- **Features**: Artist information, bio, social links, newsletter emails, edit/delete actions

#### Artist Edit
- **Route**: `/artist/edit/{id}`
- **Purpose**: Edit existing artists
- **Features**: Update artist properties, save changes

#### Settings
- **Route**: `/settings`
- **Purpose**: Configure app settings
- **Features**: 404 redirect URL, global configuration

#### Authentication
- **Route**: `/auth`
- **Purpose**: User authentication
- **Features**: Sign up, sign in, password reset

### Legacy Routes (Backward Compatibility)

#### Release Pages (Legacy)
- **Route**: `/r/{slug}`
- **Purpose**: Legacy route for release pages (redirects to `/{slug}`)

---

## 🗄️ Data Structure

### Firestore Collections

#### `links`
- User-created short links
- Fields: userId, slug, title, description, destinationUrl, musicLinks, clicks, isActive, metadata, timestamps

#### `clicks`
- Link click tracking data
- Fields: linkId, timestamp, ipAddress, userAgent, referrer, location data, device info, UTM parameters, bot detection

#### `releases`
- Music release information
- Fields: userId, slug, artistName, releaseName, artworkUrl, artistLogoUrl, releaseType, musicLinks, views, isActive, metadata, timestamps

#### `releaseClicks`
- Release interaction tracking
- Fields: releaseId, timestamp, clickType (view/button_click/platform_click), platform, url, all tracking metadata

#### `artists`
- Artist profile information
- Fields: userId, name, slug, bio, profileImageUrl, website, socialLinks, newsletterEmails, timestamps

#### `newsletter/{artistName}/emails`
- Newsletter subscription emails
- Fields: email, subscribedAt, artistName, artistId

#### `users`
- User account information
- Fields: userId, email, profile data

#### `settings`
- App-wide settings
- Fields: notFoundRedirectUrl, other global configurations

---

## 🎨 Design & User Experience

### Design Philosophy
- **Modern & Clean**: Minimalist design with focus on content
- **Responsive**: Mobile-first approach with desktop enhancements
- **Accessible**: WCAG-compliant components and interactions
- **Fast**: Optimized performance with Next.js SSR and static generation
- **Beautiful**: Professional templates matching industry standards

### UI Components
- **shadcn/ui**: Consistent, accessible component library
- **Tailwind CSS**: Utility-first styling for rapid development
- **Custom Templates**: Professional release and artist bio page templates
- **Animations**: Smooth fade-in animations and transitions
- **Mobile Optimizations**: Special mobile layouts for releases and artist pages

### Color Scheme
- Dark theme with accent colors
- High contrast for readability
- Brand colors for music platforms
- Gradient overlays for visual depth

---

## 🔒 Security & Privacy

### Security Features
- **Firestore Security Rules**: Comprehensive access control
- **User Isolation**: Users can only access their own data
- **Authentication Required**: Protected routes require login
- **Data Validation**: Server-side and client-side validation
- **Input Sanitization**: All user inputs are validated and sanitized

### Privacy Considerations
- **IP Address Storage**: Stored for analytics but can be anonymized
- **Location Data**: Optional, user-controlled
- **Bot Detection**: Identifies and filters bot traffic
- **Public Data**: Only active links/releases are publicly accessible
- **Newsletter Data**: Stored securely, only accessible by artist owner

---

## 🚀 Performance & Optimization

### Performance Features
- **Server-Side Rendering**: Fast initial page loads
- **Static Generation**: Pre-rendered pages where possible
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting for optimal bundle sizes
- **Caching**: Strategic caching for improved performance

### Analytics Performance
- **Non-Blocking Tracking**: Analytics don't block page loads
- **Background Processing**: Location enrichment happens asynchronously
- **Real-Time Updates**: Efficient Firestore listeners for live data
- **Optimized Queries**: Indexed Firestore queries for fast data retrieval

---

## 📊 Analytics Capabilities

### Tracked Metrics

#### Link Metrics
- Total clicks
- Clicks over time
- Clicks by platform (desktop/mobile/tablet)
- Clicks by device type
- Clicks by browser
- Clicks by operating system
- Clicks by country
- Clicks by city/region
- Top referrers
- Social source attribution
- UTM parameter tracking
- Bot traffic identification

#### Release Metrics
- Total page views
- Platform button clicks
- Clicks by streaming platform
- All device/browser/location data
- Interaction timestamps
- Referrer information

#### Artist Metrics
- Newsletter subscription count
- Bio page views (if implemented)
- Social link clicks (if implemented)

### Analytics Visualizations
- **Line Charts**: Time-based click trends
- **Bar Charts**: Platform, country, device breakdowns
- **Pie Charts**: Distribution analysis
- **Data Tables**: Detailed interaction logs
- **Statistics Cards**: Key metrics at a glance

---

## 🌐 Integration Capabilities

### Music Platforms Supported
- Spotify
- Apple Music
- YouTube Music
- SoundCloud
- Deezer
- Tidal
- Amazon Music
- Pandora

### Social Media Platforms
- Instagram
- Twitter/X
- Facebook
- YouTube
- TikTok
- SoundCloud
- Spotify
- Twitch
- Bandcamp
- Custom platforms

### Third-Party Services
- **Firebase**: Backend infrastructure
- **Vercel**: Hosting and deployment
- **IP Geolocation**: Location data enrichment (via API route)

---

## 📱 Mobile Experience

### Mobile Optimizations
- **Responsive Design**: All pages are mobile-optimized
- **Touch-Friendly**: Large tap targets, swipe gestures
- **Mobile-Specific Layouts**: Special layouts for releases and artist pages
- **Fast Loading**: Optimized for mobile networks
- **Offline Support**: Basic offline functionality (via service workers if implemented)

### Release Page Mobile Features
- Full-screen artwork display
- Vertical platform button list
- Gradient overlays for text readability
- Logo animations with neon flicker effects
- Optimized typography and spacing

---

## 🔄 Workflow Examples

### Creating a Music Release
1. User logs in to dashboard
2. Navigates to "New Release"
3. Fills in release information (artist, name, type)
4. Uploads artwork URL
5. Optionally uploads artist logo
6. Adds streaming platform links
7. Customizes slug
8. Sets up social media metadata
9. Publishes release
10. Receives public URL: `mytune.es/{slug}`
11. Shares URL on social media
12. Tracks views and clicks in analytics

### Creating a Short Link
1. User logs in to dashboard
2. Clicks "Create Link"
3. Enters destination URL
4. Adds custom slug (or auto-generated)
5. Optionally adds music platform links
6. Sets up social media metadata
7. Publishes link
8. Receives short URL: `mytune.es/{slug}`
9. Shares link
10. Tracks clicks and analytics

### Setting Up Artist Profile
1. User logs in
2. Navigates to "Artists"
3. Clicks "New Artist"
4. Enters artist information
5. Writes bio
6. Uploads profile image
7. Adds website and social links
8. Publishes artist
9. Receives bio page URL: `mytune.es/artist-bio/{slug}`
10. Viewers can subscribe to newsletter
11. User manages subscribers in artist details

---

## 🎯 Use Cases

### Musicians & Artists
- Promote new releases with beautiful landing pages
- Track which streaming platforms perform best
- Build email lists through artist bio pages
- Share branded short links on social media
- Analyze audience engagement and demographics

### Music Labels
- Manage multiple artists and releases
- Track label-wide performance
- Coordinate release campaigns
- Analyze market trends

### Content Creators
- Create branded short links
- Track link performance
- Add music platform links to content
- Analyze audience sources

### Marketing Teams
- Track campaign performance with UTM parameters
- Analyze geographic distribution
- Monitor social media referrals
- Optimize based on analytics data

---

## 🔮 Future Enhancements (Potential)

- Custom domain support
- QR code generation
- Advanced analytics (geographic heatmaps, time-based analysis)
- Link expiration dates
- Password-protected links
- Bulk link import/export
- API for programmatic link creation
- Email notifications for analytics milestones
- Scheduled releases
- Release templates
- Multi-language support
- Advanced newsletter features (segmentation, campaigns)
- Integration with email marketing platforms
- Social media auto-posting
- Release calendar
- Collaboration features (team management)

---

## 📝 Technical Details

### Architecture
- **Monorepo Structure**: Single repository with organized folders
- **Component-Based**: Reusable React components
- **Type-Safe**: Full TypeScript coverage
- **Server Components**: Next.js 16 App Router with Server Components
- **Client Components**: Interactive features with Client Components

### Data Flow
1. User creates content (link/release/artist)
2. Data validated client-side (Zod schemas)
3. Data sent to Firestore
4. Firestore security rules validate
5. Data stored in appropriate collection
6. Real-time listeners update UI
7. Public pages fetch data server-side
8. Analytics tracked on interactions
9. Data enriched asynchronously (location, etc.)

### File Structure
```
my-tunes/
├── app/                    # Next.js App Router pages
│   ├── [slug]/            # Dynamic routes for links/releases
│   ├── analytics/         # Analytics pages
│   ├── artist/            # Artist management pages
│   ├── artist-bio/        # Public artist bio pages
│   ├── artists/           # Artist gallery and creation
│   ├── auth/              # Authentication
│   ├── link/              # Link management pages
│   ├── release/           # Release management pages
│   ├── releases/          # Release gallery and analytics
│   └── settings/          # App settings
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── artist-bio.tsx    # Artist bio page component
│   ├── dashboard.tsx     # Main dashboard
│   ├── link-form.tsx     # Link creation/editing
│   ├── link-list.tsx     # Link list display
│   ├── link-redirect.tsx # Link redirection page
│   ├── release-form.tsx  # Release creation/editing
│   ├── release-list.tsx  # Release list display
│   ├── release-page-client.tsx # Release page component
│   └── site-nav.tsx      # Navigation bar
├── lib/                   # Utilities and configurations
│   ├── firebase.ts       # Firebase configuration
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions
├── public/               # Static assets
├── firestore.rules       # Firestore security rules
└── package.json         # Dependencies and scripts
```

---

## 🎓 Learning Resources

### Key Technologies to Understand
- **Next.js App Router**: Modern React framework routing
- **Firebase/Firestore**: NoSQL database and backend
- **TypeScript**: Type-safe JavaScript
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **Tailwind CSS**: Utility-first CSS
- **Recharts**: Data visualization

---

## 📞 Support & Contribution

This platform is designed to be:
- **Self-Hosted**: Deploy on your own infrastructure
- **Customizable**: Modify to fit your needs
- **Extensible**: Add new features and integrations
- **Maintainable**: Clean code structure and documentation

---

## 📄 License

MIT License - Free to use, modify, and distribute.

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Platform**: My Tunes - Link Tracking & Music Release Management Platform

