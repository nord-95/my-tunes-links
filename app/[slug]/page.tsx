import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import type { Metadata } from "next";
import LinkRedirect from "@/components/link-redirect";
import ReleasePageClient from "@/components/release-page-client";
import { Link, Release } from "@/lib/types";
import { lookupIP } from "@/lib/geoip";

async function getLink(slug: string): Promise<Link | null> {
  try {
    const { db } = await import("@/lib/firebase");
    const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
    const linksRef = collection(db, "links");
    // Query for active links with matching slug
    const q = query(linksRef, where("slug", "==", slug), where("isActive", "==", true), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log(`Link not found for slug: ${slug} (or link is inactive)`);
      // Try to find the link even if inactive for better error message
      const allLinksQuery = query(linksRef, where("slug", "==", slug), limit(1));
      const allSnapshot = await getDocs(allLinksQuery);
      if (!allSnapshot.empty) {
        console.log("Link exists but is inactive");
      }
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    if (!data.userId || !data.slug || !data.title || !data.destinationUrl) {
      console.error("Link data is missing required fields:", {
        hasUserId: !!data.userId,
        hasSlug: !!data.slug,
        hasTitle: !!data.title,
        hasDestinationUrl: !!data.destinationUrl,
      });
      return null;
    }
    
    return {
      id: doc.id,
      userId: data.userId,
      slug: data.slug,
      title: data.title,
      description: data.description,
      destinationUrl: data.destinationUrl,
      musicLinks: data.musicLinks,
      thumbnailUrl: data.thumbnailUrl,
      clicks: data.clicks || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      // Metadata fields
      tags: data.tags,
      category: data.category,
      notes: data.notes,
      // Internal UTM parameters
      internalUtmSource: data.internalUtmSource,
      internalUtmMedium: data.internalUtmMedium,
      internalUtmCampaign: data.internalUtmCampaign,
      internalUtmContent: data.internalUtmContent,
      internalUtmTerm: data.internalUtmTerm,
      // Open Graph / Social Media Metadata
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
    console.error("Error fetching link:", error);
    // Log more details about the error
    if (error.code) {
      console.error("Firestore error code:", error.code);
      if (error.code === "permission-denied") {
        console.error("Permission denied - check Firestore security rules");
      }
    }
    return null;
  }
}

function extractIP(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  const vercelForwarded = headersList.get("x-vercel-forwarded-for");
  const realIp = headersList.get("x-real-ip");
  const cfConnectingIp = headersList.get("cf-connecting-ip");

  if (forwarded) {
    const ips = forwarded.split(",").map((ip) => ip.trim()).filter(Boolean);
    return ips[0] || "";
  }
  if (vercelForwarded) {
    const ips = vercelForwarded.split(",").map((ip) => ip.trim()).filter(Boolean);
    return ips[0] || "";
  }
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

async function trackClick(linkId: string, headersList: Headers, currentUrl?: string, link?: Link | null) {
  try {
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer") || "";
    const ipAddress = extractIP(headersList);

    // Parse UTM / fbclid from current URL, fall back to referer, then internal UTM
    const utm = currentUrl ? extractUTM(currentUrl) : {};
    if (referer && !utm.utm_source) {
      const refererUtm = extractUTM(referer);
      Object.assign(utm, refererUtm);
    }
    if (link) {
      if (!utm.utm_source && link.internalUtmSource) utm.utm_source = link.internalUtmSource;
      if (!utm.utm_medium && link.internalUtmMedium) utm.utm_medium = link.internalUtmMedium;
      if (!utm.utm_campaign && link.internalUtmCampaign) utm.utm_campaign = link.internalUtmCampaign;
      if (!utm.utm_content && link.internalUtmContent) utm.utm_content = link.internalUtmContent;
      if (!utm.utm_term && link.internalUtmTerm) utm.utm_term = link.internalUtmTerm;
    }

    const { parseUserAgent, detectSocialSource } = await import("@/lib/utils");
    const deviceInfo = parseUserAgent(userAgent);

    // Social source: referrer takes priority, UTM second, fbclid as last resort
    let socialSource = detectSocialSource(referer, currentUrl ? new URL(currentUrl).searchParams : undefined);
    if (!socialSource && utm.fbclid) socialSource = "Facebook";

    // Geolocation via MaxMind — local, <1ms, no external dependency
    const geoData = await lookupIP(ipAddress);

    const { addDoc, collection, doc, updateDoc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const clickData: Record<string, any> = {
      linkId,
      timestamp: new Date(),
      isBot: deviceInfo.isBot || false,
    };

    if (userAgent) clickData.userAgent = userAgent;
    if (referer) clickData.referrer = referer;
    if (ipAddress) clickData.ipAddress = ipAddress;
    if (deviceInfo.platform) clickData.platform = deviceInfo.platform;
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

    await addDoc(collection(db, "clicks"), clickData);

    // Increment link click counter
    const linkRef = doc(db, "links", linkId);
    const linkDoc = await getDoc(linkRef);
    if (linkDoc.exists()) {
      await updateDoc(linkRef, {
        clicks: (linkDoc.data()?.clicks || 0) + 1,
        updatedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error("Error tracking click:", error.message);
  }
}

async function getRelease(slug: string): Promise<Release | null> {
  try {
    const { db } = await import("@/lib/firebase");
    const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
    const releasesRef = collection(db, "releases");
    const q = query(releasesRef, where("slug", "==", slug), where("isActive", "==", true), limit(1));
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
    const ipAddress = extractIP(headersList);

    const utm = currentUrl ? extractUTM(currentUrl) : {};
    if (referer && !utm.utm_source) Object.assign(utm, extractUTM(referer));

    const { parseUserAgent, detectSocialSource } = await import("@/lib/utils");
    const deviceInfo = parseUserAgent(userAgent);

    let socialSource = detectSocialSource(referer, currentUrl ? new URL(currentUrl).searchParams : undefined);
    if (!socialSource && utm.fbclid) socialSource = "Facebook";

    const geoData = await lookupIP(ipAddress);

    const { addDoc, collection, doc, getDoc, updateDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

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

// Generate metadata for Open Graph and social media previews
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const link = await getLink(slug);
  const release = link ? null : await getRelease(slug);

  if (!link && !release) {
    return {
      title: "Not Found",
      description: "The page you're looking for doesn't exist or has been deactivated.",
    };
  }

  const headersList = await headers();
  const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const currentUrl = `${protocol}://${host}/${slug}`;

  if (link) {

    // Use OG metadata if available, otherwise fall back to regular fields
  const ogTitle = link.ogTitle || link.title;
  const ogDescription = link.ogDescription || link.description || `Click to visit ${link.destinationUrl}`;
  const ogImage = link.ogImage || link.thumbnailUrl;
  const ogType = link.ogType || "website";
  const ogSiteName = link.ogSiteName || "My Tunes";

  // Twitter metadata
  const twitterTitle = link.twitterTitle || ogTitle;
  const twitterDescription = link.twitterDescription || ogDescription;
  const twitterImage = link.twitterImage || ogImage;
  const twitterCard = link.twitterCard || (ogImage ? "summary_large_image" : "summary");

  // Determine an icon to always output (force display)
  const iconUrl = (link.siteIconUrl && String(link.siteIconUrl)) || (link.thumbnailUrl && String(link.thumbnailUrl)) || "/favicon.ico";

  const metadata: Metadata = {
    title: ogTitle,
    description: ogDescription,
    // Always emit icons so crawlers/browsers see a favicon
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

    return metadata;
  } else if (release) {
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

  return {
    title: "Not Found",
    description: "The page you're looking for doesn't exist.",
  };
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const link = await getLink(slug);
  const release = link ? null : await getRelease(slug);

  if (!link && !release) {
    // Try app-level settings for 404 redirect
    try {
      const { db } = await import("@/lib/firebase");
      const { doc, getDoc } = await import("firebase/firestore");
      const settingsRef = doc(db, "settings", "app");
      const settingsSnap = await getDoc(settingsRef);
      const redirectUrl = settingsSnap.exists() ? settingsSnap.data()?.notFoundRedirectUrl : null;
      if (redirectUrl && typeof redirectUrl === "string" && redirectUrl.trim().length > 0) {
        redirect(redirectUrl.trim());
      }
    } catch (e) {
      // fall through to notFound
    }
    notFound();
  }

  const headersList = await headers();
  const host = headersList.get("host") || headersList.get("x-forwarded-host") || "";
  const protocol = headersList.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const path = `/${slug}`;
  
  const paramsObj = await searchParams;
  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(paramsObj)) {
    if (value) {
      queryParts.push(`${key}=${encodeURIComponent(Array.isArray(value) ? value[0] : value)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const currentUrl = `${protocol}://${host}${path}${queryString}`;

  if (link) {
    after(() => trackClick(link.id, headersList, currentUrl, link));
    return <LinkRedirect link={link} />;
  } else if (release) {
    after(() => trackReleaseView(release.id, headersList, currentUrl));
    return <ReleasePageClient release={release} />;
  }

  notFound();
}

