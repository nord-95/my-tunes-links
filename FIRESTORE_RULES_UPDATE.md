# ⚠️ IMPORTANT: Update Firestore Security Rules

The link redirection is failing because the current Firestore security rules require authentication to read links. However, public link clicks are not authenticated.

## 🔧 Fix Required

You need to update your Firestore security rules to allow **public read access for active links**.

### Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **my-tunes-links**
3. Go to **Firestore Database** → **Rules** tab
4. Replace the `links` collection rules with this:

```javascript
// Links collection - users can only manage their own links
match /links/{linkId} {
  // Read: Allow public read for active links (for redirects), or authenticated users can read their own links
  allow read: if resource.data.isActive == true || (isAuthenticated() && resource.data.userId == request.auth.uid);
  
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
```

5. Click **"Publish"**

## 🔐 Security Note

This change allows **anyone** to read active links, which is necessary for public link redirection. However:
- ✅ Only active links are publicly readable
- ✅ Inactive links still require authentication
- ✅ Users can only create/update/delete their own links
- ✅ All write operations still require authentication

This is the standard pattern for link shorteners like bit.ly, Linkfire, etc.

## ✅ After Updating

Once you update the rules:
1. Wait a few seconds for the rules to propagate
2. Try accessing your link again
3. It should now redirect properly!

