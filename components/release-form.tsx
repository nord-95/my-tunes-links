"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { ImageInput } from "@/components/image-input";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, query, where, getDocs, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { generateSlug } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MusicPlatform, MusicLink, ReleaseType, Artist } from "@/lib/types";
import { Plus, X, ChevronDown, RefreshCw } from "lucide-react";

const releaseSchema = z.object({
  artistName: z.string().min(1, "Artist name is required"),
  releaseName: z.string().min(1, "Release name is required"),
  artworkUrl: z.string().url("Must be a valid URL").min(1, "Artwork URL is required"),
  artistLogoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  releaseType: z.string().min(1, "Release type is required"),
  customReleaseType: z.string().optional(),
  slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
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

export default function ReleaseForm({ onSuccess, onCancel, initialData }: ReleaseFormProps) {
  const [musicLinks, setMusicLinks] = useState<MusicLink[]>(initialData?.musicLinks || []);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>("");
  const [newMusicLink, setNewMusicLink] = useState<{ platform: MusicPlatform; url: string }>({
    platform: "spotify",
    url: "",
  });

  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ReleaseFormData>({
    resolver: zodResolver(releaseSchema),
    defaultValues: initialData
      ? {
          artistName: initialData.artistName || "",
          releaseName: initialData.releaseName || "",
          artworkUrl: initialData.artworkUrl || "",
          artistLogoUrl: initialData.artistLogoUrl || "",
          releaseType: RELEASE_TYPES.includes(initialData.releaseType as ReleaseType)
            ? initialData.releaseType
            : "Custom",
          customReleaseType: RELEASE_TYPES.includes(initialData.releaseType as ReleaseType)
            ? ""
            : initialData.releaseType || "",
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
        }
      : {
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

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(collection(db, "artists"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Artist[];
        data.sort((a, b) => a.name.localeCompare(b.name));
        setArtists(data);

        if (initialData?.artistName) {
          const match = data.find((a) => a.name === initialData.artistName);
          if (match) setSelectedArtistId(match.id);
        }
      } catch {
        // silently fail
      }
    };
    loadArtists();
  }, [initialData]);

  const handleArtistSelect = (artistId: string) => {
    setSelectedArtistId(artistId);
    const artist = artists.find((a) => a.id === artistId);
    if (artist) {
      setValue("artistName", artist.name);
      if (artist.profileImageUrl && !initialData?.artistLogoUrl) {
        setValue("artistLogoUrl", artist.profileImageUrl);
      }
    }
  };

  const generateRandomSlug = () => setValue("slug", generateSlug(8));

  const addMusicLink = () => {
    if (!newMusicLink.url) {
      toast({ title: "Error", description: "Enter a URL for the platform", variant: "destructive" });
      return;
    }
    setMusicLinks([...musicLinks, { platform: newMusicLink.platform, url: newMusicLink.url }]);
    setNewMusicLink({ platform: "spotify", url: "" });
  };

  const removeMusicLink = (index: number) => {
    setMusicLinks(musicLinks.filter((_, i) => i !== index));
  };

  const cleanData = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(cleanData).filter((i) => i !== undefined);
    if (typeof obj === "object" && obj.constructor === Object) {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          const v = cleanData(obj[key]);
          if (v !== undefined) cleaned[key] = v;
        }
      }
      return cleaned;
    }
    return obj;
  };

  const onSubmit = async (data: ReleaseFormData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
        return;
      }

      const finalReleaseType =
        data.releaseType === "Custom" && data.customReleaseType
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
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (data.artistLogoUrl?.trim()) releaseData.artistLogoUrl = data.artistLogoUrl.trim();
      if (musicLinks.length > 0) {
        releaseData.musicLinks = musicLinks.map((l) => ({
          platform: l.platform,
          url: l.url,
          ...(l.title && { title: l.title }),
        }));
      }
      if (data.ogTitle?.trim()) releaseData.ogTitle = data.ogTitle.trim();
      if (data.ogDescription?.trim()) releaseData.ogDescription = data.ogDescription.trim();
      if (data.ogImage?.trim()) releaseData.ogImage = data.ogImage.trim();
      if (data.ogType?.trim()) releaseData.ogType = data.ogType.trim();
      if (data.ogSiteName?.trim()) releaseData.ogSiteName = data.ogSiteName.trim();
      if (data.twitterCard?.trim()) releaseData.twitterCard = data.twitterCard.trim();
      if (data.twitterTitle?.trim()) releaseData.twitterTitle = data.twitterTitle.trim();
      if (data.twitterDescription?.trim()) releaseData.twitterDescription = data.twitterDescription.trim();
      if (data.twitterImage?.trim()) releaseData.twitterImage = data.twitterImage.trim();
      if (data.siteIconUrl?.trim()) releaseData.siteIconUrl = data.siteIconUrl.trim();

      const cleaned = cleanData(releaseData);

      if (initialData) {
        const { createdAt, ...updateData } = cleaned;
        await updateDoc(doc(db, "releases", initialData.id), cleanData(updateData));
        toast({ title: "Saved", description: "Release updated" });
      } else {
        await addDoc(collection(db, "releases"), cleaned);
        toast({ title: "Created", description: "Release created" });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save release", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-4">
        {artists.length > 0 && (
          <div className="space-y-1.5">
            <Label>Artist</Label>
            <select
              value={selectedArtistId}
              onChange={(e) => {
                if (e.target.value) {
                  handleArtistSelect(e.target.value);
                } else {
                  setSelectedArtistId("");
                  setValue("artistName", "");
                  setValue("artistLogoUrl", "");
                }
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Select an artist or enter manually below</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="artistName">Artist Name</Label>
          <Input
            id="artistName"
            {...register("artistName")}
            placeholder="Artist name"
            onChange={(e) => {
              if (selectedArtistId && e.target.value !== artists.find((a) => a.id === selectedArtistId)?.name) {
                setSelectedArtistId("");
              }
              register("artistName").onChange(e);
            }}
          />
          {errors.artistName && <p className="text-xs text-red-500">{errors.artistName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="releaseName">Release Name</Label>
          <Input id="releaseName" {...register("releaseName")} placeholder="My New Single" />
          {errors.releaseName && <p className="text-xs text-red-500">{errors.releaseName.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="releaseType">Release Type</Label>
            <select
              id="releaseType"
              {...register("releaseType")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {RELEASE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              <option value="Custom">Custom</option>
            </select>
          </div>

          {releaseType === "Custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="customReleaseType">Custom Type</Label>
              <Input
                id="customReleaseType"
                {...register("customReleaseType")}
                placeholder="e.g., Mixtape"
              />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Artwork <span className="text-red-500">*</span></Label>
          <Controller
            name="artworkUrl"
            control={control}
            render={({ field }) => (
              <ImageInput value={field.value} onChange={field.onChange} placeholder="https://example.com/artwork.jpg" />
            )}
          />
          {errors.artworkUrl && <p className="text-xs text-red-500">{errors.artworkUrl.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Artist Logo <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Controller
            name="artistLogoUrl"
            control={control}
            render={({ field }) => (
              <ImageInput value={field.value || ""} onChange={field.onChange} placeholder="https://example.com/logo.png" />
            )}
          />
          <p className="text-xs text-gray-400">If not set, artist name is shown instead</p>
          {errors.artistLogoUrl && (
            <p className="text-xs text-red-500">{errors.artistLogoUrl.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">Custom Slug <span className="text-gray-400 font-normal">(optional)</span></Label>
          <div className="flex gap-2">
            <Input
              id="slug"
              {...register("slug")}
              placeholder="auto-generated if left empty"
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

      <Section title="Streaming Links" description="Add platform links for this release" defaultOpen={true}>
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
        title="Social Media Preview"
        description="Open Graph and Twitter Card metadata"
        defaultOpen={false}
      >
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Open Graph</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ogTitle">OG Title</Label>
              <Input id="ogTitle" {...register("ogTitle")} placeholder="Artist - Release Name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ogType">OG Type</Label>
              <Input id="ogType" {...register("ogType")} placeholder="music.song, music.album" />
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
              {errors.ogImage && <p className="text-xs text-red-500">{errors.ogImage.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ogSiteName">Site Name</Label>
              <Input id="ogSiteName" {...register("ogSiteName")} placeholder="My Tunes" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ogDescription">OG Description</Label>
            <Input id="ogDescription" {...register("ogDescription")} placeholder="Description for social previews" />
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
                <option value="">Select...</option>
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitterTitle">Twitter Title</Label>
              <Input id="twitterTitle" {...register("twitterTitle")} placeholder="Defaults to OG Title" />
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
              {errors.twitterImage && (
                <p className="text-xs text-red-500">{errors.twitterImage.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Site Icon</Label>
          <Controller
            name="siteIconUrl"
            control={control}
            render={({ field }) => (
              <ImageInput value={field.value || ""} onChange={field.onChange} placeholder="https://example.com/favicon.png" />
            )}
          />
          {errors.siteIconUrl && <p className="text-xs text-red-500">{errors.siteIconUrl.message}</p>}
        </div>
      </Section>

      <div className="flex gap-2 pt-1">
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
