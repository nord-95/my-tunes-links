"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import AppLayout from "@/components/app-layout";
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
      try {
        const snap = await getDoc(doc(db, "settings", "app"));
        if (snap.exists()) {
          setNotFoundRedirectUrl(snap.data()?.notFoundRedirectUrl || "");
        }
      } catch {}
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const settingsRef = doc(db, "settings", "app");
      const snap = await getDoc(settingsRef);
      const data = { notFoundRedirectUrl: notFoundRedirectUrl.trim() };
      if (snap.exists()) {
        await updateDoc(settingsRef, data);
      } else {
        await setDoc(settingsRef, data);
      }
      toast({ title: "Saved", description: "Settings updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  return (
    <AppLayout title="Settings">
      <div className="max-w-lg">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Application</h2>
            <p className="text-xs text-gray-400 mt-0.5">Global settings for your workspace</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notFoundRedirectUrl">404 Redirect URL</Label>
            <Input
              id="notFoundRedirectUrl"
              placeholder="https://example.com"
              value={notFoundRedirectUrl}
              onChange={(e) => setNotFoundRedirectUrl(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              Where to redirect users when a link is not found or inactive. Leave empty to show the built-in 404 page.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            {notFoundRedirectUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(notFoundRedirectUrl, "_blank")}
              >
                Test URL
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
