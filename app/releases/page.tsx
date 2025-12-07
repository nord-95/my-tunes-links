"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Release } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { BarChart3, Edit, Eye, Music } from "lucide-react";

export default function ReleasesPage() {
  const [user, setUser] = useState<any>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadReleases(currentUser.uid);
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadReleases = async (userId: string) => {
    try {
      const releasesRef = collection(db, "releases");
      const q = query(
        releasesRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const releasesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Release[];
      setReleases(releasesData);
    } catch (error: any) {
      // Silently handle index errors - index might still be building
      if (error.code === "failed-precondition" && error.message?.includes("index")) {
        console.log("Index is still building. Please wait a moment and refresh.");
        // Try loading without orderBy as fallback
        try {
          const releasesRef = collection(db, "releases");
          const q = query(releasesRef, where("userId", "==", userId));
          const snapshot = await getDocs(q);
          const releasesData = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Release[];
          // Sort client-side as fallback
          releasesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setReleases(releasesData);
        } catch (fallbackError) {
          console.error("Error loading releases:", fallbackError);
        }
      } else {
        console.error("Error loading releases:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading releases...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Music className="h-8 w-8" />
            Releases
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all your music releases
          </p>
        </div>

        {releases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                No releases yet. Create your first release to get started!
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/releases/new")}
              >
                <Music className="h-4 w-4 mr-2" />
                Create Release
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {releases.map((release) => (
              <Card
                key={release.id}
                className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  !release.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="relative aspect-square w-full">
                  <img
                    src={release.artworkUrl}
                    alt={`${release.artistName} - ${release.releaseName}`}
                    className="w-full h-full object-cover"
                  />
                  {!release.isActive && (
                    <div className="absolute top-2 right-2 bg-muted px-2 py-1 rounded text-xs">
                      Inactive
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg truncate">
                      {release.releaseName}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {release.artistName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {release.releaseType}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/release/${release.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/release/edit/${release.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/releases/analytics/${release.id}`)}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    <p>Views: {release.views || 0}</p>
                    <p>{formatDate(release.createdAt)}</p>
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

