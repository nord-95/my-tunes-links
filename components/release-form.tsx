"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { generateSlug } from "@/lib/utils";
import { MusicPlatform, MusicLink, ReleaseType } from "@/lib/types";
import { Plus, X } from "lucide-react";

const releaseSchema = z.object({
  artistName: z.string().min(1, "Artist name is required"),
  releaseName: z.string().min(1, "Release name is required"),
  artworkUrl: z.string().url("Must be a valid URL").min(1, "Artwork URL is required"),
  artistLogoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  releaseType: z.string().min(1, "Release type is required"),
  customReleaseType: z.string().optional(),
  slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
  // Open Graph / Social Media Metadata
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  ogType: z.string().optional(),
  ogSiteName: z.string().optional(),
  twitterCard: z.string().optional(),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  siteIconUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ReleaseFormData = z.infer<typeof releaseSchema>;

interface ReleaseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
}

const RELEASE_TYPES: ReleaseType[] = [
  "Single",
  "EP",
  "Album",
  "Playlist",
  "Live Version",
  "Music Video",
];

const MUSIC_PLATFORMS: MusicPlatform[] = [
  "spotify",
  "apple-music",
  "youtube-music",
  "soundcloud",
  "deezer",
  "tidal",
  "amazon-music",
  "pandora",
];

export default function ReleaseForm({ onSuccess, onCancel, initialData }: ReleaseFormProps) {
  const [musicLinks, setMusicLinks] = useState<MusicLink[]>(
    initialData?.musicLinks || []
  );
  const [newMusicLink, setNewMusicLink] = useState<{
    platform: MusicPlatform;
    url: string;
    title: string;
  }>({
    platform: "spotify",
    url: "",
    title: "",
  });
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ReleaseFormData>({
    resolver: zodResolver(releaseSchema),
    defaultValues: initialData ? {
      artistName: initialData.artistName || "",
      releaseName: initialData.releaseName || "",
      artworkUrl: initialData.artworkUrl || "",
      artistLogoUrl: initialData.artistLogoUrl || "",
      releaseType: initialData.releaseType || "Single",
      customReleaseType: RELEASE_TYPES.includes(initialData.releaseType) ? "" : initialData.releaseType || "",
      slug: initialData.slug || "",
      ogTitle: initialData.ogTitle || "",
      ogDescription: initialData.ogDescription || "",
      ogImage: initialData.ogImage || "",
      ogType: initialData.ogType || "",
      ogSiteName: initialData.ogSiteName || "",
      twitterCard: initialData.twitterCard || "",
      twitterTitle: initialData.twitterTitle || "",
      twitterDescription: initialData.twitterDescription || "",
      twitterImage: initialData.twitterImage || "",
      siteIconUrl: initialData.siteIconUrl || "",
    } : {
      artistName: "",
      releaseName: "",
      artworkUrl: "",
      artistLogoUrl: "",
      releaseType: "Single",
      customReleaseType: "",
      slug: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogType: "",
      ogSiteName: "",
      twitterCard: "",
      twitterTitle: "",
      twitterDescription: "",
      twitterImage: "",
      siteIconUrl: "",
    },
  });

  const releaseType = watch("releaseType");
  const slug = watch("slug");

  const generateRandomSlug = () => {
    setValue("slug", generateSlug(8));
  };

  const addMusicLink = () => {
    if (!newMusicLink.url) {
      toast({
        title: "Error",
        description: "Please enter a URL for the music link",
        variant: "destructive",
      });
      return;
    }

    setMusicLinks([
      ...musicLinks,
      {
        platform: newMusicLink.platform,
        url: newMusicLink.url,
        title: newMusicLink.title || undefined,
      },
    ]);
    setNewMusicLink({ platform: "spotify", url: "", title: "" });
  };

  const removeMusicLink = (index: number) => {
    setMusicLinks(musicLinks.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ReleaseFormData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a release",
          variant: "destructive",
        });
        return;
      }

      // Determine final release type
      const finalReleaseType = data.releaseType === "Custom" && data.customReleaseType
        ? data.customReleaseType.trim()
        : data.releaseType;

      const releaseData: any = {
        userId: user.uid,
        artistName: data.artistName.trim(),
        releaseName: data.releaseName.trim(),
        artworkUrl: data.artworkUrl.trim(),
        releaseType: finalReleaseType,
        slug: data.slug || generateSlug(8),
        views: initialData?.views || 0,
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
        createdAt: initialData?.createdAt ? (initialData.createdAt instanceof Date ? Timestamp.fromDate(initialData.createdAt) : initialData.createdAt) : Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Add artist logo if provided
      if (data.artistLogoUrl && data.artistLogoUrl.trim()) {
        releaseData.artistLogoUrl = data.artistLogoUrl.trim();
      }

      // Only include musicLinks if there are any
      if (musicLinks.length > 0) {
        releaseData.musicLinks = musicLinks;
      }

      // Add Open Graph / Social Media Metadata
      if (data.ogTitle && data.ogTitle.trim()) {
        releaseData.ogTitle = data.ogTitle.trim();
      }
      if (data.ogDescription && data.ogDescription.trim()) {
        releaseData.ogDescription = data.ogDescription.trim();
      }
      if (data.ogImage && data.ogImage.trim()) {
        releaseData.ogImage = data.ogImage.trim();
      }
      if (data.ogType && data.ogType.trim()) {
        releaseData.ogType = data.ogType.trim();
      }
      if (data.ogSiteName && data.ogSiteName.trim()) {
        releaseData.ogSiteName = data.ogSiteName.trim();
      }
      if (data.twitterCard && data.twitterCard.trim()) {
        releaseData.twitterCard = data.twitterCard.trim();
      }
      if (data.twitterTitle && data.twitterTitle.trim()) {
        releaseData.twitterTitle = data.twitterTitle.trim();
      }
      if (data.twitterDescription && data.twitterDescription.trim()) {
        releaseData.twitterDescription = data.twitterDescription.trim();
      }
      if (data.twitterImage && data.twitterImage.trim()) {
        releaseData.twitterImage = data.twitterImage.trim();
      }
      if (data.siteIconUrl && data.siteIconUrl.trim()) {
        releaseData.siteIconUrl = data.siteIconUrl.trim();
      }

      if (initialData) {
        // Don't update createdAt on edit
        const { createdAt, ...updateData } = releaseData;
        await updateDoc(doc(db, "releases", initialData.id), updateData);
        toast({
          title: "Success",
          description: "Release updated successfully",
        });
      } else {
        await addDoc(collection(db, "releases"), releaseData);
        toast({
          title: "Success",
          description: "Release created successfully",
        });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save release",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="artistName">Artist Name *</Label>
        <Input
          id="artistName"
          {...register("artistName")}
          placeholder="Ryan Miller"
        />
        {errors.artistName && (
          <p className="text-sm text-destructive">{errors.artistName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="releaseName">Release Name *</Label>
        <Input
          id="releaseName"
          {...register("releaseName")}
          placeholder="My New Single"
        />
        {errors.releaseName && (
          <p className="text-sm text-destructive">{errors.releaseName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="artworkUrl">Artwork URL *</Label>
        <Input
          id="artworkUrl"
          {...register("artworkUrl")}
          placeholder="https://example.com/artwork.jpg"
        />
        {errors.artworkUrl && (
          <p className="text-sm text-destructive">{errors.artworkUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="artistLogoUrl">Artist Logo URL (Optional)</Label>
        <Input
          id="artistLogoUrl"
          {...register("artistLogoUrl")}
          placeholder="https://example.com/logo.png"
        />
        {errors.artistLogoUrl && (
          <p className="text-sm text-destructive">{errors.artistLogoUrl.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          If not provided, artist name will be displayed instead
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="releaseType">Release Type *</Label>
        <select
          id="releaseType"
          {...register("releaseType")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {RELEASE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
          <option value="Custom">Custom</option>
        </select>
        {errors.releaseType && (
          <p className="text-sm text-destructive">{errors.releaseType.message}</p>
        )}
      </div>

      {releaseType === "Custom" && (
        <div className="space-y-2">
          <Label htmlFor="customReleaseType">Custom Release Type *</Label>
          <Input
            id="customReleaseType"
            {...register("customReleaseType")}
            placeholder="Enter custom release type"
          />
          {errors.customReleaseType && (
            <p className="text-sm text-destructive">{errors.customReleaseType.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="slug"
            {...register("slug")}
            placeholder="auto-generated"
          />
          <Button type="button" variant="outline" onClick={generateRandomSlug}>
            Generate
          </Button>
        </div>
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          URL-friendly identifier. If left empty, a random slug will be generated.
        </p>
      </div>

      <div className="space-y-4">
        <Label>Music Streaming URLs</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={newMusicLink.platform}
              onChange={(e) =>
                setNewMusicLink({ ...newMusicLink, platform: e.target.value as MusicPlatform })
              }
              className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {MUSIC_PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
            <Input
              value={newMusicLink.url}
              onChange={(e) =>
                setNewMusicLink({ ...newMusicLink, url: e.target.value })
              }
              placeholder="https://open.spotify.com/..."
              className="flex-1"
            />
            <Button type="button" onClick={addMusicLink}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {musicLinks.length > 0 && (
            <div className="space-y-2">
              {musicLinks.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <span className="text-sm font-medium capitalize flex-1">
                    {link.platform.replace("-", " ")}: {link.url}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMusicLink(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold">Meta Fields (Open Graph & Social Media)</h3>
        
        <div className="space-y-2">
          <Label htmlFor="ogTitle">OG Title</Label>
          <Input
            id="ogTitle"
            {...register("ogTitle")}
            placeholder="Defaults to: {Artist Name} - {Release Name}"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ogDescription">OG Description</Label>
          <Input
            id="ogDescription"
            {...register("ogDescription")}
            placeholder="Description for social media previews"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ogImage">OG Image URL</Label>
          <Input
            id="ogImage"
            {...register("ogImage")}
            placeholder="https://example.com/og-image.jpg"
          />
          {errors.ogImage && (
            <p className="text-sm text-destructive">{errors.ogImage.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ogType">OG Type</Label>
          <Input
            id="ogType"
            {...register("ogType")}
            placeholder="music.song, music.album, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ogSiteName">OG Site Name</Label>
          <Input
            id="ogSiteName"
            {...register("ogSiteName")}
            placeholder="My Tunes"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitterCard">Twitter Card Type</Label>
          <select
            id="twitterCard"
            {...register("twitterCard")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select...</option>
            <option value="summary">Summary</option>
            <option value="summary_large_image">Summary Large Image</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitterTitle">Twitter Title</Label>
          <Input
            id="twitterTitle"
            {...register("twitterTitle")}
            placeholder="Defaults to OG Title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitterDescription">Twitter Description</Label>
          <Input
            id="twitterDescription"
            {...register("twitterDescription")}
            placeholder="Defaults to OG Description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitterImage">Twitter Image URL</Label>
          <Input
            id="twitterImage"
            {...register("twitterImage")}
            placeholder="https://example.com/twitter-image.jpg"
          />
          {errors.twitterImage && (
            <p className="text-sm text-destructive">{errors.twitterImage.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="siteIconUrl">Site Icon URL</Label>
          <Input
            id="siteIconUrl"
            {...register("siteIconUrl")}
            placeholder="https://example.com/favicon.png"
          />
          {errors.siteIconUrl && (
            <p className="text-sm text-destructive">{errors.siteIconUrl.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update Release" : "Create Release"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

