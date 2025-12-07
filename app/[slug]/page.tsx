import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import LinkRedirect from "@/components/link-redirect";
import ReleasePageClient from "@/components/release-page-client";
import { Link, Release } from "@/lib/types";

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

async function trackClick(linkId: string, headersList: Headers, currentUrl?: string, link?: Link | null) {
  try {
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer") || "";
    
    // Get IP address - check multiple headers for better accuracy (Vercel, Cloudflare, etc.)
    // Priority: x-forwarded-for (first IP is client) > x-real-ip > cf-connecting-ip > x-client-ip > x-vercel-forwarded-for
    const forwarded = headersList.get("x-forwarded-for");
    const vercelForwarded = headersList.get("x-vercel-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const cfConnectingIp = headersList.get("cf-connecting-ip");
    const clientIp = headersList.get("x-client-ip");
    const trueClientIp = headersList.get("true-client-ip");
    
    let ipAddress = "";
    // Try to get the real client IP, not proxy IPs
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
      // The LAST IP is usually the original client (after proxies)
      // But sometimes the FIRST is the client. Try both.
      const ips = forwarded.split(",").map(ip => ip.trim()).filter(ip => ip);
      if (ips.length > 0) {
        // For most cases, first IP is client, but if it looks like a proxy/CDN, try last
        const firstIP = ips[0];
        const lastIP = ips[ips.length - 1];
        // Use first IP by default, but we'll let geolocation services handle proxy detection
        ipAddress = firstIP;
      }
    } else if (vercelForwarded) {
      // Vercel specific header
      const ips = vercelForwarded.split(",").map(ip => ip.trim()).filter(ip => ip);
      ipAddress = ips.length > 0 ? ips[0] : "";
    } else {
      // Fallback to other headers
      ipAddress = realIp || 
                  cfConnectingIp || // Cloudflare
                  clientIp || 
                  trueClientIp || // Some proxies
                  "";
    }
    
    // Log all IP-related headers for debugging
    let refererHostname = "none";
    if (referer) {
      try {
        refererHostname = new URL(referer).hostname;
      } catch {
        refererHostname = referer.substring(0, 50);
      }
    }
    
    console.log("IP Detection Debug:", {
      detectedIP: ipAddress || "none",
      referer: refererHostname,
      headers: {
        "x-forwarded-for": forwarded || "none",
        "x-vercel-forwarded-for": vercelForwarded || "none",
        "x-real-ip": realIp || "none",
        "cf-connecting-ip": cfConnectingIp || "none",
        "x-client-ip": clientIp || "none",
        "true-client-ip": trueClientIp || "none",
      }
    });

    // Parse URL parameters from CURRENT URL (the short link URL) - this is where UTM and fbclid are
    let currentUrlParams: URLSearchParams | undefined;
    let utmSource: string | undefined;
    let utmMedium: string | undefined;
    let utmCampaign: string | undefined;
    let utmContent: string | undefined;
    let utmTerm: string | undefined;
    let fbclid: string | undefined;
    
    // Parse current URL for UTM and tracking parameters
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

    // Also check referrer for UTM (in case they're in the referrer)
    if (referer && !utmSource) {
      try {
        const refererUrl = new URL(referer);
        const refererParams = refererUrl.searchParams;
        if (!utmSource) utmSource = refererParams.get("utm_source") || undefined;
        if (!utmMedium) utmMedium = refererParams.get("utm_medium") || undefined;
        if (!utmCampaign) utmCampaign = refererParams.get("utm_campaign") || undefined;
        if (!utmContent) utmContent = refererParams.get("utm_content") || undefined;
        if (!utmTerm) utmTerm = refererParams.get("utm_term") || undefined;
      } catch (e) {
        // Invalid URL, skip UTM parsing
      }
    }

    // Use internal UTM from link if URL UTM is not present
    if (link) {
      if (!utmSource && link.internalUtmSource) {
        utmSource = link.internalUtmSource;
        console.log("Using internal UTM source:", utmSource);
      }
      if (!utmMedium && link.internalUtmMedium) {
        utmMedium = link.internalUtmMedium;
      }
      if (!utmCampaign && link.internalUtmCampaign) {
        utmCampaign = link.internalUtmCampaign;
      }
      if (!utmContent && link.internalUtmContent) {
        utmContent = link.internalUtmContent;
      }
      if (!utmTerm && link.internalUtmTerm) {
        utmTerm = link.internalUtmTerm;
      }
    }

    // Parse user agent for device/browser info
    const { parseUserAgent, detectSocialSource } = await import("@/lib/utils");
    const deviceInfo = parseUserAgent(userAgent);
    
    // Additional bot detection from referrer (some services don't have obvious user agents)
    if (!deviceInfo.isBot && referer) {
      const refererLower = referer.toLowerCase();
      // Check for link preview services in referrer
      if (refererLower.includes('facebook.com') && refererLower.includes('l.php')) {
        deviceInfo.isBot = true;
        deviceInfo.botType = "Facebook Link Preview";
      } else if (refererLower.includes('t.co') || refererLower.includes('twitter.com')) {
        // Twitter link previews often come from t.co
        // But we can't be 100% sure, so we'll rely on user agent mostly
      }
    }
    
    // Detect social source - check referrer first (to distinguish Facebook vs Instagram when both have fbclid)
    // Priority: referrer > UTM > fbclid (as fallback)
    let socialSource: string | undefined;
    
    // First, check referrer to distinguish between Facebook and Instagram (both use fbclid)
    if (referer) {
      socialSource = detectSocialSource(referer, currentUrlParams);
      if (socialSource) {
        console.log(`✅ Detected social source via referrer: ${socialSource}`);
      }
    }
    
    // If no referrer match, check UTM parameters
    if (!socialSource && utmSource) {
      socialSource = detectSocialSource("", currentUrlParams);
      if (socialSource) {
        console.log(`✅ Detected social source via UTM: ${socialSource} (utm_source=${utmSource})`);
      }
    }
    
    // If still no match and fbclid is present, assume Facebook (but only as last resort)
    if (!socialSource && fbclid) {
      socialSource = "Facebook";
      console.log("✅ Detected Facebook via fbclid (no referrer/UTM match)");
    }
    
    console.log("Tracking data:", {
      fbclid: !!fbclid,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      socialSource,
      referer: referer ? (() => {
        try {
          return new URL(referer).hostname;
        } catch {
          return referer.substring(0, 50);
        }
      })() : "none",
    });
    
    // Do not perform geolocation during redirect; defer enrichment

    const { addDoc, collection, doc, updateDoc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    // Create click document - Firestore doesn't allow undefined values, so we filter them out
    const clickDataRaw: Record<string, any> = {
      linkId,
      timestamp: new Date(),
      isBot: deviceInfo.isBot || false,
      enrichmentStatus: "pending",
      enrichmentAttempts: 0,
    };

    // Only add fields that have actual values (not undefined)
    if (userAgent) clickDataRaw.userAgent = userAgent;
    if (referer) clickDataRaw.referrer = referer;
    if (ipAddress) clickDataRaw.ipAddress = ipAddress;
    if (deviceInfo.platform) clickDataRaw.platform = deviceInfo.platform;
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
    if (fbclid) clickDataRaw.fbclid = fbclid; // Store fbclid for Facebook attribution

    console.log("Creating click with data:", { linkId, timestamp: clickDataRaw.timestamp, fieldCount: Object.keys(clickDataRaw).length });
    const clickRef = await addDoc(collection(db, "clicks"), clickDataRaw);
    console.log("Click created successfully with ID:", clickRef.id);

    // Update link click count
    const linkRef = doc(db, "links", linkId);
    const linkDoc = await getDoc(linkRef);
    if (linkDoc.exists()) {
      const currentClicks = linkDoc.data()?.clicks || 0;
      await updateDoc(linkRef, {
        clicks: currentClicks + 1,
        updatedAt: new Date(),
      });
      console.log("Link click count updated:", currentClicks + 1);
    }
  } catch (error: any) {
    console.error("Error tracking click:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    // Don't throw - we don't want to block the redirect
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
    const { db } = await import("@/lib/firebase");
    const { addDoc, collection, doc, getDoc, updateDoc } = await import("firebase/firestore");
    
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer") || "";
    
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

    const { parseUserAgent, detectSocialSource } = await import("@/lib/utils");
    const deviceInfo = parseUserAgent(userAgent);
    
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

    console.log("Tracking click for URL:", currentUrl);
    
    const trackingPromise = trackClick(link.id, headersList, currentUrl, link);
    
    Promise.race([
      trackingPromise,
      new Promise((resolve) => setTimeout(() => resolve("timeout"), 100)),
    ]).then((result) => {
      if (result === "timeout") {
        console.warn("Click tracking timed out, continuing in background");
        trackingPromise.catch((err) => console.error("Background tracking failed:", err));
      } else {
        console.log("Click tracked successfully");
      }
    }).catch((error) => {
      console.error("Error in trackClick:", error);
    });

    return <LinkRedirect link={link} />;
  } else if (release) {
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

  notFound();
}

