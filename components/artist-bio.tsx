"use client";

import { useState, useEffect } from "react";
import { Artist, SocialLink } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

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
};

export default function ArtistBio({ artist }: ArtistBioProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [submitMessage, setSubmitMessage] = useState("");

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
      // Check if email already exists for this artist
      // Structure: newsletter/{artistName}/emails/{emailId}
      const newsletterRef = collection(db, "newsletter", artist.name, "emails");
      const q = query(newsletterRef, where("email", "==", email.toLowerCase().trim()));
      const existingEmails = await getDocs(q);

      if (!existingEmails.empty) {
        setSubmitStatus("error");
        setSubmitMessage("This email is already subscribed");
        setIsSubmitting(false);
        return;
      }

      // Add email to newsletter collection
      await addDoc(newsletterRef, {
        email: email.toLowerCase().trim(),
        subscribedAt: new Date(),
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

        .newsletter-form form {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 1rem;
          width: 100%;
          align-items: flex-start;
        }

        .newsletter-form .email-input {
          flex: 1;
          min-width: 200px;
        }

        .newsletter-form input[type="email"] {
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

        .newsletter-form input[type="email"]::placeholder {
          color: rgba(241, 241, 241, 0.5);
        }

        .newsletter-form input[type="email"]:focus {
          outline: none;
          border-color: var(--accent);
          background: rgba(253, 252, 252, 0.15);
        }

        .newsletter-form button[type="submit"] {
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
          white-space: nowrap;
        }

        .newsletter-form button[type="submit"]:hover:not(:disabled) {
          background: #1ed760;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(29, 185, 84, 0.3);
        }

        .newsletter-form button[type="submit"]:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .newsletter-form .response {
          flex-basis: 100%;
          text-align: center;
          margin-top: 1rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.9rem;
        }

        .newsletter-form .response.success {
          background: rgba(29, 185, 84, 0.2);
          color: #1ed760;
        }

        .newsletter-form .response.error {
          background: rgba(255, 0, 0, 0.2);
          color: #ff6b6b;
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

          .newsletter-form form {
            flex-direction: column;
          }

          .newsletter-form button[type="submit"] {
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

          .newsletter-form button[type="submit"]:hover:not(:disabled),
          .newsletter-form button[type="submit"]:active:not(:disabled),
          .newsletter-form button[type="submit"]:focus:not(:disabled) {
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

          .platforms {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .platform-tile {
            width: 100%;
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
          <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
            <div className="email-input">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isSubmitting}
              />
            </div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </button>
            {submitStatus && (
              <div className={`response ${submitStatus}`}>
                {submitMessage}
              </div>
            )}
          </form>
        </div>

        <div className="newsletter-divider"></div>

        {artist.bio && (
          <div className="bio-section">
            <p className="bio-text">{artist.bio}</p>
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
        </div>

        <div className="copyright">
          <p>Copyright &copy; {new Date().getFullYear()} {artist.name}. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}

