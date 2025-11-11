# Firebase Production Setup - Security Rules

Since you've set up your database in **production mode**, you need to configure proper security rules. Production mode means all access is denied by default, so we need explicit rules.

## ✅ Your Credentials Are Configured

Your Firebase credentials have been added to `.env.local`. The server will automatically pick them up when you restart it.

## 🔒 Set Up Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **my-tunes-links**
3. Click **"Firestore Database"** in the left sidebar
4. Click on the **"Rules"** tab
5. Copy and paste the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - users can only read/write their own document
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Links collection - users can only manage their own links
    match /links/{linkId} {
      // Read: Only the owner can read their links
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      
      // Create: User must be authenticated and the userId must match their auth uid
      allow create: if isAuthenticated() 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.keys().hasAll(['userId', 'title', 'destinationUrl', 'slug', 'createdAt', 'updatedAt', 'clicks', 'isActive'])
        && request.resource.data.clicks is int
        && request.resource.data.isActive is bool;
      
      // Update: Only owner can update, and userId cannot be changed
      allow update: if isAuthenticated() 
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == resource.data.userId
        && request.resource.data.updatedAt is timestamp;
      
      // Delete: Only owner can delete
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }
    
    // Clicks collection - for tracking link clicks
    match /clicks/{clickId} {
      // Read: Users can only read clicks for their own links
      allow read: if isAuthenticated() 
        && exists(/databases/$(database)/documents/links/$(resource.data.linkId))
        && get(/databases/$(database)/documents/links/$(resource.data.linkId)).data.userId == request.auth.uid;
      
      // Create: Anyone can create clicks (for tracking), but with validation
      allow create: if request.resource.data.keys().hasAll(['linkId', 'timestamp'])
        && request.resource.data.linkId is string
        && request.resource.data.timestamp is timestamp
        && exists(/databases/$(database)/documents/links/$(request.resource.data.linkId));
    }
  }
}
```

6. Click **"Publish"** to save the rules

## 🔐 Security Features

These rules ensure:

✅ **User Isolation**: Users can only access their own data
✅ **Authentication Required**: All operations require authentication
✅ **Data Validation**: Only valid data structures can be created
✅ **Immutable User IDs**: User IDs cannot be changed after creation
✅ **Click Tracking**: Anyone can create clicks (for public link tracking), but only link owners can read them

## 📋 Create Firestore Indexes

When you start using the app, Firebase might prompt you to create indexes. If you see an error like:

> "The query requires an index..."

1. Click the link in the error message
2. It will take you to Firebase Console
3. Click **"Create index"**
4. Wait for the index to build (usually 1-2 minutes)

Common indexes you might need:
- `links` collection: `userId` (Ascending) + `createdAt` (Descending)
- `clicks` collection: `linkId` (Ascending) + `timestamp` (Descending)

## 🚀 Restart Your Server

After setting up the rules, restart your development server:

1. Stop the current server (Ctrl+C in the terminal)
2. Run `npm run dev` again
3. The new environment variables will be loaded

## ✅ Test Your Setup

1. Open http://localhost:3000
2. Go to the auth page: http://localhost:3000/auth
3. Create a new account
4. Try creating your first link

If everything works, you're all set! 🎉

## 🛡️ Additional Security Recommendations

For production, consider:

1. **Enable App Check** (in Firebase Console > App Check) to prevent abuse
2. **Set up domain restrictions** in Authentication settings
3. **Monitor usage** in Firebase Console > Usage
4. **Set up alerts** for unusual activity
5. **Regular security audits** of your rules

## 📝 Rules File Location

I've also saved these rules to `firestore.rules` in your project root for reference.

