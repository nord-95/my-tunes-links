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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { generateSlug } from "@/lib/utils";
import { Artist, SocialLink } from "@/lib/types";
import { Plus, X } from "lucide-react";

const artistSchema = z.object({
  name: z.string().min(1, "Artist name is required"),
  slug: z.string().min(3, "Slug must be at least 3 characters").optional(),
  bio: z.string().optional(),
  profileImageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ArtistFormData = z.infer<typeof artistSchema>;

interface ArtistFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Artist;
}

export default function ArtistForm({ onSuccess, onCancel, initialData }: ArtistFormProps) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    initialData?.socialLinks || []
  );
  const [newSocialLink, setNewSocialLink] = useState<{
    platform: string;
    url: string;
  }>({
    platform: "instagram",
    url: "",
  });
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ArtistFormData>({
    resolver: zodResolver(artistSchema),
    defaultValues: initialData ? {
      name: initialData.name || "",
      slug: initialData.slug || "",
      bio: initialData.bio || "",
      profileImageUrl: initialData.profileImageUrl || "",
      website: initialData.website || "",
    } : {
      name: "",
      slug: "",
      bio: "",
      profileImageUrl: "",
      website: "",
    },
  });

  const slug = watch("slug");

  const generateRandomSlug = () => {
    setValue("slug", generateSlug(8));
  };

  const addSocialLink = () => {
    if (!newSocialLink.url) {
      toast({
        title: "Error",
        description: "Please enter a URL for the social link",
        variant: "destructive",
      });
      return;
    }

    setSocialLinks([
      ...socialLinks,
      {
        platform: newSocialLink.platform,
        url: newSocialLink.url,
      },
    ]);
    setNewSocialLink({ platform: "instagram", url: "" });
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const cleanData = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => cleanData(item)).filter(item => item !== undefined);
    }

    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = cleanData(value);
        }
      }
    }
    return cleaned;
  };

  const onSubmit = async (data: ArtistFormData) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create an artist",
          variant: "destructive",
        });
        return;
      }

      const artistData: any = {
        userId: user.uid,
        name: data.name.trim(),
        slug: data.slug || generateSlug(8),
        createdAt: initialData?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      if (data.bio && data.bio.trim()) {
        artistData.bio = data.bio.trim();
      }

      if (data.profileImageUrl && data.profileImageUrl.trim()) {
        artistData.profileImageUrl = data.profileImageUrl.trim();
      }

      if (data.website && data.website.trim()) {
        artistData.website = data.website.trim();
      }

      if (socialLinks.length > 0) {
        artistData.socialLinks = socialLinks.map(link => ({
          platform: link.platform,
          url: link.url,
        }));
      }

      // Preserve newsletter emails if editing
      if (initialData?.newsletterEmails) {
        artistData.newsletterEmails = initialData.newsletterEmails;
      } else {
        artistData.newsletterEmails = [];
      }

      const cleanedArtistData = cleanData(artistData);

      if (initialData) {
        await updateDoc(doc(db, "artists", initialData.id), cleanedArtistData);
        toast({
          title: "Success",
          description: "Artist updated successfully",
        });
      } else {
        await addDoc(collection(db, "artists"), cleanedArtistData);
        toast({
          title: "Success",
          description: "Artist created successfully",
        });
      }

      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving artist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save artist",
        variant: "destructive",
      });
    }
  };

  const socialPlatforms = [
    "instagram",
    "twitter",
    "facebook",
    "youtube",
    "tiktok",
    "soundcloud",
    "spotify",
    "apple-music",
    "bandcamp",
    "other",
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Artist Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter artist name"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateRandomSlug}
            className="ml-2"
          >
            Generate Random
          </Button>
        </Label>
        <Input
          id="slug"
          {...register("slug")}
          placeholder="auto-generated-slug"
        />
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          URL-friendly identifier (auto-generated if left empty)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register("bio")}
          placeholder="Enter artist biography"
          rows={4}
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profileImageUrl">Profile Image URL</Label>
        <Input
          id="profileImageUrl"
          {...register("profileImageUrl")}
          placeholder="https://example.com/image.jpg"
        />
        {errors.profileImageUrl && (
          <p className="text-sm text-destructive">{errors.profileImageUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          {...register("website")}
          placeholder="https://example.com"
        />
        {errors.website && (
          <p className="text-sm text-destructive">{errors.website.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Social Media Links</Label>
        <div className="space-y-2">
          {socialLinks.map((link, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                value={link.platform}
                readOnly
                className="w-32 capitalize"
              />
              <Input
                value={link.url}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSocialLink(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <select
              value={newSocialLink.platform}
              onChange={(e) =>
                setNewSocialLink({ ...newSocialLink, platform: e.target.value })
              }
              className="w-32 px-3 py-2 border rounded-md capitalize"
            >
              {socialPlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <Input
              value={newSocialLink.url}
              onChange={(e) =>
                setNewSocialLink({ ...newSocialLink, url: e.target.value })
              }
              placeholder="https://..."
              className="flex-1"
            />
            <Button type="button" onClick={addSocialLink}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update Artist" : "Create Artist"}
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

