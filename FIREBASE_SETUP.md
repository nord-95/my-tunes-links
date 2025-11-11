# Firebase Setup Guide

Follow these steps to set up Firebase for your My Tunes platform.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name (e.g., "my-tunes")
4. Click **"Continue"**
5. (Optional) Disable Google Analytics if you don't need it, or enable it if you want analytics
6. Click **"Create project"**
7. Wait for the project to be created, then click **"Continue"**

## Step 2: Get Your Firebase Configuration

1. In your Firebase project, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. Click the **Web icon** (</>) to add a web app
5. Register your app:
   - App nickname: "My Tunes Web" (or any name)
   - (Optional) Check "Also set up Firebase Hosting"
   - Click **"Register app"**
6. Copy the `firebaseConfig` object that appears
7. You'll see something like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123",
     measurementId: "G-XXXXXXXXXX"
   };
   ```

## Step 3: Enable Authentication

1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"** (if you haven't enabled it yet)
3. Click on the **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

## Step 4: Set Up Firestore Database

1. In the Firebase Console, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
   - ⚠️ **Important**: For production, you'll need to set up proper security rules
4. Select a location for your database (choose the closest to your users)
5. Click **"Enable"**
6. Wait for the database to be created

## Step 5: Create Your .env.local File

1. In your project root directory (`/Users/rares/Documents/WEB APPS/my-tunes`), create a file named `.env.local`
2. Add the following content, replacing the values with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. Save the file

## Step 6: Set Up Firestore Security Rules (Important!)

1. In Firebase Console, go to **"Firestore Database"** > **"Rules"** tab
2. Replace the default rules with these (for development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only create/read/update/delete their own links
    match /links/{linkId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Anyone can read clicks, but only the system can write them
    match /clicks/{clickId} {
      allow read: if request.auth != null;
      allow create: if true; // Allow creation for tracking
    }
  }
}
```

3. Click **"Publish"**

## Step 7: Create Firestore Indexes (Optional but Recommended)

When you start using the app, Firebase might ask you to create indexes. If you see an error about missing indexes:

1. Click the link in the error message
2. It will take you to Firebase Console
3. Click **"Create index"**
4. Wait for the index to be created

## Step 8: Test Your Setup

1. Make sure your `.env.local` file is saved
2. Restart your development server (if it's running):
   - Stop it (Ctrl+C)
   - Run `npm run dev` again
3. Open http://localhost:3000
4. Try to sign up with a new account
5. If everything works, you should be able to create links!

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure your `.env.local` file exists and has all the required variables
- Restart your dev server after creating/updating `.env.local`

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure you're logged in

### "Index needed" error
- Click the link in the error to create the required index
- Wait a few minutes for the index to build

### Can't find Firebase config
- Make sure you registered a **Web app** (not iOS or Android)
- The config should be in Project Settings > Your apps

## Next Steps

Once Firebase is set up:
1. ✅ Create an account at http://localhost:3000/auth
2. ✅ Create your first link
3. ✅ Test link redirection
4. ✅ View analytics

For production deployment:
- Update Firestore security rules to be more restrictive
- Set up proper domain restrictions in Firebase
- Enable additional security features

