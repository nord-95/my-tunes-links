"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link as LinkType } from "@/lib/types";
import LinkForm from "@/components/link-form";
import { ArrowLeft } from "lucide-react";

export default function EditLinkPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.id as string;
  const [link, setLink] = useState<LinkType | null>(null);
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

  const loadLink = useCallback(async () => {
    if (!linkId || !user) return;
    
    try {
      const linkRef = doc(db, "links", linkId);
      const linkDoc = await getDoc(linkRef);
      
      if (linkDoc.exists()) {
        const data = linkDoc.data();
        const linkData: LinkType = {
          id: linkDoc.id,
          userId: data.userId,
          slug: data.slug,
          title: data.title,
          description: data.description,
          destinationUrl: data.destinationUrl,
          musicLinks: data.musicLinks,
          thumbnailUrl: data.thumbnailUrl,
          clicks: data.clicks || 0,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          tags: data.tags,
          category: data.category,
          notes: data.notes,
          internalUtmSource: data.internalUtmSource,
          internalUtmMedium: data.internalUtmMedium,
          internalUtmCampaign: data.internalUtmCampaign,
          internalUtmContent: data.internalUtmContent,
          internalUtmTerm: data.internalUtmTerm,
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
        
        // Check if user owns this link
        if (linkData.userId !== user.uid) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to edit this link",
            variant: "destructive",
          });
          router.push("/");
          return;
        }
        
        setLink(linkData);
      } else {
        toast({
          title: "Link Not Found",
          description: "The link you're looking for doesn't exist",
          variant: "destructive",
        });
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error loading link:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [linkId, user, router, toast]);

  useEffect(() => {
    if (user) {
      loadLink();
    }
  }, [user, loadLink]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading link...</div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Link not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/link/${link.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Link
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Link</CardTitle>
            <CardDescription>
              Editing: {link.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkForm
              initialData={link}
              onSuccess={() => {
                router.push(`/link/${link.id}`);
              }}
              onCancel={() => {
                router.push(`/link/${link.id}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

