"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Release } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ExternalLink, Copy, Edit, Trash2, Eye, Music, BarChart3, X } from "lucide-react";
import ReleaseForm from "@/components/release-form";

interface ReleaseListProps {
  releases: Release[];
  onUpdate?: () => void;
}

export default function ReleaseList({ releases, onUpdate }: ReleaseListProps) {
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const toggleReleaseStatus = async (release: Release) => {
    try {
      await updateDoc(doc(db, "releases", release.id), {
        isActive: !release.isActive,
        updatedAt: new Date(),
      });
      toast({
        title: "Success",
        description: `Release ${release.isActive ? "deactivated" : "activated"}`,
      });
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update release",
        variant: "destructive",
      });
    }
  };

  const deleteRelease = async (releaseId: string) => {
    if (!confirm("Are you sure you want to delete this release?")) return;

    try {
      await deleteDoc(doc(db, "releases", releaseId));
      toast({
        title: "Success",
        description: "Release deleted successfully",
      });
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete release",
        variant: "destructive",
      });
    }
  };

  if (releases.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No releases yet. Create your first release to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {releases.map((release) => {
        const releaseUrl = typeof window !== "undefined" 
          ? `${window.location.origin}/r/${release.slug}`
          : `/r/${release.slug}`;

        return (
          <Card key={release.id} className={!release.isActive ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    {release.artistName} - {release.releaseName}
                    {!release.isActive && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {release.releaseType}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingRelease(release);
                      // Scroll to form after a brief delay to ensure it's rendered
                      setTimeout(() => {
                        const formElement = document.querySelector('[data-release-form]');
                        if (formElement) {
                          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRelease(release.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {release.artworkUrl && (
                <div className="w-full max-w-xs">
                  <img
                    src={release.artworkUrl}
                    alt={`${release.artistName} - ${release.releaseName}`}
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-sm">
                  {releaseUrl}
                </code>
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

              <div className="text-sm text-muted-foreground">
                <p>Views: {release.views || 0}</p>
                <p>Created: {formatDate(release.createdAt)}</p>
              </div>

              {release.musicLinks && release.musicLinks.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Music Platforms ({release.musicLinks.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {release.musicLinks.map((musicLink, index) => (
                      <a
                        key={index}
                        href={musicLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded text-sm hover:bg-secondary/80"
                      >
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
                  onClick={() => toggleReleaseStatus(release)}
                >
                  {release.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(releaseUrl, "_blank")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Page
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/releases/analytics/${release.id}`, "_blank")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {editingRelease && (
        <Card data-release-form className="border-primary">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Edit Release</CardTitle>
                <CardDescription>
                  Editing: {editingRelease.artistName} - {editingRelease.releaseName}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRelease(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ReleaseForm
              initialData={editingRelease}
              onSuccess={() => {
                setEditingRelease(null);
                onUpdate?.();
              }}
              onCancel={() => setEditingRelease(null)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

