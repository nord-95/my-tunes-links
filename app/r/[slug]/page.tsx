import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import type { Metadata } from "next";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { Release } from "@/lib/types";
import ReleasePageClient from "@/components/release-page-client";
import { lookupIP } from "@/lib/geoip";

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

function extractIP(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  const vercelForwarded = headersList.get("x-vercel-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const cfConnectingIp = headersList.get("cf-connecting-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();
  return realIp || cfConnectingIp || "";
}

function extractUTM(url: string): Record<string, string> {
  try {
    const params = new URL(url).searchParams;
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"]) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    return utm;
  } catch {
    return {};
  }
}

async function trackReleaseView(releaseId: string, headersList: Headers, currentUrl?: string) {
  try {
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer") || "";
    const ipAddress = extractIP(headersList);

    const utm = currentUrl ? extractUTM(currentUrl) : {};
    if (referer && !utm.utm_source) Object.assign(utm, extractUTM(referer));

    const { parseUserAgent, detectSocialSource } = await import("@/lib/utils");
    const deviceInfo = parseUserAgent(userAgent);

    let socialSource = detectSocialSource(referer, currentUrl ? new URL(currentUrl).searchParams : undefined);
    if (!socialSource && utm.fbclid) socialSource = "Facebook";

    const geoData = await lookupIP(ipAddress);

    const clickData: Record<string, any> = {
      releaseId,
      timestamp: new Date(),
      clickType: "view",
      isBot: deviceInfo.isBot || false,
    };

    if (userAgent) clickData.userAgent = userAgent;
    if (referer) clickData.referrer = referer;
    if (ipAddress) clickData.ipAddress = ipAddress;
    if (deviceInfo.platform) clickData.platform_type = deviceInfo.platform;
    if (deviceInfo.device) clickData.device = deviceInfo.device;
    if (deviceInfo.deviceType) clickData.deviceType = deviceInfo.deviceType;
    if (deviceInfo.browser) clickData.browser = deviceInfo.browser;
    if (deviceInfo.os) clickData.os = deviceInfo.os;
    if (deviceInfo.botType) clickData.botType = deviceInfo.botType;
    if (socialSource) clickData.socialSource = socialSource;
    if (utm.utm_source) clickData.utmSource = utm.utm_source;
    if (utm.utm_medium) clickData.utmMedium = utm.utm_medium;
    if (utm.utm_campaign) clickData.utmCampaign = utm.utm_campaign;
    if (utm.utm_content) clickData.utmContent = utm.utm_content;
    if (utm.utm_term) clickData.utmTerm = utm.utm_term;
    if (utm.fbclid) clickData.fbclid = utm.fbclid;
    if (geoData.country) clickData.country = geoData.country;
    if (geoData.city) clickData.city = geoData.city;
    if (geoData.region) clickData.region = geoData.region;
    if (geoData.countryCode) clickData.countryCode = geoData.countryCode;
    if (geoData.timezone) clickData.timezone = geoData.timezone;

    await addDoc(collection(db, "releaseClicks"), clickData);

    const releaseRef = doc(db, "releases", releaseId);
    const releaseDoc = await getDoc(releaseRef);
    if (releaseDoc.exists()) {
      await updateDoc(releaseRef, {
        views: (releaseDoc.data()?.views || 0) + 1,
        updatedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error("Error tracking release view:", error.message);
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
  
  after(() => trackReleaseView(release.id, headersList, currentUrl));
  return <ReleasePageClient release={release} />;
}

