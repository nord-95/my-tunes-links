"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, MusicLink } from "@/lib/types";
import { getPlatformIcon } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

interface LinkRedirectProps {
  link: Link;
}

export default function LinkRedirect({ link }: LinkRedirectProps) {
  const [countdown, setCountdown] = useState(5);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!redirecting) {
      setRedirecting(true);
      window.location.href = link.destinationUrl;
    }
  }, [countdown, redirecting, link.destinationUrl]);

  const handleRedirect = () => {
    setRedirecting(true);
    window.location.href = link.destinationUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{link.title}</CardTitle>
          {link.description && (
            <CardDescription>{link.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg mb-2">
              Redirecting in {countdown} seconds...
            </p>
            <Button onClick={handleRedirect} className="w-full">
              Go Now <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {link.musicLinks && link.musicLinks.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">Available on:</p>
              <div className="grid grid-cols-2 gap-2">
                {link.musicLinks.map((musicLink: MusicLink, index: number) => (
                  <a
                    key={index}
                    href={musicLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border rounded hover:bg-accent transition-colors"
                  >
                    <span className="text-xl">
                      {getPlatformIcon(musicLink.platform)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium capitalize">
                        {musicLink.platform.replace("-", " ")}
                      </p>
                      {musicLink.title && (
                        <p className="text-xs text-muted-foreground">
                          {musicLink.title}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

