import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import ArtistBio from "@/components/artist-bio";
import { Artist } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

async function getArtist(slug: string): Promise<Artist | null> {
  try {
    const artistsRef = collection(db, "artists");
    const q = query(artistsRef, where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Helper function to convert Firestore Timestamp to Date
    const convertTimestamp = (timestamp: any): Date => {
      if (!timestamp) {
        return new Date();
      }
      
      if (timestamp instanceof Date) {
        if (!isNaN(timestamp.getTime())) {
          return timestamp;
        }
        return new Date();
      }
      
      if (typeof timestamp === 'object' && Object.keys(timestamp).length === 0) {
        return new Date();
      }
      
      if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
        try {
          const date = timestamp.toDate();
          if (date instanceof Date && !isNaN(date.getTime())) {
            return date;
          }
        } catch (e) {
          // Continue to other methods
        }
      }
      
      if (typeof timestamp === 'object' && 'seconds' in timestamp && typeof timestamp.seconds === 'number') {
        const date = new Date(timestamp.seconds * 1000);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      if (typeof timestamp === 'object' && '_seconds' in timestamp && typeof (timestamp as any)._seconds === 'number') {
        const date = new Date((timestamp as any)._seconds * 1000);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      try {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        // Ignore
      }
      
      return new Date();
    };

    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      slug: data.slug,
      bio: data.bio,
      profileImageUrl: data.profileImageUrl,
      website: data.website,
      socialLinks: data.socialLinks,
      newsletterEmails: data.newsletterEmails || [],
      createdAt: convertTimestamp(data.createdAt),
      updatedAt: convertTimestamp(data.updatedAt),
    } as Artist;
  } catch (error) {
    console.error("Error fetching artist:", error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtist(slug);

  if (!artist) {
    return {
      title: "Artist Not Found",
      description: "The artist you're looking for doesn't exist.",
    };
  }

  const headersList = await headers();
  const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const currentUrl = `${protocol}://${host}/artist-bio/${slug}`;

  const metadata: Metadata = {
    title: `${artist.name} | Artist Bio`,
    description: artist.bio || `Connect with ${artist.name}: Music, Socials, Videos, and more.`,
    openGraph: {
      title: `${artist.name} - Official Links`,
      description: artist.bio || `Connect with ${artist.name}: Music, Socials, Videos, and more.`,
      url: currentUrl,
      type: "website",
      images: artist.profileImageUrl ? [artist.profileImageUrl] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${artist.name} - Official Links`,
      description: artist.bio || `Connect with ${artist.name}: Music, Socials, Videos, and more.`,
      images: artist.profileImageUrl ? [artist.profileImageUrl] : [],
    },
  };

  return metadata;
}

export default async function ArtistBioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = await getArtist(slug);

  if (!artist) {
    notFound();
  }

  return <ArtistBio artist={artist} />;
}

