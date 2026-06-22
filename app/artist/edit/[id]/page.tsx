"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Artist } from "@/lib/types";
import ArtistForm from "@/components/artist-form";
import AppLayout from "@/components/app-layout";
import { ArrowLeft } from "lucide-react";

export default function EditArtistPage() {
  const params = useParams();
  const router = useRouter();
  const artistId = params.id as string;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadArtist = useCallback(async () => {
    if (!artistId || !user) return;
    
    try {
      const artistRef = doc(db, "artists", artistId);
      const artistDoc = await getDoc(artistRef);
      
      if (artistDoc.exists()) {
        const data = artistDoc.data();
        
        // Helper function to convert Firestore Timestamp to Date
        const convertTimestamp = (timestamp: any): Date => {
          if (!timestamp) {
            return new Date();
          }
          
          // Check if it's already a Date
          if (timestamp instanceof Date) {
            if (!isNaN(timestamp.getTime())) {
              return timestamp;
            }
            return new Date();
          }
          
          // Check if it's an empty object (no enumerable properties)
          if (typeof timestamp === 'object' && Object.keys(timestamp).length === 0) {
            return new Date();
          }
          
          // Try toDate() method first (Firestore Timestamp)
          if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
            try {
              const date = timestamp.toDate();
              if (date instanceof Date && !isNaN(date.getTime())) {
                return date;
              }
            } catch (e) {
              // Continue to other methods
            }
          }
          
          // Check for seconds property (Firestore Timestamp format)
          if (typeof timestamp === 'object' && 'seconds' in timestamp && typeof timestamp.seconds === 'number') {
            const date = new Date(timestamp.seconds * 1000);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
          
          // Check for _seconds (internal Firestore property)
          if (typeof timestamp === 'object' && '_seconds' in timestamp && typeof (timestamp as any)._seconds === 'number') {
            const date = new Date((timestamp as any)._seconds * 1000);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }
          
          // Try to create Date from the value itself
          try {
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              return date;
            }
          } catch (e) {
            // Ignore
          }
          
          // If all else fails, return current date
          return new Date();
        };
        
        const artistData: Artist = {
          id: artistDoc.id,
          userId: data.userId,
          name: data.name,
          slug: data.slug,
          bio: data.bio,
          profileImageUrl: data.profileImageUrl,
          website: data.website,
          socialLinks: data.socialLinks,
          newsletterEmails: data.newsletterEmails || [],
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        };
        
        if (artistData.userId !== user.uid) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to edit this artist",
            variant: "destructive",
          });
          router.push("/");
          return;
        }
        
        setArtist(artistData);
      } else {
        toast({
          title: "Artist Not Found",
          description: "The artist you're looking for doesn't exist",
          variant: "destructive",
        });
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error loading artist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load artist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [artistId, user, router, toast]);

  useEffect(() => {
    if (user) {
      loadArtist();
    }
  }, [user, loadArtist]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading artist...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Artist not found</div>
      </div>
    );
  }

  return (
    <AppLayout
      title={`Edit: ${artist.name}`}
      action={
        <Button size="sm" variant="outline" onClick={() => router.push(`/artist/${artist.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      }
    >
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ArtistForm
            initialData={artist}
            onSuccess={() => router.push(`/artist/${artist.id}`)}
            onCancel={() => router.push(`/artist/${artist.id}`)}
          />
        </div>
      </div>
    </AppLayout>
  );
}

