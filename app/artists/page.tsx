"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Artist } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Users, Plus, Edit, Eye } from "lucide-react";

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        await loadArtists(currentUser.uid);
      } else {
        router.push("/auth");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadArtists = async (uid: string) => {
    setError(null);
    try {
      const q = query(collection(db, "artists"), where("userId", "==", uid));
      const snapshot = await getDocs(q);

      const convertTimestamp = (ts: any): Date => {
        if (!ts) return new Date();
        if (ts instanceof Date && !isNaN(ts.getTime())) return ts;
        if (typeof ts === "object" && "toDate" in ts) {
          try {
            const d = ts.toDate();
            if (!isNaN(d.getTime())) return d;
          } catch {}
        }
        if (typeof ts === "object" && "seconds" in ts) {
          return new Date(ts.seconds * 1000);
        }
        const d = new Date(ts);
        return isNaN(d.getTime()) ? new Date() : d;
      };

      const data = snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          userId: d.userId,
          name: d.name,
          slug: d.slug,
          bio: d.bio,
          profileImageUrl: d.profileImageUrl,
          website: d.website,
          socialLinks: d.socialLinks,
          newsletterEmails: d.newsletterEmails || [],
          createdAt: convertTimestamp(d.createdAt),
          updatedAt: convertTimestamp(d.updatedAt),
        } as Artist;
      });
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setArtists(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load artists");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout
      title="Artists"
      action={
        <Button size="sm" onClick={() => router.push("/artists/new")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Artist
        </Button>
      }
    >
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-600">{error}</p>
          <button
            className="text-xs text-red-500 underline mt-1"
            onClick={() => userId && loadArtists(userId)}
          >
            Retry
          </button>
        </div>
      )}

      {artists.length === 0 && !error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <Users className="h-10 w-10 mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-400 mb-4">No artists yet.</p>
          <Button size="sm" onClick={() => router.push("/artists/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Artist
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square w-full bg-gray-100 flex items-center justify-center">
                {artist.profileImageUrl ? (
                  <img
                    src={artist.profileImageUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-10 w-10 text-gray-300" />
                )}
              </div>

              <div className="p-3">
                <p className="font-medium text-sm text-gray-900 truncate">{artist.name}</p>
                {artist.bio && (
                  <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{artist.bio}</p>
                )}

                <div className="flex items-center gap-1 mt-3">
                  <button
                    onClick={() => router.push(`/artist/${artist.id}`)}
                    className="flex-1 text-xs text-center py-1.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => router.push(`/artist/edit/${artist.id}`)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(artist.createdAt)}
                  {artist.newsletterEmails && artist.newsletterEmails.length > 0 && (
                    <> &middot; {artist.newsletterEmails.length} subscribers</>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
