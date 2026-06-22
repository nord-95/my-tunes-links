import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytune.es";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/r/"],
        disallow: [
          "/dashboard",
          "/analytics/",
          "/link/",
          "/links",
          "/release/",
          "/releases",
          "/artist/",
          "/artists",
          "/settings",
          "/auth/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
