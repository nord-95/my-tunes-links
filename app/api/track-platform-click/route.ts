import { NextRequest, NextResponse } from "next/server";
import { lookupIP } from "@/lib/geoip";

function extractIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const vercelForwarded = req.headers.get("x-vercel-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (vercelForwarded) return vercelForwarded.split(",")[0].trim();
  return realIp || cfConnectingIp || "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { releaseId, clickType, platform, buttonLabel, url, userAgent, referrer, currentUrl } = body;

    if (!releaseId || !clickType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { parseUserAgent, detectSocialSource } = await import("@/lib/utils");
    const { addDoc, collection } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebase");

    const ipAddress = extractIP(req);
    const deviceInfo = parseUserAgent(userAgent || "");

    let urlParams: URLSearchParams | undefined;
    try {
      if (currentUrl) urlParams = new URL(currentUrl).searchParams;
    } catch {}

    const socialSource = detectSocialSource(referrer || "", urlParams);

    const utm: Record<string, string> = {};
    if (urlParams) {
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"]) {
        const val = urlParams.get(key);
        if (val) utm[key] = val;
      }
    }

    const geoData = await lookupIP(ipAddress);

    const clickData: Record<string, any> = {
      releaseId,
      timestamp: new Date(),
      clickType,
      isBot: deviceInfo.isBot || false,
    };

    if (platform) clickData.platform = platform;
    if (buttonLabel) clickData.buttonLabel = buttonLabel;
    if (url) clickData.url = url;
    if (userAgent) clickData.userAgent = userAgent;
    if (referrer) clickData.referrer = referrer;
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

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("track-platform-click error:", error.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
