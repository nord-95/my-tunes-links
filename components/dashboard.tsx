"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LinkForm from "@/components/link-form";
import LinkList from "@/components/link-list";
import ReleaseList from "@/components/release-list";
import { Link, Release } from "@/lib/types";
import { Plus, LogOut, Music } from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await Promise.all([loadLinks(user.uid), loadReleases(user.uid)]);
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadLinks = async (userId: string) => {
    try {
      const linksRef = collection(db, "links");
      const q = query(
        linksRef,
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const linksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Link[];
      setLinks(linksData);
    } catch (error: any) {
      // Silently handle index errors - index might still be building
      if (error.code === "failed-precondition" && error.message?.includes("index")) {
        console.log("Index is still building. Please wait a moment and refresh.");
        // Try loading without orderBy as fallback
        try {
          const linksRef = collection(db, "links");
          const q = query(linksRef, where("userId", "==", userId));
          const snapshot = await getDocs(q);
          const linksData = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })) as Link[];
          // Sort client-side as fallback
          linksData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setLinks(linksData);
        } catch (fallbackError) {
          console.error("Error loading links:", fallbackError);
        }
      } else {
        console.error("Error loading links:", error);
      }
    }
  };

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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">My Tunes</h1>
            <nav className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className={pathname === "/" ? "bg-accent" : ""}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/releases/new")}
              >
                <Music className="h-4 w-4 mr-2" />
                New Release
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/settings")}
              >
                Settings
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Manage your links and releases
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/releases/new")}>
              <Music className="h-4 w-4 mr-2" />
              Add Release
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Link
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Link</CardTitle>
              <CardDescription>
                Add a new link with music platform support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LinkForm
                onSuccess={() => {
                  setShowForm(false);
                  if (user) loadLinks(user.uid);
                }}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        )}

        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Releases</h3>
              <Button variant="outline" size="sm" onClick={() => router.push("/releases/new")}>
                <Music className="h-4 w-4 mr-2" />
                New Release
              </Button>
            </div>
            <ReleaseList releases={releases} onUpdate={user ? () => loadReleases(user.uid) : undefined} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Links</h3>
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Link
              </Button>
            </div>
            <LinkList links={links} onUpdate={user ? () => loadLinks(user.uid) : undefined} />
          </div>
        </div>
      </main>
    </div>
  );
}

