"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Link, Release } from "@/lib/types";
import { Plus, Music, BarChart3, ExternalLink, Copy, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const [links, setLinks] = useState<Link[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [totalLinks, setTotalLinks] = useState(0);
  const [totalReleases, setTotalReleases] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await Promise.all([loadLinks(user.uid), loadReleases(user.uid)]);
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadLinks = async (uid: string) => {
    try {
      const allQ = query(collection(db, "links"), where("userId", "==", uid));
      const allSnap = await getDocs(allQ);
      const allData = allSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Link[];
      allData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTotalLinks(allData.length);
      setTotalClicks(allData.reduce((sum, l) => sum + (l.clicks || 0), 0));
      setLinks(allData.slice(0, 5));
    } catch {
      // silently fail
    }
  };

  const loadReleases = async (uid: string) => {
    try {
      const q = query(collection(db, "releases"), where("userId", "==", uid));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Release[];
      data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTotalReleases(data.length);
      setReleases(data.slice(0, 5));
    } catch {
      // silently fail
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Link copied to clipboard" });
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
      title="Dashboard"
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => router.push("/releases/new")}>
            <Music className="h-4 w-4 mr-1.5" />
            New Release
          </Button>
          <Button size="sm" onClick={() => router.push("/links/new")}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Link
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Links</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalLinks}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Releases</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalReleases}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Clicks</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalClicks.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Links</h2>
            <button
              onClick={() => router.push("/links")}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {links.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">No links yet.</p>
              <Button size="sm" onClick={() => router.push("/links/new")}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Link
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {links.map((link) => {
                const url =
                  typeof window !== "undefined"
                    ? `${window.location.origin}/${link.slug}`
                    : `/${link.slug}`;
                return (
                  <li
                    key={link.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        /{link.slug} &middot; {link.clicks || 0} clicks
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        onClick={() => copyToClipboard(url)}
                        className="p-1.5 text-gray-300 hover:text-gray-600 rounded transition-colors"
                        title="Copy link"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/analytics/${link.id}`)}
                        className="p-1.5 text-gray-300 hover:text-gray-600 rounded transition-colors"
                        title="View analytics"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Releases</h2>
            <button
              onClick={() => router.push("/releases")}
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {releases.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">No releases yet.</p>
              <Button size="sm" onClick={() => router.push("/releases/new")}>
                <Music className="h-3.5 w-3.5 mr-1.5" />
                Create Release
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {releases.map((release) => {
                const url =
                  typeof window !== "undefined"
                    ? `${window.location.origin}/${release.slug}`
                    : `/${release.slug}`;
                return (
                  <li
                    key={release.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {release.artworkUrl && (
                      <img
                        src={release.artworkUrl}
                        alt=""
                        className="w-9 h-9 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {release.releaseName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {release.artistName} &middot; {release.views || 0} views
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => window.open(url, "_blank")}
                        className="p-1.5 text-gray-300 hover:text-gray-600 rounded transition-colors"
                        title="Open release page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/releases/analytics/${release.id}`)}
                        className="p-1.5 text-gray-300 hover:text-gray-600 rounded transition-colors"
                        title="View analytics"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
