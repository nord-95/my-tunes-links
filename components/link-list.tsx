"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "@/lib/types";
import { getPlatformIcon } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { ExternalLink, Copy, Edit, Trash2, BarChart3 } from "lucide-react";
import LinkForm from "@/components/link-form";

interface LinkListProps {
  links: Link[];
  onUpdate?: () => void;
}

export default function LinkList({ links, onUpdate }: LinkListProps) {
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const toggleLinkStatus = async (link: Link) => {
    try {
      await updateDoc(doc(db, "links", link.id), {
        isActive: !link.isActive,
        updatedAt: new Date(),
      });
      toast({
        title: "Success",
        description: `Link ${link.isActive ? "deactivated" : "activated"}`,
      });
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update link",
        variant: "destructive",
      });
    }
  };

  const deleteLink = async (linkId: string) => {
    if (!confirm("Are you sure you want to delete this link?")) return;

    try {
      await deleteDoc(doc(db, "links", linkId));
      toast({
        title: "Success",
        description: "Link deleted successfully",
      });
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete link",
        variant: "destructive",
      });
    }
  };

  if (links.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No links yet. Create your first link to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {links.map((link) => {
        const linkUrl = typeof window !== "undefined" 
          ? `${window.location.origin}/${link.slug}`
          : `/${link.slug}`;

        return (
          <Card key={link.id} className={!link.isActive ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {link.title}
                    {!link.isActive && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {link.description || "No description"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingLink(link)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLink(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                  {linkUrl}
                </code>
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

              <div className="text-sm text-muted-foreground">
                <p>Destination: {link.destinationUrl}</p>
                <p>Clicks: {link.clicks || 0}</p>
                <p>Created: {formatDate(link.createdAt)}</p>
              </div>

              {link.musicLinks && link.musicLinks.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Music Platforms:</p>
                  <div className="flex flex-wrap gap-2">
                    {link.musicLinks.map((musicLink, index) => (
                      <a
                        key={index}
                        href={musicLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded text-sm hover:bg-secondary/80"
                      >
                        <span>{getPlatformIcon(musicLink.platform)}</span>
                        <span>{musicLink.platform}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLinkStatus(link)}
                >
                  {link.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/analytics/${link.id}`, "_blank")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {editingLink && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Link</CardTitle>
          </CardHeader>
          <CardContent>
            <LinkForm
              initialData={editingLink}
              onSuccess={() => {
                setEditingLink(null);
                onUpdate?.();
              }}
              onCancel={() => setEditingLink(null)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

