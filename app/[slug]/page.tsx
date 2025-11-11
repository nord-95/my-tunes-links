import { notFound } from "next/navigation";
import { headers } from "next/headers";
import LinkRedirect from "@/components/link-redirect";
import { Link } from "@/lib/types";

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

async function trackClick(linkId: string, headersList: Headers) {
  try {
    const userAgent = headersList.get("user-agent") || "";
    const referer = headersList.get("referer") || "";
    
    // Get IP address - check multiple headers for better accuracy
    const forwarded = headersList.get("x-forwarded-for");
    const ipAddress = forwarded 
      ? forwarded.split(",")[0].trim() 
      : headersList.get("x-real-ip") || 
        headersList.get("cf-connecting-ip") || // Cloudflare
        headersList.get("x-client-ip") || 
        "";

    // Parse URL parameters for UTM tracking
    let urlParams: URLSearchParams | undefined;
    let utmSource: string | undefined;
    let utmMedium: string | undefined;
    let utmCampaign: string | undefined;
    
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        urlParams = refererUrl.searchParams;
        utmSource = urlParams.get("utm_source") || undefined;
        utmMedium = urlParams.get("utm_medium") || undefined;
        utmCampaign = urlParams.get("utm_campaign") || undefined;
      } catch (e) {
        // Invalid URL, skip UTM parsing
      }
    }

    // Parse user agent for device/browser info
    const { parseUserAgent, detectSocialSource, getLocationFromIP } = await import("@/lib/utils");
    const deviceInfo = parseUserAgent(userAgent);
    // Pass URL params for better social source detection
    const socialSource = detectSocialSource(referer, urlParams);
    
    // Get location from IP (with timeout to avoid blocking)
    let location: { country?: string; city?: string; region?: string; countryCode?: string; timezone?: string } = {};
    try {
      const locationPromise = getLocationFromIP(ipAddress);
      const timeoutPromise = new Promise<typeof location>((resolve) => 
        setTimeout(() => resolve({}), 2500)
      ); // 2.5 second timeout for better accuracy
      location = await Promise.race([locationPromise, timeoutPromise]);
    } catch (locationError) {
      console.error("Location fetch failed (non-critical):", locationError);
      // Continue without location data
    }

    const { addDoc, collection, doc, updateDoc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    // Create click document - Firestore doesn't allow undefined values, so we filter them out
    const clickDataRaw: Record<string, any> = {
      linkId,
      timestamp: new Date(),
      isBot: deviceInfo.isBot || false,
    };

    // Only add fields that have actual values (not undefined)
    if (userAgent) clickDataRaw.userAgent = userAgent;
    if (referer) clickDataRaw.referrer = referer;
    if (ipAddress) clickDataRaw.ipAddress = ipAddress;
    if (location.country) clickDataRaw.country = location.country;
    if (location.city) clickDataRaw.city = location.city;
    if (location.region) clickDataRaw.region = location.region;
    if (location.countryCode) clickDataRaw.countryCode = location.countryCode;
    if (location.timezone) clickDataRaw.timezone = location.timezone;
    if (deviceInfo.platform) clickDataRaw.platform = deviceInfo.platform;
    if (deviceInfo.device) clickDataRaw.device = deviceInfo.device;
    if (deviceInfo.deviceType) clickDataRaw.deviceType = deviceInfo.deviceType;
    if (deviceInfo.browser) clickDataRaw.browser = deviceInfo.browser;
    if (deviceInfo.os) clickDataRaw.os = deviceInfo.os;
    if (socialSource) clickDataRaw.socialSource = socialSource;
    if (utmSource) clickDataRaw.utmSource = utmSource;
    if (utmMedium) clickDataRaw.utmMedium = utmMedium;
    if (utmCampaign) clickDataRaw.utmCampaign = utmCampaign;

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

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await getLink(slug);

  if (!link) {
    notFound();
  }

  const headersList = await headers();
  // Track click - try to save it but don't block redirect for too long
  // We'll use a timeout but still try to save in the background
  const trackingPromise = trackClick(link.id, headersList);
  
  // Wait up to 2 seconds for tracking, then continue with redirect
  Promise.race([
    trackingPromise,
    new Promise((resolve) => setTimeout(() => resolve("timeout"), 2000)),
  ]).then((result) => {
    if (result === "timeout") {
      console.warn("Click tracking timed out, continuing in background");
      // Continue tracking in background
      trackingPromise.catch((err) => console.error("Background tracking failed:", err));
    } else {
      console.log("Click tracked successfully");
    }
  }).catch((error) => {
    console.error("Error in trackClick:", error);
  });

  return <LinkRedirect link={link} />;
}

