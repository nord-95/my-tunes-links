import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc, updateDoc } from "firebase/firestore";
import { Release } from "@/lib/types";
import ReleasePageClient from "@/components/release-page-client";

async function getRelease(slug: string): Promise<Release | null> {
  try {
    const linksRef = collection(db, "releases");
    const q = query(linksRef, where("slug", "==", slug), where("isActive", "==", true), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    if (!data.userId || !data.slug || !data.artistName || !data.releaseName || !data.artworkUrl) {
      return null;
    }
    
    return {
      id: doc.id,
      userId: data.userId,
      slug: data.slug,
      artistName: data.artistName,
      releaseName: data.releaseName,
      artworkUrl: data.artworkUrl,
      artistLogoUrl: data.artistLogoUrl,
      releaseType: data.releaseType,
      musicLinks: data.musicLinks,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      views: data.views || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImage: data.ogImage,
      ogType: data.ogType,
      ogSiteName: data.ogSiteName,
      twitterCard: data.twitterCard,
      twitterTitle: data.twitterTitle,
      twitterDescription: data.twitterDescription,
      twitterImage: data.twitterImage,
      siteIconUrl: data.siteIconUrl,
    };
  } catch (error: any) {
    console.error("Error fetching release:", error);
    return null;
  }
}

async function trackReleaseView(releaseId: string, headersList: Headers, currentUrl?: string) {
  try {
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer") || "";
    
    // Get IP address
    const forwarded = headersList.get("x-forwarded-for");
    const vercelForwarded = headersList.get("x-vercel-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const cfConnectingIp = headersList.get("cf-connecting-ip");
    
    let ipAddress = "";
    if (forwarded) {
      const ips = forwarded.split(",").map(ip => ip.trim()).filter(ip => ip);
      ipAddress = ips.length > 0 ? ips[0] : "";
    } else if (vercelForwarded) {
      const ips = vercelForwarded.split(",").map(ip => ip.trim()).filter(ip => ip);
      ipAddress = ips.length > 0 ? ips[0] : "";
    } else {
      ipAddress = realIp || cfConnectingIp || "";
    }

    // Parse URL parameters
    let currentUrlParams: URLSearchParams | undefined;
    let utmSource: string | undefined;
    let utmMedium: string | undefined;
    let utmCampaign: string | undefined;
    let utmContent: string | undefined;
    let utmTerm: string | undefined;
    let fbclid: string | undefined;
    
    if (currentUrl) {
      try {
        const url = new URL(currentUrl);
        currentUrlParams = url.searchParams;
        utmSource = currentUrlParams.get("utm_source") || undefined;
        utmMedium = currentUrlParams.get("utm_medium") || undefined;
        utmCampaign = currentUrlParams.get("utm_campaign") || undefined;
        utmContent = currentUrlParams.get("utm_content") || undefined;
        utmTerm = currentUrlParams.get("utm_term") || undefined;
        fbclid = currentUrlParams.get("fbclid") || undefined;
      } catch (e) {
        console.warn("Failed to parse current URL:", e);
      }
    }

    // Parse user agent
    const { parseUserAgent, detectSocialSource } = await import("@/lib/utils");
    const deviceInfo = parseUserAgent(userAgent);
    
    // Detect social source
    let socialSource: string | undefined;
    if (referer) {
      socialSource = detectSocialSource(referer, currentUrlParams);
    }
    if (!socialSource && utmSource) {
      socialSource = detectSocialSource("", currentUrlParams);
    }
    if (!socialSource && fbclid) {
      socialSource = "Facebook";
    }

    const { addDoc, collection } = await import("firebase/firestore");
    
    const clickDataRaw: Record<string, any> = {
      releaseId,
      timestamp: new Date(),
      clickType: "view",
      isBot: deviceInfo.isBot || false,
      enrichmentStatus: "pending",
      enrichmentAttempts: 0,
    };

    if (userAgent) clickDataRaw.userAgent = userAgent;
    if (referer) clickDataRaw.referrer = referer;
    if (ipAddress) clickDataRaw.ipAddress = ipAddress;
    if (deviceInfo.platform) clickDataRaw.platform_type = deviceInfo.platform;
    if (deviceInfo.device) clickDataRaw.device = deviceInfo.device;
    if (deviceInfo.deviceType) clickDataRaw.deviceType = deviceInfo.deviceType;
    if (deviceInfo.browser) clickDataRaw.browser = deviceInfo.browser;
    if (deviceInfo.os) clickDataRaw.os = deviceInfo.os;
    if (deviceInfo.isBot) clickDataRaw.isBot = deviceInfo.isBot;
    if (deviceInfo.botType) clickDataRaw.botType = deviceInfo.botType;
    if (socialSource) clickDataRaw.socialSource = socialSource;
    if (utmSource) clickDataRaw.utmSource = utmSource;
    if (utmMedium) clickDataRaw.utmMedium = utmMedium;
    if (utmCampaign) clickDataRaw.utmCampaign = utmCampaign;
    if (utmContent) clickDataRaw.utmContent = utmContent;
    if (utmTerm) clickDataRaw.utmTerm = utmTerm;
    if (fbclid) clickDataRaw.fbclid = fbclid;

    await addDoc(collection(db, "releaseClicks"), clickDataRaw);

    // Update release view count
    const releaseRef = doc(db, "releases", releaseId);
    const releaseDoc = await getDoc(releaseRef);
    if (releaseDoc.exists()) {
      const currentViews = releaseDoc.data()?.views || 0;
      await updateDoc(releaseRef, {
        views: currentViews + 1,
        updatedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error("Error tracking release view:", error);
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const release = await getRelease(slug);

  if (!release) {
    return {
      title: "Release Not Found",
      description: "The release you're looking for doesn't exist or has been deactivated.",
    };
  }

  const headersList = await headers();
  const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const currentUrl = `${protocol}://${host}/r/${slug}`;

  const ogTitle = release.ogTitle || `${release.artistName} - ${release.releaseName}`;
  const ogDescription = release.ogDescription || `Listen to ${release.releaseName} by ${release.artistName}`;
  const ogImage = release.ogImage || release.artworkUrl;
  const ogType = release.ogType || "music.song";
  const ogSiteName = release.ogSiteName || "My Tunes";

  const twitterTitle = release.twitterTitle || ogTitle;
  const twitterDescription = release.twitterDescription || ogDescription;
  const twitterImage = release.twitterImage || ogImage;
  const twitterCard = release.twitterCard || (ogImage ? "summary_large_image" : "summary");

  const iconUrl = release.siteIconUrl || release.artworkUrl || "/favicon.ico";

  return {
    title: ogTitle,
    description: ogDescription,
    icons: {
      icon: [{ url: iconUrl }],
      shortcut: [iconUrl],
      apple: [iconUrl],
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: currentUrl,
      siteName: ogSiteName,
      type: ogType as any,
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: ogTitle,
          },
        ],
      }),
    },
    twitter: {
      card: twitterCard as any,
      title: twitterTitle,
      description: twitterDescription,
      ...(twitterImage && {
        images: [twitterImage],
      }),
    },
    alternates: {
      canonical: currentUrl,
    },
  };
}

export default async function ReleasePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const release = await getRelease(slug);

  if (!release) {
    notFound();
  }

  const headersList = await headers();
  
  const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const path = `/r/${slug}`;
  
  const paramsObj = await searchParams;
  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(paramsObj)) {
    if (value) {
      queryParts.push(`${key}=${encodeURIComponent(Array.isArray(value) ? value[0] : value)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  
  const currentUrl = `${protocol}://${host}${path}${queryString}`;
  
  // Track release view
  const trackingPromise = trackReleaseView(release.id, headersList, currentUrl);
  
  Promise.race([
    trackingPromise,
    new Promise((resolve) => setTimeout(() => resolve("timeout"), 100)),
  ]).then((result) => {
    if (result === "timeout") {
      trackingPromise.catch((err) => console.error("Background tracking failed:", err));
    }
  }).catch((error) => {
    console.error("Error in trackReleaseView:", error);
  });

  return <ReleasePageClient release={release} />;
}

