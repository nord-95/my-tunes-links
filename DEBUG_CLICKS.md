# Debugging Click Tracking

If clicks aren't showing up, check these:

## 1. Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → Functions
2. Click on a function execution
3. Look for logs like:
   - "Creating click with data:"
   - "Click created successfully with ID:"
   - Any error messages

## 2. Check Firestore Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **my-tunes-links**
3. Go to **Firestore Database** → **Data**
4. Check the `clicks` collection
5. See if any documents are being created

## 3. Check Firestore Rules

Make sure your rules allow creating clicks. The rule should be:

```javascript
match /clicks/{clickId} {
  allow create: if request.resource.data.keys().hasAll(['linkId', 'timestamp'])
    && request.resource.data.linkId is string
    && request.resource.data.timestamp is timestamp
    && exists(/databases/$(database)/documents/links/$(request.resource.data.linkId));
}
```

## 4. Check for Missing Index

If you see an error about a missing index:
1. Click the link in the error message
2. Create the index in Firebase Console
3. Wait for it to build (1-2 minutes)

## 5. Test Click Creation Manually

Try creating a click manually in Firestore Console to verify the rules work.

## 6. Check Browser Console

Open browser DevTools → Console when clicking a link and look for:
- "Creating click with data:"
- "Click created successfully"
- Any error messages

## Common Issues

1. **Location API timeout**: This is okay - clicks should still be created without location
2. **Firestore permission denied**: Check your security rules
3. **Missing index**: Create the required index
4. **Link doesn't exist**: The rule requires the link to exist before creating a click

