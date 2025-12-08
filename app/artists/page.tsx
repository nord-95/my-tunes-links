"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Artist } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { User, Plus, Edit, Eye } from "lucide-react";

export default function ArtistsPage() {
  const [user, setUser] = useState<any>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadArtists(currentUser.uid);
      } else {
        router.push("/auth");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadArtists = async (userId: string) => {
    setError(null);
    try {
      console.log("Loading artists for user:", userId);
      // Try simple query first (no orderBy to avoid index requirement)
      const artistsRef = collection(db, "artists");
      const q = query(artistsRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      console.log("Artists query result:", snapshot.docs.length, "documents");
      
      if (snapshot.empty) {
        console.log("No artists found for user");
        setArtists([]);
        setLoading(false);
        return;
      }
      
      const artistsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log("Artist doc:", doc.id, data);
        console.log("createdAt type:", typeof data.createdAt, data.createdAt);
        console.log("createdAt keys:", data.createdAt ? Object.keys(data.createdAt) : 'null');
        
        // Handle createdAt - Firestore Timestamp has toDate() method
        let createdAt: Date;
        try {
          if (data.createdAt) {
            // Check if it's a Firestore Timestamp (has toDate method)
            if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate();
            } 
            // Check if it has seconds property (Firestore Timestamp)
            else if (data.createdAt.seconds !== undefined) {
              createdAt = new Date(data.createdAt.seconds * 1000);
            }
            // Check if it's already a Date
            else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt;
            }
            // Try to create Date from value
            else {
              createdAt = new Date(data.createdAt);
            }
          } else {
            createdAt = new Date();
          }
          
          // Validate the date
          if (isNaN(createdAt.getTime())) {
            console.warn("Invalid createdAt, using current date");
            createdAt = new Date();
          }
        } catch (e) {
          console.error("Error converting createdAt:", e);
          createdAt = new Date();
        }
        
        // Handle updatedAt - same logic
        let updatedAt: Date;
        try {
          if (data.updatedAt) {
            if (data.updatedAt.toDate && typeof data.updatedAt.toDate === 'function') {
              updatedAt = data.updatedAt.toDate();
            } 
            else if (data.updatedAt.seconds !== undefined) {
              updatedAt = new Date(data.updatedAt.seconds * 1000);
            }
            else if (data.updatedAt instanceof Date) {
              updatedAt = data.updatedAt;
            }
            else {
              updatedAt = new Date(data.updatedAt);
            }
          } else {
            updatedAt = new Date();
          }
          
          if (isNaN(updatedAt.getTime())) {
            console.warn("Invalid updatedAt, using current date");
            updatedAt = new Date();
          }
        } catch (e) {
          console.error("Error converting updatedAt:", e);
          updatedAt = new Date();
        }
        
        return {
          id: doc.id,
          userId: data.userId,
          name: data.name,
          slug: data.slug,
          bio: data.bio,
          profileImageUrl: data.profileImageUrl,
          website: data.website,
          socialLinks: data.socialLinks,
          newsletterEmails: data.newsletterEmails || [],
          createdAt,
          updatedAt,
        } as Artist;
      });
      
      // Sort client-side
      artistsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      console.log("Parsed artists:", artistsData);
      setArtists(artistsData);
      setLoading(false);
    } catch (error: any) {
      console.error("Error loading artists:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      setError(error.message || "Failed to load artists");
      setArtists([]);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading artists...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <User className="h-8 w-8" />
              Artists
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and view all your artists
            </p>
          </div>
          <Button onClick={() => router.push("/artists/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Artist
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4">
              <p className="text-destructive">Error: {error}</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => user && loadArtists(user.uid)}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {!error && !loading && (
          <>
            {artists.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg">
                    No artists yet. Create your first artist to get started!
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push("/artists/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Artist
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {artists.map((artist) => (
                  <Card
                    key={artist.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square w-full bg-muted flex items-center justify-center">
                      {artist.profileImageUrl ? (
                        <img
                          src={artist.profileImageUrl}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg truncate">
                          {artist.name}
                        </h3>
                        {artist.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {artist.bio}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/artist/${artist.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => router.push(`/artist/edit/${artist.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>

                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        <p>Created: {formatDate(artist.createdAt)}</p>
                        {artist.newsletterEmails && artist.newsletterEmails.length > 0 && (
                          <p>Newsletter: {artist.newsletterEmails.length} emails</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

