import { redirect } from "next/navigation";
import { headers } from "next/headers";
import LinkRedirect from "@/components/link-redirect";

async function getLink(slug: string) {
  try {
    const { db } = await import("@/lib/firebase");
    const { collection, query, where, getDocs, limit } = await import("firebase/firestore");
    const linksRef = collection(db, "links");
    const q = query(linksRef, where("slug", "==", slug), where("isActive", "==", true), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error fetching link:", error);
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
    
    // Get location from IP (async, but we'll do it in background)
    const location = await getLocationFromIP(ipAddress);

    const { addDoc, collection, doc, updateDoc, getDoc } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    await addDoc(collection(db, "clicks"), {
      linkId,
      timestamp: new Date(),
      userAgent,
      referrer: referer || undefined,
      ipAddress: ipAddress || undefined,
      country: location.country,
      city: location.city,
      region: location.region,
      platform: deviceInfo.platform,
      device: deviceInfo.device,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      socialSource: socialSource,
      isBot: deviceInfo.isBot,
    });

    // Update link click count
    const linkRef = doc(db, "links", linkId);
    const linkDoc = await getDoc(linkRef);
    if (linkDoc.exists()) {
      const currentClicks = linkDoc.data()?.clicks || 0;
      await updateDoc(linkRef, {
        clicks: currentClicks + 1,
      });
    }
  } catch (error) {
    console.error("Error tracking click:", error);
  }
}

export default async function SlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const link = await getLink(params.slug);

  if (!link) {
    redirect("/404");
  }

  const headersList = await headers();
  await trackClick(link.id, headersList);

  return <LinkRedirect link={link} />;
}

