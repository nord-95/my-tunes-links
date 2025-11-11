"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { generateSlug } from "@/lib/utils";
import { MusicPlatform, MusicLink } from "@/lib/types";
import { Plus, X } from "lucide-react";

const linkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  destinationUrl: z.string().url("Must be a valid URL"),
  slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
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

export default function LinkForm({ onSuccess, onCancel, initialData }: LinkFormProps) {
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
  } = useForm<LinkFormData>({
    resolver: zodResolver(linkSchema),
    defaultValues: initialData || {
      title: "",
      description: "",
      destinationUrl: "",
      slug: "",
    },
  });

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

  const onSubmit = async (data: LinkFormData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a link",
          variant: "destructive",
        });
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

      // Only include musicLinks if there are any (avoid undefined)
      if (musicLinks.length > 0) {
        linkData.musicLinks = musicLinks;
      }

      if (initialData) {
        await updateDoc(doc(db, "links", initialData.id), linkData);
        toast({
          title: "Success",
          description: "Link updated successfully",
        });
      } else {
        await addDoc(collection(db, "links"), linkData);
        toast({
          title: "Success",
          description: "Link created successfully",
        });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save link",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="My Awesome Track"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          {...register("description")}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="destinationUrl">Destination URL *</Label>
        <Input
          id="destinationUrl"
          type="url"
          {...register("destinationUrl")}
          placeholder="https://example.com"
        />
        {errors.destinationUrl && (
          <p className="text-sm text-destructive">
            {errors.destinationUrl.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="slug">Custom Slug</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateRandomSlug}
          >
            Generate Random
          </Button>
        </div>
        <Input
          id="slug"
          {...register("slug")}
          placeholder="my-awesome-link"
        />
        {slug && (
          <p className="text-sm text-muted-foreground">
            Your link: {typeof window !== "undefined" && window.location.origin}/{slug}
          </p>
        )}
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <Label>Music Platform Links</Label>
        <div className="space-y-2">
          {musicLinks.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border rounded"
            >
              <span className="text-sm font-medium">{link.platform}</span>
              <span className="text-sm text-muted-foreground flex-1 truncate">
                {link.url}
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

        <div className="flex gap-2">
          <select
            value={newMusicLink.platform}
            onChange={(e) =>
              setNewMusicLink({
                ...newMusicLink,
                platform: e.target.value as MusicPlatform,
              })
            }
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {MUSIC_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <Input
            placeholder="Music URL"
            value={newMusicLink.url}
            onChange={(e) =>
              setNewMusicLink({ ...newMusicLink, url: e.target.value })
            }
            className="flex-1"
          />
          <Button type="button" onClick={addMusicLink}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"} Link
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

