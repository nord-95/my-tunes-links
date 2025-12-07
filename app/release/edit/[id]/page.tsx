"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Release } from "@/lib/types";
import ReleaseForm from "@/components/release-form";
import { ArrowLeft } from "lucide-react";

export default function EditReleasePage() {
  const params = useParams();
  const router = useRouter();
  const releaseId = params.id as string;
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadRelease = useCallback(async () => {
    if (!releaseId || !user) return;
    
    try {
      const releaseRef = doc(db, "releases", releaseId);
      const releaseDoc = await getDoc(releaseRef);
      
      if (releaseDoc.exists()) {
        const data = releaseDoc.data();
        const releaseData: Release = {
          id: releaseDoc.id,
          userId: data.userId,
          artistName: data.artistName,
          releaseName: data.releaseName,
          artworkUrl: data.artworkUrl,
          artistLogoUrl: data.artistLogoUrl,
          releaseType: data.releaseType,
          slug: data.slug,
          musicLinks: data.musicLinks,
          views: data.views || 0,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          ogTitle: data.ogTitle,
          ogDescription: data.ogDescription,
          ogImage: data.ogImage,
          ogType: data.ogType,
          ogSiteName: data.ogSiteName,
          twitterCard: data.twitterCard,
          twitterTitle: data.twitterTitle,
          twitterDescription: data.twitterDescription,
          twitterImage: data.twitterImage,
          siteIconUrl: data.siteIconUrl,
        };
        
        // Check if user owns this release
        if (releaseData.userId !== user.uid) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to edit this release",
            variant: "destructive",
          });
          router.push("/");
          return;
        }
        
        setRelease(releaseData);
      } else {
        toast({
          title: "Release Not Found",
          description: "The release you're looking for doesn't exist",
          variant: "destructive",
        });
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error loading release:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load release",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [releaseId, user, router, toast]);

  useEffect(() => {
    if (user) {
      loadRelease();
    }
  }, [user, loadRelease]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading release...</div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Release not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/release/${release.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Release
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Release</CardTitle>
            <CardDescription>
              Editing: {release.artistName} - {release.releaseName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReleaseForm
              initialData={release}
              onSuccess={() => {
                router.push(`/release/${release.id}`);
              }}
              onCancel={() => {
                router.push(`/release/${release.id}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

