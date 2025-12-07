"use client";

import { useEffect, useState } from "react";
import { Link } from "@/lib/types";

interface LinkRedirectProps {
  link: Link;
}

export default function LinkRedirect({ link }: LinkRedirectProps) {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Reduced redirect time to 200ms (0.2 seconds) for faster redirect
    // Still allows time for tracking to complete
    const timer = setTimeout(() => {
      if (!redirecting) {
        setRedirecting(true);
        window.location.href = link.destinationUrl;
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [redirecting, link.destinationUrl]);

  // Return a white page - no content displayed
  return <div className="min-h-screen bg-white" />;
}

