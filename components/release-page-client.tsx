"use client";

import { useEffect } from "react";
import { Release, MusicLink } from "@/lib/types";

interface ReleasePageClientProps {
  release: Release;
}

const PLATFORM_LOGOS: Record<string, string> = {
  spotify: "https://services.linkfire.com/logo_spotify_onlight.svg",
  "apple-music": "https://services.linkfire.com/logo_applemusic_onlight.svg",
  "youtube-music": "https://services.linkfire.com/logo_youtube_onlight.svg",
  soundcloud: "https://services.linkfire.com/logo_soundcloud_onlight.svg",
  deezer: "https://services.linkfire.com/logo_deezer_onlight.svg",
  tidal: "https://services.linkfire.com/logo_tidal_onlight.svg",
  "amazon-music": "https://services.linkfire.com/logo_amazonmusic_onlight.svg",
  pandora: "https://services.linkfire.com/logo_pandora_onlight.svg",
};

async function trackButtonClick(
  releaseId: string,
  clickType: "button_click" | "platform_click",
  buttonLabel?: string,
  platform?: string,
  url?: string
) {
  try {
    const { db } = await import("@/lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    const { parseUserAgent, detectSocialSource } = await import("@/lib/utils");
    
    const clickData: any = {
      releaseId,
      timestamp: new Date(),
      clickType,
      enrichmentStatus: "pending",
      enrichmentAttempts: 0,
    };

    if (buttonLabel) clickData.buttonLabel = buttonLabel;
    if (platform) clickData.platform = platform;
    if (url) clickData.url = url;

    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent;
      const referrer = document.referrer || "";
      
      clickData.userAgent = userAgent;
      clickData.referrer = referrer;

      // Parse user agent for device/browser/OS info
      const deviceInfo = parseUserAgent(userAgent);
      
      if (deviceInfo.platform) clickData.platform_type = deviceInfo.platform;
      if (deviceInfo.device) clickData.device = deviceInfo.device;
      if (deviceInfo.deviceType) clickData.deviceType = deviceInfo.deviceType;
      if (deviceInfo.browser) clickData.browser = deviceInfo.browser;
      if (deviceInfo.os) clickData.os = deviceInfo.os;
      if (deviceInfo.isBot) clickData.isBot = deviceInfo.isBot;
      if (deviceInfo.botType) clickData.botType = deviceInfo.botType;

      // Parse URL for UTM parameters
      try {
        const currentUrl = window.location.href;
        const urlObj = new URL(currentUrl);
        const params = urlObj.searchParams;
        
        const utmSource = params.get("utm_source");
        const utmMedium = params.get("utm_medium");
        const utmCampaign = params.get("utm_campaign");
        const utmContent = params.get("utm_content");
        const utmTerm = params.get("utm_term");
        const fbclid = params.get("fbclid");

        if (utmSource) clickData.utmSource = utmSource;
        if (utmMedium) clickData.utmMedium = utmMedium;
        if (utmCampaign) clickData.utmCampaign = utmCampaign;
        if (utmContent) clickData.utmContent = utmContent;
        if (utmTerm) clickData.utmTerm = utmTerm;
        if (fbclid) clickData.fbclid = fbclid;

        // Detect social source
        let socialSource: string | undefined;
        if (referrer) {
          socialSource = detectSocialSource(referrer, params);
        }
        if (!socialSource && utmSource) {
          socialSource = detectSocialSource("", params);
        }
        if (!socialSource && fbclid) {
          socialSource = "Facebook";
        }
        if (socialSource) clickData.socialSource = socialSource;
      } catch (e) {
        console.warn("Failed to parse URL for tracking:", e);
      }
    }

    await addDoc(collection(db, "releaseClicks"), clickData);
  } catch (error) {
    console.error("Error tracking button click:", error);
  }
}

