"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Release } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { 
  ExternalLink, 
  Copy, 
  Edit, 
  Trash2, 
  BarChart3, 
  Music,
  Calendar,
  Eye,
  Image as ImageIcon,
  Globe
} from "lucide-react";

// Badge component - simple inline implementation
const Badge = ({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: "default" | "secondary" | "outline"; className?: string }) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-input bg-background",
  };
  return <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</span>;
};

export default function ReleaseDetailsPage() {
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
    if (!releaseId) return;
    
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
        if (user && releaseData.userId !== user.uid) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this release",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const deleteRelease = async () => {
    if (!release) return;
    if (!confirm("Are you sure you want to delete this release? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "releases", release.id));
      toast({
        title: "Success",
        description: "Release deleted successfully",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete release",
        variant: "destructive",
      });
    }
  };

  const getReleaseUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/${release?.slug}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading release details...</div>
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

  const releaseUrl = getReleaseUrl();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{release.artistName} - {release.releaseName}</h1>
            <p className="text-muted-foreground mt-2">{release.releaseType}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/releases/analytics/${release.id}`)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant="default"
              onClick={() => router.push(`/release/edit/${release.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Release
            </Button>
            <Button
              variant="destructive"
              onClick={deleteRelease}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{release.views || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={release.isActive ? "default" : "secondary"}>
                {release.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{formatDate(release.createdAt)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{formatDate(release.updatedAt)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Release URL */}
        <Card>
          <CardHeader>
            <CardTitle>Release URL</CardTitle>
            <CardDescription>Your release landing page link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Release Page Link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={releaseUrl}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(releaseUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(releaseUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Artwork */}
        {release.artworkUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Artwork</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  src={release.artworkUrl}
                  alt={`${release.artistName} - ${release.releaseName}`}
                  className="w-48 h-48 object-cover rounded-lg border"
                />
                <div className="flex-1">
                  <p className="text-sm font-mono break-all mb-2">{release.artworkUrl}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(release.artworkUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Artist Logo */}
        {release.artistLogoUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Artist Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img
                  src={release.artistLogoUrl}
                  alt={`${release.artistName} Logo`}
                  className="w-32 h-32 object-contain rounded-lg border"
                />
                <div className="flex-1">
                  <p className="text-sm font-mono break-all mb-2">{release.artistLogoUrl}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(release.artistLogoUrl, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Image
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Music Links */}
        {release.musicLinks && release.musicLinks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Music Platform Links</CardTitle>
              <CardDescription>{release.musicLinks.length} platform(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {release.musicLinks.map((musicLink, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium capitalize">
                        {musicLink.platform.replace("-", " ")}
                      </p>
                      {musicLink.title && (
                        <p className="text-sm text-muted-foreground">
                          {musicLink.title}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono truncate mt-1">
                        {musicLink.url}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(musicLink.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Open Graph Metadata */}
        {(release.ogTitle || release.ogDescription || release.ogImage || release.ogType || 
          release.ogSiteName || release.twitterCard || release.twitterTitle || 
          release.twitterDescription || release.twitterImage) && (
          <Card>
            <CardHeader>
              <CardTitle>Open Graph & Social Media Metadata</CardTitle>
              <CardDescription>How your release appears when shared</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {release.ogTitle && (
                  <div>
                    <Label className="text-sm font-medium">OG Title</Label>
                    <p className="text-sm">{release.ogTitle}</p>
                  </div>
                )}
                {release.ogType && (
                  <div>
                    <Label className="text-sm font-medium">OG Type</Label>
                    <p className="text-sm">{release.ogType}</p>
                  </div>
                )}
                {release.ogDescription && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">OG Description</Label>
                    <p className="text-sm text-muted-foreground">{release.ogDescription}</p>
                  </div>
                )}
                {release.ogImage && (
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4" />
                      OG Image
                    </Label>
                    <div className="flex items-center gap-2">
                      <img
                        src={release.ogImage}
                        alt="OG Image"
                        className="w-32 h-32 object-cover rounded border"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-mono break-all">{release.ogImage}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(release.ogImage, "_blank")}
                          className="mt-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Full Image
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {release.ogSiteName && (
                  <div>
                    <Label className="text-sm font-medium">OG Site Name</Label>
                    <p className="text-sm">{release.ogSiteName}</p>
                  </div>
                )}
              </div>

              {/* Twitter Card */}
              {(release.twitterCard || release.twitterTitle || release.twitterDescription || release.twitterImage) && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold mb-3">Twitter Card</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {release.twitterCard && (
                      <div>
                        <Label className="text-sm font-medium">Card Type</Label>
                        <p className="text-sm">{release.twitterCard}</p>
                      </div>
                    )}
                    {release.twitterTitle && (
                      <div>
                        <Label className="text-sm font-medium">Twitter Title</Label>
                        <p className="text-sm">{release.twitterTitle}</p>
                      </div>
                    )}
                    {release.twitterDescription && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Twitter Description</Label>
                        <p className="text-sm text-muted-foreground">{release.twitterDescription}</p>
                      </div>
                    )}
                    {release.twitterImage && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4" />
                          Twitter Image
                        </Label>
                        <div className="flex items-center gap-2">
                          <img
                            src={release.twitterImage}
                            alt="Twitter Image"
                            className="w-32 h-32 object-cover rounded border"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-mono break-all">{release.twitterImage}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(release.twitterImage, "_blank")}
                              className="mt-2"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Full Image
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

