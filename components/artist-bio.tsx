"use client";

import { useState, useEffect } from "react";
import { Artist, SocialLink } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";

interface ArtistBioProps {
  artist: Artist;
}

const PLATFORM_LOGOS: Record<string, string> = {
  instagram: "https://services.linkfire.com/logo_instagram_onlight.svg",
  twitter: "https://services.linkfire.com/logo_twitter_onlight.svg",
  facebook: "https://services.linkfire.com/logo_facebook_onlight.svg",
  youtube: "https://services.linkfire.com/logo_youtube_onlight.svg",
  tiktok: "https://services.linkfire.com/logo_tiktok_onlight.svg",
  soundcloud: "https://services.linkfire.com/logo_soundcloud_onlight.svg",
  spotify: "https://services.linkfire.com/logo_spotify_onlight.svg",
  "apple-music": "https://services.linkfire.com/logo_applemusic_onlight.svg",
  tidal: "https://services.linkfire.com/logo_tidal_onlight.svg",
  deezer: "https://services.linkfire.com/logo_deezer_onlight.svg",
  "amazon-music": "https://services.linkfire.com/logo_amazonmusic_onlight.svg",
  pandora: "https://services.linkfire.com/logo_pandora_onlight.svg",
  bandcamp: "https://services.linkfire.com/logo_bandcamp_onlight.svg",
  twitch: "https://services.linkfire.com/logo_twitch_onlight.svg",
  "text-me": "https://services.linkfire.com/logo_text-me_onlight.svg",
};

