 "use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function NotFound() {
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const settingsRef = doc(db, "settings", "app");
        const snap = await getDoc(settingsRef);
        const url = snap.exists() ? snap.data()?.notFoundRedirectUrl : null;
        if (isMounted) setCustomUrl(url && typeof url === "string" && url.trim() ? url.trim() : null);
      } catch {
        // ignore
      }
    })();
    return () => { isMounted = false; };
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription>Link not found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            The link you&apos;re looking for doesn&apos;t exist or has been deactivated.
          </p>
          {customUrl ? (
            <a href={customUrl}>
              <Button>Go Home</Button>
            </a>
          ) : (
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

