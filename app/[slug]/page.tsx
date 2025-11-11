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
    
    // Get IP address
    const forwarded = headersList.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : headersList.get("x-real-ip") || "";

    // Parse user agent for device/browser info
    const { parseUserAgent, detectSocialSource, getLocationFromIP } = await import("@/lib/utils");
    const deviceInfo = parseUserAgent(userAgent);
    const socialSource = detectSocialSource(referer);
    
    // Get location from IP (with timeout to avoid blocking)
    let location = {};
    try {
      const locationPromise = getLocationFromIP(ipAddress);
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({}), 2000)); // 2 second timeout
      location = await Promise.race([locationPromise, timeoutPromise]);
    } catch (locationError) {
      console.error("Location fetch failed (non-critical):", locationError);
      // Continue without location data
    }

    const { addDoc, collection, doc, updateDoc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    // Create click document
    const clickData = {
      linkId,
      timestamp: new Date(),
      userAgent: userAgent || undefined,
      referrer: referer || undefined,
      ipAddress: ipAddress || undefined,
      country: location.country || undefined,
      city: location.city || undefined,
      region: location.region || undefined,
      platform: deviceInfo.platform || undefined,
      device: deviceInfo.device || undefined,
      deviceType: deviceInfo.deviceType || undefined,
      browser: deviceInfo.browser || undefined,
      os: deviceInfo.os || undefined,
      socialSource: socialSource || undefined,
      isBot: deviceInfo.isBot || false,
    };

    console.log("Creating click with data:", { linkId, ...clickData });
    await addDoc(collection(db, "clicks"), clickData);
    console.log("Click created successfully");

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
  // Track click - we'll await it briefly but with a timeout to not block too long
  Promise.race([
    trackClick(link.id, headersList),
    new Promise((resolve) => setTimeout(resolve, 3000)), // Max 3 seconds
  ]).catch((error) => {
    console.error("Error in trackClick promise:", error);
  });

  return <LinkRedirect link={link} />;
}

