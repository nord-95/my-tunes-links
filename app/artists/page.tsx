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
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadArtists(currentUser.uid);
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadArtists = async (userId: string) => {
    try {
      const artistsRef = collection(db, "artists");
      const q = query(
        artistsRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const artistsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Artist[];
      setArtists(artistsData);
    } catch (error: any) {
      if (error.code === "failed-precondition" && error.message?.includes("index")) {
        console.log("Index is still building. Please wait a moment and refresh.");
        try {
          const artistsRef = collection(db, "artists");
          const q = query(artistsRef, where("userId", "==", userId));
          const snapshot = await getDocs(q);
          const artistsData = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Artist[];
          artistsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setArtists(artistsData);
        } catch (fallbackError) {
          console.error("Error loading artists:", fallbackError);
        }
      } else {
        console.error("Error loading artists:", error);
      }
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
      </div>
    </div>
  );
}