export default function ArtistBio({ artist }: ArtistBioProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    // Neon flicker effect for logo-container
    const neonFlicker = () => {
      const logoContainer = document.querySelector('.logo-container');
      if (!logoContainer) return;

      const flickerIntensities = [
        'drop-shadow(0 0 5px rgba(80, 250, 254, 0.4))',
        'drop-shadow(0 0 8px rgba(80, 250, 254, 0.5))',
        'drop-shadow(0 0 10px rgba(80, 250, 254, 0.6))',
        'drop-shadow(0 0 6px rgba(80, 250, 254, 0.45))',
        'drop-shadow(0 0 9px rgba(80, 250, 254, 0.55))',
        'drop-shadow(0 0 7px rgba(80, 250, 254, 0.5))',
        'drop-shadow(0 0 8px rgba(80, 250, 254, 0.5))',
        'drop-shadow(0 0 6px rgba(80, 250, 254, 0.45))'
      ];

      const opacityValues = [0.95, 0.98, 1.0, 0.97, 0.99, 0.96, 1.0, 0.98];
      
      function flicker() {
        if (logoContainer && (logoContainer as HTMLElement).style.display !== 'none') {
          const randomIntensity = flickerIntensities[Math.floor(Math.random() * flickerIntensities.length)];
          const randomOpacity = opacityValues[Math.floor(Math.random() * opacityValues.length)];
          (logoContainer as HTMLElement).style.filter = randomIntensity;
          (logoContainer as HTMLElement).style.opacity = String(randomOpacity);
        }
        
        const nextFlicker = 50 + Math.random() * 150;
        setTimeout(flicker, nextFlicker);
      }
      
      setTimeout(flicker, 1000);
    };

    neonFlicker();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setSubmitStatus("error");
      setSubmitMessage("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      const newsletterRef = collection(db, "newsletter", artist.name, "emails");
      const q = query(newsletterRef, where("email", "==", email.toLowerCase().trim()));
      const existingEmails = await getDocs(q);

      if (!existingEmails.empty) {
        setSubmitStatus("error");
        setSubmitMessage("This email is already subscribed");
        setIsSubmitting(false);
        return;
      }

      await addDoc(newsletterRef, {
        email: email.toLowerCase().trim(),
        subscribedAt: Timestamp.now(),
        artistName: artist.name,
        artistId: artist.id,
      });

      setSubmitStatus("success");
      setSubmitMessage("Thank you for subscribing!");
      setEmail("");
    } catch (error: any) {
      console.error("Error subscribing to newsletter:", error);
      setSubmitStatus("error");
      setSubmitMessage("Failed to subscribe. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlatformLogo = (platform: string): string => {
    const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, "-");
    return PLATFORM_LOGOS[normalizedPlatform] || "https://services.linkfire.com/logo_spotify_onlight.svg";
  };

  const toggleBio = () => {
    setShowFullBio(!showFullBio);
  };

  // Split bio into preview and full text (first 100 chars as preview)
  const bioPreview = artist.bio ? artist.bio.substring(0, 100) : "";
  const bioFull = artist.bio && artist.bio.length > 100 ? artist.bio.substring(100) : "";

  return (
    <>
      <style jsx>{`
        :root {
          --bg-dark: #0e0e0e;
          --text-light: #f1f1f1;
          --accent: #1db954;
          --card-bg: #fdfcfc;
          --shadow: rgba(0, 0, 0, 0.5);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
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
          background: url('${artist.profileImageUrl || ""}') no-repeat center center;
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

        .container {
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

        .newsletter-section {
          width: 100%;
          max-width: 800px;
          margin-bottom: 1.5rem;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease forwards;
          animation-delay: 0.4s;
        }

        .newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }

        .newsletter-form #mc_embed_signup_scroll {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 1rem;
          width: 100%;
          align-items: flex-start;
        }

        .newsletter-form #mce-responses {
          flex-basis: 100%;
          order: 3;
        }

        .newsletter-form .mc-field-group {
          order: 1;
        }

        .newsletter-form .clear {
          order: 2;
        }

        .newsletter-form input[type="email"],
        .newsletter-form #mce-EMAIL {
          width: 100%;
          padding: 1rem;
          border: 2px solid rgba(241, 241, 241, 0.2);
          border-radius: 0.75rem;
          background: rgba(253, 252, 252, 0.1);
          color: var(--text-light);
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .newsletter-form input[type="email"]::placeholder,
        .newsletter-form #mce-EMAIL::placeholder {
          color: rgba(241, 241, 241, 0.5);
        }

        .newsletter-form input[type="email"]:focus,
        .newsletter-form #mce-EMAIL:focus {
          outline: none;
          border-color: var(--accent);
          background: rgba(253, 252, 252, 0.15);
        }

        .newsletter-form input[type="submit"],
        .newsletter-form #mc-embedded-subscribe {
          width: 100%;
          padding: 1rem 2rem;
          background: var(--accent);
          color: #ffffff;
          border: none;
          border-radius: 0.75rem;
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .newsletter-form input[type="submit"]:hover,
        .newsletter-form #mc-embedded-subscribe:hover {
          background: #1ed760;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(29, 185, 84, 0.3);
        }

        .newsletter-form .mc-field-group {
          flex: 1;
        }

        .newsletter-form .clear {
          flex-shrink: 0;
        }

        .newsletter-form input[type="email"],
        .newsletter-form #mce-EMAIL {
          width: 100%;
        }

        .newsletter-form input[type="submit"],
        .newsletter-form #mc-embedded-subscribe {
          width: auto;
          min-width: 150px;
          white-space: nowrap;
        }

        .newsletter-form #mce-responses {
          text-align: center;
          margin-top: 1rem;
        }

        .newsletter-form #mce-error-response,
        .newsletter-form #mce-success-response {
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }

        .newsletter-form #mce-error-response {
          background: rgba(255, 0, 0, 0.2);
          color: #ff6b6b;
        }

        .newsletter-form #mce-success-response {
          background: rgba(29, 185, 84, 0.2);
          color: #1ed760;
        }

        #mc_embed_signup_scroll {
          width: 100%;
        }

        .newsletter-divider {
          width: 100%;
          max-width: 800px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(241, 241, 241, 0.3), transparent);
          margin: 1rem 0;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease forwards;
          animation-delay: 0.5s;
        }

        .platforms {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1.5rem;
          width: 100%;
          max-width: 800px;
        }

        .platform-divider {
          grid-column: 1 / -1;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(241, 241, 241, 0.3), transparent);
          margin: 1rem 0;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease forwards;
          animation-delay: 0.9s;
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

        .new-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff0000;
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          text-transform: uppercase;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .new {
          animation: zoomInOut 1.5s ease-in-out infinite;
        }

        @keyframes zoomInOut {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .bio-section {
          width: 100%;
          max-width: 800px;
          margin-bottom: 3rem;
          text-align: center;
          opacity: 0;
          transform: translateY(20px);
          animation: fadeInUp 0.8s ease forwards;
          animation-delay: 0.2s;
        }

        .bio-text {
          color: var(--text-light);
          font-size: 1rem;
          line-height: 1.6;
          margin-bottom: 0.5rem;
        }

        .bio-full {
          display: none;
          opacity: 0;
          transform: translateY(-10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .bio-full.show {
          display: inline;
          animation: fadeInSlide 0.6s ease forwards;
        }

        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .read-more {
          color: #ffffff;
          cursor: pointer;
          text-decoration: underline;
          font-weight: 600;
          margin-left: 0.25rem;
          transition: all 0.3s ease;
        }

        .read-more:hover {
          opacity: 0.7;
          transform: scale(1.05);
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

        .photo-container {
          position: relative;
        }

        .logo {
          width: 100%;
          max-width: 360px;
          height: auto;
          position: relative;
          transform: translateY(-50%);
          margin-top: 0;
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
            background: linear-gradient(to bottom, transparent 40%, #000000 90%);
            pointer-events: none;
            z-index: 1;
          }

          .container {
            padding-top: 40px;
          }

          .album-art {
            border-radius: 0;
            max-width: 100%;
            width: 100vw;
            margin-left: calc(-2rem);
            margin-right: calc(-2rem);
          }

          .newsletter-section {
            margin-bottom: 1rem;
          }

          .newsletter-form .clear {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .newsletter-form input[type="submit"],
          .newsletter-form #mc-embedded-subscribe {
            width: 50px;
            height: 50px;
            padding: 0;
            border-radius: 50%;
            min-width: 50px;
            font-size: 0;
            color: transparent;
            text-indent: -9999px;
            overflow: hidden;
            position: relative;
            background: var(--accent);
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='5' y1='12' x2='19' y2='12'%3E%3C/line%3E%3Cpolyline points='12 5 19 12 12 19'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: center;
            background-size: 20px 20px;
            -webkit-appearance: none;
            appearance: none;
            transition: none;
          }

          .newsletter-form input[type="submit"]:hover,
          .newsletter-form input[type="submit"]:active,
          .newsletter-form input[type="submit"]:focus,
          .newsletter-form #mc-embedded-subscribe:hover,
          .newsletter-form #mc-embedded-subscribe:active,
          .newsletter-form #mc-embedded-subscribe:focus {
            transform: none;
            box-shadow: none;
            background: #ffffff;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%231db954' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='5' y1='12' x2='19' y2='12'%3E%3C/line%3E%3Cpolyline points='12 5 19 12 12 19'%3E%3C/polyline%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: center;
            background-size: 20px 20px;
          }

          .newsletter-divider {
            margin: 0.75rem 0;
          }

          .platform-divider {
            margin: 0.75rem 0;
          }
        }
      `}</style>

      <div className="photo-container">
        <img
          src={artist.profileImageUrl || ""}
          alt={`${artist.name} - Profile Photo`}
          className="album-art"
          id="album-art-mobile"
        />
      </div>
      <div className="container">
        <img
          src={artist.profileImageUrl || ""}
          alt={`${artist.name} - Profile Photo`}
          className="album-art"
          id="album-art-desktop"
        />
        {artist.profileImageUrl && (
          <div className="logo-container">
            <img src={artist.profileImageUrl} alt={`${artist.name} - Logo`} className="logo" />
          </div>
        )}
        <div className="text-group">
          <h1>{artist.name}</h1>
          {artist.bio && <p>{artist.bio.substring(0, 50)}...</p>}
        </div>

        <div className="newsletter-section">
          <div id="mc_embed_shell">
            <div id="mc_embed_signup">
              <form onSubmit={handleNewsletterSubmit} className="validate newsletter-form" noValidate>
                <div id="mc_embed_signup_scroll">
                  <div className="indicates-required" style={{ display: 'none' }}>
                    <span className="asterisk">*</span> indicates required
                  </div>
                  <div className="mc-field-group">
                    <label htmlFor="mce-EMAIL" style={{ display: 'none' }}>
                      Email Address <span className="asterisk">*</span>
                    </label>
                    <input
                      type="email"
                      name="EMAIL"
                      className="required email"
                      id="mce-EMAIL"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={isSubmitting}
                    />
                    <span id="mce-EMAIL-HELPERTEXT" className="helper_text" style={{ display: 'none' }}>
                      Required Field
                    </span>
                  </div>
                  <div id="mce-responses" className="clear">
                    <div className="response" id="mce-error-response" style={{ display: submitStatus === 'error' ? 'block' : 'none' }}>
                      {submitStatus === 'error' && submitMessage}
                    </div>
                    <div className="response" id="mce-success-response" style={{ display: submitStatus === 'success' ? 'block' : 'none' }}>
                      {submitStatus === 'success' && submitMessage}
                    </div>
                  </div>
                  <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
                    <input type="text" name="b_placeholder" tabIndex={-1} value="" />
                  </div>
                  <div className="clear">
                    <input
                      type="submit"
                      name="subscribe"
                      id="mc-embedded-subscribe"
                      className="button"
                      value={isSubmitting ? "Subscribing..." : "Subscribe"}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="newsletter-divider"></div>

        {artist.bio && (
          <div className="bio-section">
            <p className="bio-text">
              {bioFull ? (
                <>
                  <span className="bio-preview">{bioPreview}</span>
                  <span className={`bio-full ${showFullBio ? 'show' : ''}`}>{bioFull}</span>
                  {!showFullBio && <span className="bio-ellipsis">...</span>}
                  <span className="read-more" onClick={toggleBio}>
                    {showFullBio ? 'Read Less' : 'Read More'}
                  </span>
                </>
              ) : (
                artist.bio
              )}
            </p>
          </div>
        )}

        <div className="platforms">
          {artist.website && (
            <a href={artist.website} target="_blank" rel="noopener noreferrer" className="platform-tile">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="2" fill="none"/>
                <line x1="2" y1="12" x2="22" y2="12" stroke="#000" strokeWidth="2"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#000" strokeWidth="2" fill="none"/>
              </svg>
            </a>
          )}
          {artist.socialLinks && artist.socialLinks.map((link: SocialLink, index: number) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="platform-tile"
            >
              <img src={getPlatformLogo(link.platform)} alt={link.platform} />
            </a>
          ))}
          {(artist.website || (artist.socialLinks && artist.socialLinks.length > 0)) && (
            <div className="platform-divider"></div>
          )}
        </div>

        <div className="copyright">
          <p>Copyright &copy; {new Date().getFullYear()} {artist.name}. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}
