import type { MetadataRoute } from "next";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytune.es";

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  try {
    const releasesRef = collection(db, "releases");
    const q = query(releasesRef, where("isActive", "==", true));
    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.slug) continue;

      const lastModified = data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? new Date();

      // Canonical URL: /{slug} (no /r/ prefix)
      entries.push({
        url: `${baseUrl}/${data.slug}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("sitemap: failed to fetch releases", error);
  }

  return entries;
}
