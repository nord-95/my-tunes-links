"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link as LinkType } from "@/lib/types";
import LinkForm from "@/components/link-form";
import AppLayout from "@/components/app-layout";
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
    <AppLayout
      title={`Edit: ${link.title}`}
      action={
        <Button size="sm" variant="outline" onClick={() => router.push(`/link/${link.id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      }
    >
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <LinkForm
            initialData={link}
            onSuccess={() => router.push(`/link/${link.id}`)}
            onCancel={() => router.push(`/link/${link.id}`)}
          />
        </div>
      </div>
    </AppLayout>
  );
}

