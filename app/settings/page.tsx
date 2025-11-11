"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFoundRedirectUrl, setNotFoundRedirectUrl] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);
      // Load settings
      try {
        const settingsRef = doc(db, "settings", "app");
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          setNotFoundRedirectUrl(snap.data()?.notFoundRedirectUrl || "");
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const settingsRef = doc(db, "settings", "app");
      const snap = await getDoc(settingsRef);
      const data: any = {};
      if (notFoundRedirectUrl && notFoundRedirectUrl.trim()) {
        data.notFoundRedirectUrl = notFoundRedirectUrl.trim();
      } else {
        data.notFoundRedirectUrl = "";
      }
      if (snap.exists()) {
        await updateDoc(settingsRef, data);
      } else {
        await setDoc(settingsRef, data);
      }
      toast({ title: "Saved", description: "Settings updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Control global app behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notFoundRedirectUrl">404 Redirect URL</Label>
              <Input
                id="notFoundRedirectUrl"
                placeholder="https://example.com"
                value={notFoundRedirectUrl}
                onChange={(e) => setNotFoundRedirectUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If a link is not found or is inactive, users will be redirected here. Leave empty to show the built-in 404 page.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
              {notFoundRedirectUrl && (
                <Button type="button" variant="outline" onClick={() => window.open(notFoundRedirectUrl, "_blank")}>
                  Open Redirect URL
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


