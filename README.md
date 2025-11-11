# My Tunes - Link Tracking & Music Links Platform

A modern link tracking and redirection platform with music platform support, built to replace Linkfire. Track your links, redirect users, and provide music platform links all in one place.

## Features

- 🔗 **Link Management**: Create, edit, and manage custom short links
- 🎵 **Music Platform Support**: Add links to Spotify, Apple Music, YouTube Music, SoundCloud, Deezer, Tidal, Amazon Music, and Pandora
- 📊 **Analytics**: Track clicks, view statistics, and analyze traffic
- 🔐 **Authentication**: Secure user authentication with Firebase
- 🎨 **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and shadcn/ui
- ⚡ **Fast**: Built with Next.js 14 and optimized for Vercel

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Firebase (Firestore, Authentication)
- **Deployment**: Vercel
- **Charts**: Recharts

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Firestore and Authentication enabled
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd my-tunes
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (for server-side auth)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

4. Set up Firebase:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get your Firebase config from Project Settings
   - For server-side authentication, generate a service account key:
     - Go to Project Settings > Service Accounts
     - Click "Generate New Private Key"
     - Copy the JSON content to `FIREBASE_SERVICE_ACCOUNT` env variable

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add all environment variables in Vercel's project settings
4. Deploy!

Vercel will automatically detect Next.js and configure the build settings.

## Project Structure

```
my-tunes/
├── app/
│   ├── [slug]/          # Dynamic route for link redirection
│   ├── analytics/        # Analytics pages
│   ├── auth/            # Authentication page
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Dashboard home
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # Reusable UI components
│   ├── dashboard.tsx    # Main dashboard
│   ├── link-form.tsx    # Link creation/editing form
│   ├── link-list.tsx    # List of user's links
│   └── link-redirect.tsx # Link redirection page
├── lib/
│   ├── firebase.ts      # Firebase configuration
│   ├── auth.ts          # Authentication utilities
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Utility functions
└── public/              # Static assets
```

## Usage

### Creating a Link

1. Sign up or sign in to your account
2. Click "Create Link" on the dashboard
3. Fill in the link details:
   - Title (required)
   - Description (optional)
   - Destination URL (required)
   - Custom slug (optional, auto-generated if not provided)
4. Add music platform links (optional)
5. Click "Create Link"

### Managing Links

- View all your links on the dashboard
- Edit links by clicking the edit icon
- Deactivate/activate links
- Delete links
- View analytics for each link
- Copy link URLs to share

### Analytics

- View total clicks
- See clicks over time (chart)
- View recent clicks with device and referrer information
- Access analytics from the link card or navigate to `/analytics/[linkId]`

## Customization

### Adding Music Platforms

Edit `components/link-form.tsx` and add new platforms to the `MUSIC_PLATFORMS` array and update the `getPlatformIcon` function in `lib/utils.ts`.

### Styling

The project uses Tailwind CSS with a custom theme. Modify `tailwind.config.ts` and `app/globals.css` to customize colors and styling.

## Security Considerations

- All authentication is handled server-side when possible
- User data is isolated by user ID
- Links are validated before creation
- Click tracking respects user privacy (IP addresses are stored but can be anonymized)

## Future Enhancements

- Custom domain support
- QR code generation
- Advanced analytics (geographic data, device breakdown)
- Link expiration dates
- Password-protected links
- Bulk link import/export
- API for programmatic link creation

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions, please open an issue on GitHub.

