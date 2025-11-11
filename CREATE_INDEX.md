# Create Firestore Index

You need to create a Firestore index for the links query. Here's how:

## Quick Fix

1. **Click this link** to create the index automatically:
   https://console.firebase.google.com/v1/r/project/my-tunes-links/firestore/indexes?create_composite=Ckxwcm9qZWN0cy9teS10dW5lcy1saW5rcy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbGlua3MvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

2. Click **"Create index"** in the Firebase Console
3. Wait 1-2 minutes for the index to build
4. Refresh your app - it should work now!

## Manual Method

If the link doesn't work:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **my-tunes-links**
3. Click **"Firestore Database"** → **"Indexes"** tab
4. Click **"Create Index"**
5. Configure:
   - **Collection ID**: `links`
   - **Fields to index**:
     - `userId` (Ascending)
     - `createdAt` (Descending)
   - Click **"Create"**

## What This Index Does

This index allows efficient querying of links by:
- Filtering by `userId` (to show only the user's links)
- Ordering by `createdAt` (to show newest first)

Without this index, Firestore can't efficiently execute the query, which is why you're seeing the error.