export default function ReleasePageClient({ release }: ReleasePageClientProps) {
  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --bg-dark: #0e0e0e;
        --text-light: #f1f1f1;
        --accent: #1db954;
        --card-bg: #fdfcfc;
        --shadow: rgba(0, 0, 0, 0.5);
      }

      body {
        color: var(--text-light);
        font-family: 'Inter', sans-serif;
        position: relative;
        min-height: 100vh;
        background-color: #0e0e0e;
        overflow-x: hidden;
      }

      body::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: url('${release.artworkUrl}') no-repeat center center;
        background-size: cover;
        filter: blur(50px);
        transform: scale(1.5);
        z-index: -2;
      }

      body::after {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), #0e0e0e 80%);
        z-index: -1;
      }

      .release-container {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem;
      }

      .album-art {
        width: 100%;
        max-width: 400px;
        border-radius: 1.5rem;
        box-shadow: 0 10px 40px var(--shadow);
        margin-bottom: 2rem;
      }

      #album-art-mobile {
        display: none;
      }

      #album-art-desktop {
        opacity: 0;
        transform: translateY(-20px);
        animation: fadeInUp 0.8s ease forwards;
        animation-delay: 0.1s;
      }

      .text-group {
        text-align: center;
        margin-bottom: 3rem;
        opacity: 0;
        transform: translateY(-20px);
        animation: fadeInUp 0.8s ease forwards;
        animation-delay: 0.3s;
      }

      .text-group h1 {
        font-size: 2.25rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
      }

      .text-group p {
        font-size: 1.25rem;
        color: #ccc;
      }

      .photo-container {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        opacity: 0;
        transform: translateY(-20px);
        animation: fadeInUp 0.8s ease forwards;
        animation-delay: 0.1s;
      }

      .logo-container {
        display: none;
        z-index: 1;
        flex-direction: column;
        align-items: center;
        margin-bottom: 2rem;
        position: absolute;
        left: 50%;
        top: -40px;
        margin-top: 0;
        opacity: 0;
        transform: translateX(calc(-50% - 100px));
        transform-origin: center center;
        animation: logoSlideIn 0.8s ease-out forwards;
        animation-delay: 0.2s;
        filter: drop-shadow(0 0 5px rgba(80, 250, 254, 0.5));
        transition: filter 0.1s ease, opacity 0.1s ease;
      }

      @keyframes logoSlideIn {
        0% {
          opacity: 0;
          transform: translateX(calc(-50% - 100px));
        }
        100% {
          opacity: 1;
          transform: translateX(-50%);
        }
      }

      .logo {
        width: 100%;
        max-width: 360px;
        height: auto;
        position: relative;
        transform: translateY(-50%);
        margin-top: 0;
      }

      .platforms {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1.5rem;
        width: 100%;
        max-width: 800px;
      }

      .mobile-text-group {
        display: none;
      }

      .platform-tile {
        background: var(--card-bg);
        border-radius: 1rem;
        padding: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.8s ease forwards;
        position: relative;
        cursor: pointer;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        text-decoration: none;
        pointer-events: auto;
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1);
      }

      .platform-tile:nth-child(1) { animation-delay: 0.6s; }
      .platform-tile:nth-child(2) { animation-delay: 0.65s; }
      .platform-tile:nth-child(3) { animation-delay: 0.7s; }
      .platform-tile:nth-child(4) { animation-delay: 0.75s; }
      .platform-tile:nth-child(5) { animation-delay: 0.8s; }
      .platform-tile:nth-child(6) { animation-delay: 1.0s; }
      .platform-tile:nth-child(7) { animation-delay: 1.05s; }
      .platform-tile:nth-child(8) { animation-delay: 1.1s; }
      .platform-tile:nth-child(9) { animation-delay: 1.15s; }
      .platform-tile:nth-child(10) { animation-delay: 1.2s; }
      .platform-tile:nth-child(11) { animation-delay: 1.25s; }
      .platform-tile:nth-child(12) { animation-delay: 1.3s; }
      .platform-tile:nth-child(13) { animation-delay: 1.35s; }

      .platform-tile:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px var(--shadow);
      }

      .platform-tile img {
        max-width: 100px;
        height: auto;
      }

      .copyright {
        text-align: center;
        color: rgba(241, 241, 241, 0.6);
        font-size: 0.875rem;
        margin-top: 3rem;
        padding: 1rem;
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp 0.8s ease forwards;
        animation-delay: 1.8s;
      }

      @keyframes fadeInUp {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        body {
          background-color: #000000;
        }

        body::before {
          display: none;
        }

        body::after {
          display: none;
        }

        .logo-container {
          display: flex;
        }

        .text-group {
          display: none;
        }

        .mobile-text-group {
          display: block;
          text-align: center;
          margin-bottom: 2rem;
          padding: 0 1rem;
          padding-bottom: 0px;
          position: relative;
          top: -80px;
          z-index: 2;
        }

        .mobile-text-group h1 {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: var(--text-light);
        }

        .mobile-text-group p {
          font-size: 1.125rem;
          color: #ccc;
        }

        #album-art-desktop {
          display: none;
        }

        #album-art-mobile {
          display: block;
        }

        .photo-container::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to bottom, transparent 30%, rgba(0, 0, 0, 0.3) 50%, #000000 85%);
          pointer-events: none;
          z-index: 1;
        }

        .release-container {
          padding-top: 0;
          padding: 0;
          position: relative;
          top: -70px;
          z-index: 5;
        }

        .album-art {
          border-radius: 0;
          max-width: 100%;
          width: 100vw;
          margin-left: calc(-2rem);
          margin-right: calc(-2rem);
        }

        .platforms {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          padding: 0 1rem;
          position: relative;
          z-index: 10;
        }

        .platform-tile {
          width: 100%;
          padding: 1.25rem;
          position: relative;
          z-index: 10;
          pointer-events: auto;
          -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1);
        }
      }
    `;
    document.head.appendChild(style);

    // Set copyright year
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear().toString();
    }

    return () => {
      if (link.parentNode) document.head.removeChild(link);
      if (style.parentNode) document.head.removeChild(style);
    };
  }, [release.artworkUrl]);

  const handlePlatformClick = async (link: MusicLink) => {
    // Track click (don't wait for it to complete)
    trackButtonClick(
      release.id,
      "platform_click",
      link.platform,
      link.platform,
      link.url
    ).catch(err => console.error("Tracking error:", err));
    
    // Open link immediately
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  // Get release year from createdAt
  const releaseYear = release.createdAt instanceof Date 
    ? release.createdAt.getFullYear() 
    : new Date(release.createdAt).getFullYear();
  
  // Format artist name with release type and year
  const artistInfo = `${release.artistName} · ${release.releaseType} · ${releaseYear}`;

  return (
    <>
      <div className="photo-container">
        <img
          src={release.artworkUrl}
          alt={`${release.artistName} - ${release.releaseName}`}
          className="album-art"
          id="album-art-mobile"
        />
      </div>
      {!release.artistLogoUrl && (
        <div className="mobile-text-group">
          <h1>{release.releaseName}</h1>
          <p>{artistInfo}</p>
        </div>
      )}
      <div className="release-container">
        <img
          src={release.artworkUrl}
          alt={`${release.artistName} - ${release.releaseName}`}
          className="album-art"
          id="album-art-desktop"
        />
        {release.artistLogoUrl && (
          <div className="logo-container">
            <img src={release.artistLogoUrl} alt={`${release.artistName} Logo`} className="logo" />
          </div>
        )}
        {release.artistLogoUrl && (
          <div className="mobile-text-group">
            <h1>{release.releaseName}</h1>
            <p>{artistInfo}</p>
          </div>
        )}
        <div className="text-group">
          <h1>{release.releaseName}</h1>
          <p>{artistInfo}</p>
        </div>

        {release.musicLinks && release.musicLinks.length > 0 && (
          <div className="platforms">
            {release.musicLinks.map((link: MusicLink, index: number) => {
              const logoUrl = PLATFORM_LOGOS[link.platform] || "";
              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="platform-tile"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePlatformClick(link);
                  }}
                  onTouchStart={(e) => {
                    // Ensure touch events work on mobile
                    e.currentTarget.style.opacity = "0.8";
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {logoUrl && <img src={logoUrl} alt={link.platform} />}
                </a>
              );
            })}
          </div>
        )}

        <div className="copyright">
          <p>Copyright &copy; <span id="year"></span> {release.artistName}. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}
