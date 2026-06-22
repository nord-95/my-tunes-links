"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import AppLayout from "@/components/app-layout";
import LinkList from "@/components/link-list";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/types";
import { Plus } from "lucide-react";

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        await loadLinks(user.uid);
      } else {
        router.push("/auth");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadLinks = async (uid: string) => {
    try {
      const q = query(
        collection(db, "links"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Link[];
      setLinks(data);
    } catch (error: any) {
      if (error.code === "failed-precondition") {
        try {
          const q = query(collection(db, "links"), where("userId", "==", uid));
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as Link[];
          data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          setLinks(data);
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
      title="Links"
      action={
        <Button size="sm" onClick={() => router.push("/links/new")}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Link
        </Button>
      }
    >
      <LinkList links={links} onUpdate={userId ? () => loadLinks(userId) : undefined} />
    </AppLayout>
  );
}
