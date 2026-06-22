"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Release } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { BarChart3, Edit, ExternalLink, Plus, Music } from "lucide-react";

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        await loadReleases(currentUser.uid);
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadReleases = async (uid: string) => {
    try {
      const q = query(
        collection(db, "releases"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Release[];
      setReleases(data);
    } catch (error: any) {
      if (error.code === "failed-precondition") {
        try {
          const q = query(collection(db, "releases"), where("userId", "==", uid));
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Release[];
          data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setReleases(data);
        } catch {}
      }
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
      title="Releases"
      action={
        <Button size="sm" onClick={() => router.push("/releases/new")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Release
        </Button>
      }
    >
      {releases.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <Music className="h-10 w-10 mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-400 mb-4">No releases yet.</p>
          <Button size="sm" onClick={() => router.push("/releases/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Release
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {releases.map((release) => {
            const releaseUrl =
              typeof window !== "undefined"
                ? `${window.location.origin}/${release.slug}`
                : `/${release.slug}`;

            return (
              <div
                key={release.id}
                className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${
                  !release.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="relative aspect-square w-full bg-gray-100">
                  <img
                    src={release.artworkUrl}
                    alt={`${release.artistName} - ${release.releaseName}`}
                    className="w-full h-full object-cover"
                  />
                  {!release.isActive && (
                    <div className="absolute top-2 right-2 bg-white/90 text-gray-600 text-xs px-2 py-0.5 rounded">
                      Inactive
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <p className="font-medium text-sm text-gray-900 truncate">{release.releaseName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{release.artistName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{release.releaseType}</p>

                  <div className="flex items-center gap-1 mt-3">
                    <button
                      onClick={() => router.push(`/release/${release.id}`)}
                      className="flex-1 text-xs text-center py-1.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => router.push(`/release/edit/${release.id}`)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => window.open(releaseUrl, "_blank")}
                      className="p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded transition-colors"
                      title="Open page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => router.push(`/releases/analytics/${release.id}`)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 border border-gray-200 rounded transition-colors"
                      title="Analytics"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-2">{release.views || 0} views &middot; {formatDate(release.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
