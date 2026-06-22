"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { ImageInput } from "@/components/image-input";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { generateSlug } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MusicPlatform, MusicLink } from "@/lib/types";
import { Plus, X, ChevronDown, RefreshCw } from "lucide-react";

const linkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  destinationUrl: z.string().url("Must be a valid URL"),
  slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
  tags: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  internalUtmSource: z.string().optional(),
  internalUtmMedium: z.string().optional(),
  internalUtmCampaign: z.string().optional(),
  internalUtmContent: z.string().optional(),
  internalUtmTerm: z.string().optional(),
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

type LinkFormData = z.infer<typeof linkSchema>;

interface LinkFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
}

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

function Section({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div>
          <span className="text-sm font-medium text-gray-900">{title}</span>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform shrink-0 ml-4",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

export default function LinkForm({ onSuccess, onCancel, initialData }: LinkFormProps) {
  const [musicLinks, setMusicLinks] = useState<MusicLink[]>(
    initialData?.musicLinks || []
  );
  const [newMusicLink, setNewMusicLink] = useState<{
    platform: MusicPlatform;
    url: string;
  }>({ platform: "spotify", url: "" });

  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: initialData
      ? {
          title: initialData.title || "",
          description: initialData.description || "",
          destinationUrl: initialData.destinationUrl || "",
          slug: initialData.slug || "",
          tags: initialData.tags ? initialData.tags.join(", ") : "",
          category: initialData.category || "",
          notes: initialData.notes || "",
          internalUtmSource: initialData.internalUtmSource || "",
          internalUtmMedium: initialData.internalUtmMedium || "",
          internalUtmCampaign: initialData.internalUtmCampaign || "",
          internalUtmContent: initialData.internalUtmContent || "",
          internalUtmTerm: initialData.internalUtmTerm || "",
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
        }
      : {
          title: "",
          description: "",
          destinationUrl: "",
          slug: "",
          tags: "",
          category: "",
          notes: "",
          internalUtmSource: "",
          internalUtmMedium: "",
          internalUtmCampaign: "",
          internalUtmContent: "",
          internalUtmTerm: "",
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

  const slug = watch("slug");

  const generateRandomSlug = () => setValue("slug", generateSlug(8));

  const addMusicLink = () => {
    if (!newMusicLink.url) {
      toast({ title: "Error", description: "Enter a URL for the platform link", variant: "destructive" });
      return;
    }
    setMusicLinks([...musicLinks, { platform: newMusicLink.platform, url: newMusicLink.url }]);
    setNewMusicLink({ platform: "spotify", url: "" });
  };

  const removeMusicLink = (index: number) => {
    setMusicLinks(musicLinks.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: LinkFormData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        return;
      }

      const linkData: any = {
        userId: user.uid,
        title: data.title,
        description: data.description || "",
        destinationUrl: data.destinationUrl,
        slug: data.slug || generateSlug(8),
        clicks: initialData?.clicks || 0,
        isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (musicLinks.length > 0) linkData.musicLinks = musicLinks;

      if (data.tags?.trim()) {
        linkData.tags = data.tags.split(",").map((t) => t.trim()).filter(Boolean);
      }
      if (data.category?.trim()) linkData.category = data.category.trim();
      if (data.notes?.trim()) linkData.notes = data.notes.trim();
      if (data.internalUtmSource?.trim()) linkData.internalUtmSource = data.internalUtmSource.trim();
      if (data.internalUtmMedium?.trim()) linkData.internalUtmMedium = data.internalUtmMedium.trim();
      if (data.internalUtmCampaign?.trim()) linkData.internalUtmCampaign = data.internalUtmCampaign.trim();
      if (data.internalUtmContent?.trim()) linkData.internalUtmContent = data.internalUtmContent.trim();
      if (data.internalUtmTerm?.trim()) linkData.internalUtmTerm = data.internalUtmTerm.trim();
      if (data.ogTitle?.trim()) linkData.ogTitle = data.ogTitle.trim();
      if (data.ogDescription?.trim()) linkData.ogDescription = data.ogDescription.trim();
      if (data.ogImage?.trim()) linkData.ogImage = data.ogImage.trim();
      if (data.ogType?.trim()) linkData.ogType = data.ogType.trim();
      if (data.ogSiteName?.trim()) linkData.ogSiteName = data.ogSiteName.trim();
      if (data.twitterCard?.trim()) linkData.twitterCard = data.twitterCard.trim();
      if (data.twitterTitle?.trim()) linkData.twitterTitle = data.twitterTitle.trim();
      if (data.twitterDescription?.trim()) linkData.twitterDescription = data.twitterDescription.trim();
      if (data.twitterImage?.trim()) linkData.twitterImage = data.twitterImage.trim();
      if (data.siteIconUrl?.trim()) linkData.siteIconUrl = data.siteIconUrl.trim();

      if (initialData) {
        await updateDoc(doc(db, "links", initialData.id), linkData);
        toast({ title: "Saved", description: "Link updated" });
      } else {
        await addDoc(collection(db, "links"), linkData);
        toast({ title: "Created", description: "Link created" });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save link", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" {...register("title")} placeholder="My Awesome Track" />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="destinationUrl">Destination URL</Label>
          <Input
            id="destinationUrl"
            type="url"
            {...register("destinationUrl")}
            placeholder="https://example.com"
          />
          {errors.destinationUrl && (
            <p className="text-xs text-red-500">{errors.destinationUrl.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...register("description")}
            placeholder="Optional description"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Custom Slug</Label>
          <div className="flex gap-2">
            <Input
              id="slug"
              {...register("slug")}
              placeholder="my-link"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={generateRandomSlug}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
          {slug && (
            <p className="text-xs text-gray-500">
              {typeof window !== "undefined" && window.location.origin}/{slug}
            </p>
          )}
          {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
        </div>
      </div>

      <Section title="Music Platforms" description="Add links to streaming platforms" defaultOpen={true}>
        <div className="space-y-2">
          {musicLinks.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md"
            >
              <span className="text-xs font-medium text-gray-700 capitalize w-28 shrink-0">
                {link.platform.replace(/-/g, " ")}
              </span>
              <span className="text-xs text-gray-500 flex-1 truncate">{link.url}</span>
              <button
                type="button"
                onClick={() => removeMusicLink(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <select
            value={newMusicLink.platform}
            onChange={(e) =>
              setNewMusicLink({ ...newMusicLink, platform: e.target.value as MusicPlatform })
            }
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {MUSIC_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          <Input
            placeholder="https://open.spotify.com/..."
            value={newMusicLink.url}
            onChange={(e) => setNewMusicLink({ ...newMusicLink, url: e.target.value })}
            className="flex-1 h-9"
          />
          <Button type="button" size="sm" variant="outline" onClick={addMusicLink}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Section>

      <Section
        title="Advanced Settings"
        description="Metadata, UTM parameters, and social media preview"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Metadata</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                {...register("tags")}
                placeholder="music, release (comma-separated)"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register("category")} placeholder="Music, Promotion" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Internal Notes</Label>
            <textarea
              id="notes"
              {...register("notes")}
              placeholder="Private notes, not visible to users"
              className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Internal UTM</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="internalUtmSource">Source</Label>
              <Input id="internalUtmSource" {...register("internalUtmSource")} placeholder="website, email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internalUtmMedium">Medium</Label>
              <Input id="internalUtmMedium" {...register("internalUtmMedium")} placeholder="banner, post" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internalUtmCampaign">Campaign</Label>
              <Input id="internalUtmCampaign" {...register("internalUtmCampaign")} placeholder="album-release" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internalUtmContent">Content</Label>
              <Input id="internalUtmContent" {...register("internalUtmContent")} placeholder="header, footer" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open Graph</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ogTitle">OG Title</Label>
              <Input id="ogTitle" {...register("ogTitle")} placeholder="Defaults to link title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ogType">OG Type</Label>
              <select
                id="ogType"
                {...register("ogType")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">website (default)</option>
                <option value="website">website</option>
                <option value="music.song">music.song</option>
                <option value="music.album">music.album</option>
                <option value="music.playlist">music.playlist</option>
                <option value="article">article</option>
                <option value="video.other">video.other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>OG Image</Label>
              <Controller
                name="ogImage"
                control={control}
                render={({ field }) => (
                  <ImageInput value={field.value || ""} onChange={field.onChange} placeholder="https://..." />
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ogSiteName">Site Name</Label>
              <Input id="ogSiteName" {...register("ogSiteName")} placeholder="My Tunes" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ogDescription">OG Description</Label>
            <textarea
              id="ogDescription"
              {...register("ogDescription")}
              placeholder="Defaults to link description"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Twitter Card</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="twitterCard">Card Type</Label>
              <select
                id="twitterCard"
                {...register("twitterCard")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Auto</option>
                <option value="summary">summary</option>
                <option value="summary_large_image">summary_large_image</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitterTitle">Twitter Title</Label>
              <Input id="twitterTitle" {...register("twitterTitle")} placeholder="Defaults to OG title" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Twitter Image</Label>
              <Controller
                name="twitterImage"
                control={control}
                render={({ field }) => (
                  <ImageInput value={field.value || ""} onChange={field.onChange} placeholder="https://..." />
                )}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Site Icon</Label>
          <Controller
            name="siteIconUrl"
            control={control}
            render={({ field }) => (
              <ImageInput value={field.value || ""} onChange={field.onChange} placeholder="https://example.com/icon.png" />
            )}
          />
        </div>
      </Section>

      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update Link" : "Create Link"}
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
