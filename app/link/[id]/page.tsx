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
import { Link as LinkType } from "@/lib/types";
import { formatDate, getPlatformIcon } from "@/lib/utils";
import LinkForm from "@/components/link-form";
import { 
  ExternalLink, 
  Copy, 
  Edit, 
  Trash2, 
  BarChart3, 
  Link as LinkIcon,
  Calendar,
  Eye,
  Tag,
  Globe,
  Image as ImageIcon,
  Settings
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

export default function LinkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.id as string;
  const [link, setLink] = useState<LinkType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
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
    if (!linkId) return;
    
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
        if (user && linkData.userId !== user.uid) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this link",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const deleteLink = async () => {
    if (!link) return;
    if (!confirm("Are you sure you want to delete this link? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "links", link.id));
      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  const getLinkUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/${link?.slug}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading link details...</div>
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

  const linkUrl = getLinkUrl();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{link.title}</h1>
            {link.description && (
              <p className="text-muted-foreground mt-2">{link.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/analytics/${link.id}`)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={editing ? "secondary" : "default"}
              onClick={() => setEditing(!editing)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {editing ? "Cancel Edit" : "Edit Link"}
            </Button>
            <Button
              variant="destructive"
              onClick={deleteLink}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Link</CardTitle>
              <CardDescription>Update your link details</CardDescription>
            </CardHeader>
            <CardContent>
              <LinkForm
                initialData={link}
                onSuccess={() => {
                  setEditing(false);
                  loadLink();
                }}
                onCancel={() => setEditing(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{link.clicks || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant={link.isActive ? "default" : "secondary"}>
                    {link.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{formatDate(link.createdAt)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{formatDate(link.updatedAt)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Link URLs */}
            <Card>
              <CardHeader>
                <CardTitle>Link URLs</CardTitle>
                <CardDescription>Your short link and destination</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Short Link
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={linkUrl}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(linkUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(linkUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Destination URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={link.destinationUrl}
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(link.destinationUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(link.destinationUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Music Links */}
            {link.musicLinks && link.musicLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Music Platform Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {link.musicLinks.map((musicLink, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border rounded hover:bg-accent transition-colors"
                      >
                        <span className="text-2xl">
                          {getPlatformIcon(musicLink.platform)}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium capitalize">
                            {musicLink.platform.replace("-", " ")}
                          </p>
                          {musicLink.title && (
                            <p className="text-sm text-muted-foreground">
                              {musicLink.title}
                            </p>
                          )}
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

            {/* Metadata */}
            {(link.tags?.length || link.category || link.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {link.tags && link.tags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4" />
                        Tags
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {link.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {link.category && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Category</Label>
                      <Badge variant="outline">{link.category}</Badge>
                    </div>
                  )}
                  {link.notes && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Internal Notes</Label>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {link.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Internal UTM Parameters */}
            {(link.internalUtmSource || link.internalUtmMedium || link.internalUtmCampaign || 
              link.internalUtmContent || link.internalUtmTerm) && (
              <Card>
                <CardHeader>
                  <CardTitle>Internal UTM Parameters</CardTitle>
                  <CardDescription>Used for internal tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {link.internalUtmSource && (
                      <div>
                        <Label className="text-sm font-medium">Source</Label>
                        <p className="text-sm">{link.internalUtmSource}</p>
                      </div>
                    )}
                    {link.internalUtmMedium && (
                      <div>
                        <Label className="text-sm font-medium">Medium</Label>
                        <p className="text-sm">{link.internalUtmMedium}</p>
                      </div>
                    )}
                    {link.internalUtmCampaign && (
                      <div>
                        <Label className="text-sm font-medium">Campaign</Label>
                        <p className="text-sm">{link.internalUtmCampaign}</p>
                      </div>
                    )}
                    {link.internalUtmContent && (
                      <div>
                        <Label className="text-sm font-medium">Content</Label>
                        <p className="text-sm">{link.internalUtmContent}</p>
                      </div>
                    )}
                    {link.internalUtmTerm && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Term</Label>
                        <p className="text-sm">{link.internalUtmTerm}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Open Graph Metadata */}
            {(link.ogTitle || link.ogDescription || link.ogImage || link.ogType || 
              link.ogSiteName || link.twitterCard || link.twitterTitle || 
              link.twitterDescription || link.twitterImage) && (
              <Card>
                <CardHeader>
                  <CardTitle>Open Graph & Social Media Metadata</CardTitle>
                  <CardDescription>How your link appears when shared</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {link.ogTitle && (
                      <div>
                        <Label className="text-sm font-medium">OG Title</Label>
                        <p className="text-sm">{link.ogTitle}</p>
                      </div>
                    )}
                    {link.ogType && (
                      <div>
                        <Label className="text-sm font-medium">OG Type</Label>
                        <p className="text-sm">{link.ogType}</p>
                      </div>
                    )}
                    {link.ogDescription && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">OG Description</Label>
                        <p className="text-sm text-muted-foreground">{link.ogDescription}</p>
                      </div>
                    )}
                    {link.ogImage && (
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                          <ImageIcon className="h-4 w-4" />
                          OG Image
                        </Label>
                        <div className="flex items-center gap-2">
                          <img
                            src={link.ogImage}
                            alt="OG Image"
                            className="w-32 h-32 object-cover rounded border"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-mono break-all">{link.ogImage}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(link.ogImage, "_blank")}
                              className="mt-2"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Full Image
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    {link.ogSiteName && (
                      <div>
                        <Label className="text-sm font-medium">OG Site Name</Label>
                        <p className="text-sm">{link.ogSiteName}</p>
                      </div>
                    )}
                  </div>

                  {/* Twitter Card */}
                  {(link.twitterCard || link.twitterTitle || link.twitterDescription || link.twitterImage) && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold mb-3">Twitter Card</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {link.twitterCard && (
                          <div>
                            <Label className="text-sm font-medium">Card Type</Label>
                            <p className="text-sm">{link.twitterCard}</p>
                          </div>
                        )}
                        {link.twitterTitle && (
                          <div>
                            <Label className="text-sm font-medium">Twitter Title</Label>
                            <p className="text-sm">{link.twitterTitle}</p>
                          </div>
                        )}
                        {link.twitterDescription && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium">Twitter Description</Label>
                            <p className="text-sm text-muted-foreground">{link.twitterDescription}</p>
                          </div>
                        )}
                        {link.twitterImage && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                              <ImageIcon className="h-4 w-4" />
                              Twitter Image
                            </Label>
                            <div className="flex items-center gap-2">
                              <img
                                src={link.twitterImage}
                                alt="Twitter Image"
                                className="w-32 h-32 object-cover rounded border"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-mono break-all">{link.twitterImage}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(link.twitterImage, "_blank")}
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
          </>
        )}
      </div>
    </div>
  );
}

