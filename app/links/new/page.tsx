"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import AppLayout from "@/components/app-layout";
import LinkForm from "@/components/link-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewLinkPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading || !user) return null;

  return (
    <AppLayout
      title="New Link"
      action={
        <Button size="sm" variant="outline" onClick={() => router.push("/links")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      }
    >
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <LinkForm
            onSuccess={() => router.push("/links")}
            onCancel={() => router.push("/links")}
          />
        </div>
      </div>
    </AppLayout>
  );
}
