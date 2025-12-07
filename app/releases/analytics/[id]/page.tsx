"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReleaseClick, Release } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Music } from "lucide-react";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042'];

export default function ReleaseAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const releaseId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [release, setRelease] = useState<Release | null>(null);
  const [clicks, setClicks] = useState<ReleaseClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingLocations, setUpdatingLocations] = useState(false);
  const { toast } = useToast();

  const loadRelease = useCallback(async () => {
    try {
      const releaseRef = doc(db, "releases", releaseId);
      const releaseDoc = await getDoc(releaseRef);
      
      if (releaseDoc.exists()) {
        const data = releaseDoc.data();
        setRelease({
          id: releaseDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Release);
      }
    } catch (error) {
      console.error("Error loading release:", error);
    }
  }, [releaseId]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth");
        return;
      }
      setUser(currentUser);
    });
    return () => unsubAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    loadRelease();
    setLoading(true);

    const clicksRef = collection(db, "releaseClicks");
    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
      try {
        const q = query(
          clicksRef,
          where("releaseId", "==", releaseId),
          orderBy("timestamp", "desc")
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const clicksData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as ReleaseClick[];
            setClicks(clicksData);
            setLoading(false);
          },
          async (error) => {
            console.error("Error listening to release clicks:", error);
            if (error.code === "failed-precondition") {
              try {
                const fallbackQuery = query(
                  clicksRef,
                  where("releaseId", "==", releaseId)
                );
                const fallbackSnapshot = await getDocs(fallbackQuery);
                const clicksData = fallbackSnapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  timestamp: doc.data().timestamp?.toDate() || new Date(),
                })) as ReleaseClick[];
                clicksData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                setClicks(clicksData);
                setLoading(false);
                
                unsubscribe = onSnapshot(
                  fallbackQuery,
                  (snapshot) => {
                    const data = snapshot.docs.map((doc) => ({
                      id: doc.id,
                      ...doc.data(),
                      timestamp: doc.data().timestamp?.toDate() || new Date(),
                    })) as ReleaseClick[];
                    data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                    setClicks(data);
                  },
                  (err) => console.error("Fallback listener error:", err)
                );
              } catch (fallbackError) {
                console.error("Fallback query failed:", fallbackError);
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          }
        );
      } catch (error) {
        console.error("Error setting up click listener:", error);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [releaseId, loadRelease, user]);

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

  const getClickTypeData = () => {
    const typeMap = new Map<string, number>();
    clicks.forEach((click) => {
      const type = click.clickType || "unknown";
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    return Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getPlatformData = () => {
    const platformMap = new Map<string, number>();
    clicks.forEach((click) => {
      if (click.clickType === "platform_click" && click.platform) {
        platformMap.set(click.platform, (platformMap.get(click.platform) || 0) + 1);
      }
    });
    return Array.from(platformMap.entries())
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);
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

  const getBotData = () => {
    const botMap = new Map<string, number>();
    clicks.forEach((click) => {
      if (click.isBot) {
        const botType = click.botType || "Unknown Bot";
        botMap.set(botType, (botMap.get(botType) || 0) + 1);
      }
    });
    return Array.from(botMap.entries())
      .map(([botType, count]) => ({ botType, count }))
      .sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Release not found</div>
      </div>
    );
  }

  const chartData = getChartData();
  const clickTypeData = getClickTypeData();
  const platformData = getPlatformData();
  const deviceData = getDeviceData();
  const browserData = getBrowserData();
  const osData = getOSData();
  const socialSourceData = getSocialSourceData();
  const countryData = getCountryData();
  const cityData = getCityData();
  const utmData = getUTMData();
  const botData = getBotData();
  
  const views = clicks.filter(c => c.clickType === "view").length;
  const platformClicks = clicks.filter(c => c.clickType === "platform_click").length;
  const buttonClicks = clicks.filter(c => c.clickType === "button_click").length;
  const uniqueCountries = new Set(clicks.filter(c => c.country).map(c => c.country)).size;
  const uniqueCities = new Set(clicks.filter(c => c.city).map(c => `${c.city}, ${c.country || 'Unknown'}`)).size;
  const socialClicks = clicks.filter(c => c.socialSource).length;
  const utmClicks = clicks.filter(c => c.utmSource).length;
  const botClicks = clicks.filter(c => c.isBot).length;
  const humanClicks = clicks.length - botClicks;
  const clicksWithoutLocation = clicks.filter(c => c.ipAddress && !c.country && !c.countryCode).length;

  const handleUpdateLocations = async () => {
    if (updatingLocations) return;
    
    setUpdatingLocations(true);
    toast({
      title: "Updating locations...",
      description: "Please wait while we process missing location data.",
    });

    try {
      const { auth } = await import("@/lib/firebase");
      const { onAuthStateChanged } = await import("firebase/auth");
      
      const user = await new Promise<any>((resolve) => {
        if (auth.currentUser) {
          resolve(auth.currentUser);
        } else {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
          });
        }
      });

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to update locations",
          variant: "destructive",
        });
        setUpdatingLocations(false);
        return;
      }

      const { collection, query, where, getDocs, updateDoc, doc, limit } = await import("firebase/firestore");
      const { getLocationFromIP } = await import("@/lib/utils");
      
      const clicksRef = collection(db, "releaseClicks");
      const q = query(
        clicksRef,
        where("releaseId", "==", releaseId),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const clicksToUpdate: Array<{ id: string; ipAddress: string }> = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const ipAddress = data.ipAddress;
        
        if (ipAddress && ipAddress.trim() && (!data.country && !data.countryCode)) {
          clicksToUpdate.push({
            id: docSnapshot.id,
            ipAddress: ipAddress.trim(),
          });
        }
      });

      if (clicksToUpdate.length === 0) {
        toast({
          title: "No updates needed",
          description: "All clicks already have location data.",
        });
        setUpdatingLocations(false);
        return;
      }

      const batchSize = 10;
      let updated = 0;
      let failed = 0;

      for (let i = 0; i < clicksToUpdate.length; i += batchSize) {
        const batch = clicksToUpdate.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(async (click) => {
            try {
              const location = await getLocationFromIP(click.ipAddress);
              
              if (location.country || location.countryCode) {
                const clickRef = doc(db, "releaseClicks", click.id);
                const updateData: Record<string, any> = {};
                
                if (location.country) updateData.country = location.country;
                if (location.city) updateData.city = location.city;
                if (location.region) updateData.region = location.region;
                if (location.countryCode) updateData.countryCode = location.countryCode;
                if (location.timezone) updateData.timezone = location.timezone;

                await updateDoc(clickRef, updateData);
                return { success: true };
              } else {
                return { success: false, reason: "No location data" };
              }
            } catch (error: any) {
              console.error(`Error updating click ${click.id}:`, error);
              return { success: false, error: error.message };
            }
          })
        );

        results.forEach((result) => {
          if (result.status === "fulfilled" && result.value.success) {
            updated++;
          } else {
            failed++;
          }
        });

        if (i + batchSize < clicksToUpdate.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      toast({
        title: "Locations updated!",
        description: `Successfully updated ${updated} clicks. ${failed > 0 ? `${failed} failed.` : ""}`,
      });
    } catch (error: any) {
      console.error("Error updating locations:", error);
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
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Release Analytics</h1>
            <p className="text-muted-foreground mt-1">
              <Music className="h-4 w-4 inline mr-1" />
              {release.artistName} - {release.releaseName}
            </p>
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
              <CardTitle>Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{views}</p>
              <p className="text-sm text-muted-foreground">
                Page views
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Platform Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{platformClicks}</p>
              <p className="text-sm text-muted-foreground">
                Music platform clicks
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{clicks.length}</p>
              <p className="text-sm text-muted-foreground">
                {humanClicks} human, {botClicks} bots
              </p>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interactions Over Time</CardTitle>
            <CardDescription>Daily interaction statistics</CardDescription>
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
                No interactions yet
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Click Types</CardTitle>
              <CardDescription>Breakdown by interaction type</CardDescription>
            </CardHeader>
            <CardContent>
              {clickTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={clickTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {clickTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data</p>
              )}
            </CardContent>
          </Card>

          {platformData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Music Platform Clicks</CardTitle>
                <CardDescription>Which platforms are most popular</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

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

          {socialSourceData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media Sources</CardTitle>
                <CardDescription>Traffic from social platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={socialSourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ff7300" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

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

          {botData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Bot Traffic</CardTitle>
                <CardDescription>Automated systems and crawlers detected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {botData.map((item) => (
                    <div key={item.botType} className="flex justify-between items-center">
                      <span className="text-sm">{item.botType}</span>
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
            <CardTitle>Recent Interactions</CardTitle>
            <CardDescription>Last 50 interactions with detailed information</CardDescription>
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
                      {formatDate(click.timestamp)} - {click.clickType}
                      {click.platform && ` (${click.platform})`}
                      {click.buttonLabel && ` - ${click.buttonLabel}`}
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
                      {click.isBot && (
                        <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded">
                          🤖 {click.botType || "Bot"}
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
                  No interactions recorded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

