"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Click, Link as LinkType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useToast } from "@/components/ui/use-toast";

export default function AnalyticsPage() {
  const params = useParams();
  const linkId = params.id as string;
  const [link, setLink] = useState<LinkType | null>(null);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLocations, setUpdatingLocations] = useState(false);
  const { toast } = useToast();

  const loadLink = useCallback(async () => {
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const linkRef = doc(db, "links", linkId);
      const linkDoc = await getDoc(linkRef);
      
      if (linkDoc.exists()) {
        setLink({
          id: linkDoc.id,
          ...linkDoc.data(),
          createdAt: linkDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: linkDoc.data().updatedAt?.toDate() || new Date(),
        } as LinkType);
      }
    } catch (error) {
      console.error("Error loading link:", error);
    }
  }, [linkId]);

  useEffect(() => {
    loadLink();
    setLoading(true);

    // Set up real-time listener for clicks
    const clicksRef = collection(db, "clicks");
    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
      try {
        const q = query(
          clicksRef,
          where("linkId", "==", linkId),
          orderBy("timestamp", "desc")
        );

        // Real-time listener - automatically updates when new clicks are added
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const clicksData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as Click[];
            console.log(`✅ Loaded ${clicksData.length} clicks for link ${linkId}`);
            setClicks(clicksData);
            setLoading(false);
          },
          async (error) => {
            console.error("❌ Error listening to clicks:", error);
            if (error.code === "failed-precondition") {
              console.warn("⚠️ Index missing, trying fallback query without orderBy");
              // Fallback: query without orderBy
              try {
                const fallbackQuery = query(
                  clicksRef,
                  where("linkId", "==", linkId)
                );
                const fallbackSnapshot = await getDocs(fallbackQuery);
                const clicksData = fallbackSnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  timestamp: doc.data().timestamp?.toDate() || new Date(),
                })) as Click[];
                // Sort client-side
                clicksData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                console.log(`✅ Loaded ${clicksData.length} clicks (fallback query)`);
                setClicks(clicksData);
                setLoading(false);
                
                // Set up listener without orderBy
                unsubscribe = onSnapshot(
                  fallbackQuery,
                  (snapshot) => {
                    const data = snapshot.docs.map((doc) => ({
                      id: doc.id,
                      ...doc.data(),
                      timestamp: doc.data().timestamp?.toDate() || new Date(),
                    })) as Click[];
                    data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                    setClicks(data);
                  },
                  (err) => console.error("Fallback listener error:", err)
                );
              } catch (fallbackError) {
                console.error("❌ Fallback query also failed:", fallbackError);
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          }
        );
      } catch (error) {
        console.error("❌ Error setting up click listener:", error);
        setLoading(false);
      }
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [linkId, loadLink]);

  const getChartData = () => {
    const dateMap = new Map<string, number>();
    clicks.forEach((click) => {
      const date = formatDate(click.timestamp);
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    return Array.from(dateMap.entries())
      .map(([date, clicks]) => ({ date, clicks }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getDeviceData = () => {
    const deviceMap = new Map<string, number>();
    clicks.forEach((click) => {
      const device = click.device || "Unknown";
      deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
    });
    return Array.from(deviceMap.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getBrowserData = () => {
    const browserMap = new Map<string, number>();
    clicks.forEach((click) => {
      const browser = click.browser || "Unknown";
      browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
    });
    return Array.from(browserMap.entries())
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const getOSData = () => {
    const osMap = new Map<string, number>();
    clicks.forEach((click) => {
      const os = click.os || "Unknown";
      osMap.set(os, (osMap.get(os) || 0) + 1);
    });
    return Array.from(osMap.entries())
      .map(([os, count]) => ({ os, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getSocialSourceData = () => {
    const sourceMap = new Map<string, number>();
    clicks.forEach((click) => {
      if (click.socialSource) {
        sourceMap.set(click.socialSource, (sourceMap.get(click.socialSource) || 0) + 1);
      }
    });
    return Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getCountryData = () => {
    const countryMap = new Map<string, number>();
    clicks.forEach((click) => {
      if (click.country) {
        countryMap.set(click.country, (countryMap.get(click.country) || 0) + 1);
      }
    });
    return Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getCityData = () => {
    const cityMap = new Map<string, { count: number; country?: string }>();
    clicks.forEach((click) => {
      if (click.city) {
        const key = click.country ? `${click.city}, ${click.country}` : click.city;
        const existing = cityMap.get(key) || { count: 0, country: click.country };
        cityMap.set(key, { count: existing.count + 1, country: click.country });
      }
    });
    return Array.from(cityMap.entries())
      .map(([city, data]) => ({ city, count: data.count, country: data.country }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const getUTMData = () => {
    const utmMap = new Map<string, number>();
    clicks.forEach((click) => {
      if (click.utmSource) {
        utmMap.set(click.utmSource, (utmMap.get(click.utmSource) || 0) + 1);
      }
    });
    return Array.from(utmMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Link not found</div>
      </div>
    );
  }

  const chartData = getChartData();
  const deviceData = getDeviceData();
  const browserData = getBrowserData();
  const osData = getOSData();
  const socialSourceData = getSocialSourceData();
  const countryData = getCountryData();
  const cityData = getCityData();
  const utmData = getUTMData();
  const uniqueCountries = new Set(clicks.filter(c => c.country).map(c => c.country)).size;
  const uniqueCities = new Set(clicks.filter(c => c.city).map(c => `${c.city}, ${c.country || 'Unknown'}`)).size;
  const socialClicks = clicks.filter(c => c.socialSource).length;
  const utmClicks = clicks.filter(c => c.utmSource).length;
  
  // Count clicks with IP but no location
  const clicksWithoutLocation = clicks.filter(c => c.ipAddress && !c.country && !c.countryCode).length;

  const handleUpdateLocations = async () => {
    if (updatingLocations) return;
    
    setUpdatingLocations(true);
    toast({
      title: "Updating locations...",
      description: "Please wait while we process missing location data.",
    });

    try {
      const response = await fetch("/api/update-locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          linkId: linkId,
          batchSize: 50,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Locations updated!",
          description: `Successfully updated ${data.updated} clicks with location data.`,
        });
        // The real-time listener will automatically update the UI
      } else {
        toast({
          title: "Update failed",
          description: data.error || "Failed to update locations",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update locations",
        variant: "destructive",
      });
    } finally {
      setUpdatingLocations(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">{link.title}</p>
          </div>
          {clicksWithoutLocation > 0 && (
            <Button
              onClick={handleUpdateLocations}
              disabled={updatingLocations}
              variant="outline"
            >
              {updatingLocations ? "Updating..." : `Update ${clicksWithoutLocation} Missing Locations`}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{clicks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{uniqueCountries}</p>
              <p className="text-sm text-muted-foreground">{uniqueCities} cities</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Social Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{socialClicks}</p>
              <p className="text-sm text-muted-foreground">
                {utmClicks > 0 && `${utmClicks} with UTM`}
                {utmClicks === 0 && "From social media"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Link Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {link.isActive ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clicks Over Time</CardTitle>
            <CardDescription>Daily click statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="clicks" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No clicks yet
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Devices</CardTitle>
              <CardDescription>Click distribution by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {deviceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={deviceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Browsers</CardTitle>
              <CardDescription>Top browsers</CardDescription>
            </CardHeader>
            <CardContent>
              {browserData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={browserData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="browser" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operating Systems</CardTitle>
              <CardDescription>OS distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {osData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={osData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="os" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Sources</CardTitle>
              <CardDescription>Traffic from social platforms</CardDescription>
            </CardHeader>
            <CardContent>
              {socialSourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={socialSourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No social media traffic</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
              <CardDescription>Geographic distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {countryData.length > 0 ? (
                <div className="space-y-2">
                  {countryData.map((item) => (
                    <div key={item.country} className="flex justify-between items-center">
                      <span className="text-sm">{item.country}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No location data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Cities</CardTitle>
              <CardDescription>City-level distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {cityData.length > 0 ? (
                <div className="space-y-2">
                  {cityData.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{item.city}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No city data</p>
              )}
            </CardContent>
          </Card>

          {utmData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>UTM Sources</CardTitle>
                <CardDescription>Traffic sources from UTM parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {utmData.map((item) => (
                    <div key={item.source} className="flex justify-between items-center">
                      <span className="text-sm">{item.source}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Clicks</CardTitle>
            <CardDescription>Last 50 clicks with detailed information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clicks.slice(0, 50).map((click) => (
                <div
                  key={click.id}
                  className="flex justify-between items-start p-3 border rounded hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {formatDate(click.timestamp)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {click.country && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          🌍 {click.country}
                          {click.city && `, ${click.city}`}
                        </span>
                      )}
                      {click.device && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          📱 {click.device}
                          {click.deviceType && ` (${click.deviceType})`}
                        </span>
                      )}
                      {click.browser && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          🌐 {click.browser}
                        </span>
                      )}
                      {click.os && (
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          💻 {click.os}
                        </span>
                      )}
                      {click.socialSource && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          📱 {click.socialSource}
                        </span>
                      )}
                      {click.utmSource && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          🏷️ UTM: {click.utmSource}
                          {click.utmMedium && ` (${click.utmMedium})`}
                          {click.utmCampaign && ` - ${click.utmCampaign}`}
                          {click.utmContent && ` [${click.utmContent}]`}
                          {click.utmTerm && ` | Term: ${click.utmTerm}`}
                        </span>
                      )}
                      {click.fbclid && !click.utmSource && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                          📘 Facebook Click ID
                        </span>
                      )}
                      {click.isBot && (
                        <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                          🤖 Bot
                        </span>
                      )}
                    </div>
                  </div>
                  {click.referrer && !click.socialSource && (
                    <p className="text-xs text-muted-foreground ml-2 max-w-xs truncate">
                      From: {click.referrer}
                    </p>
                  )}
                </div>
              ))}
              {clicks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No clicks recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

