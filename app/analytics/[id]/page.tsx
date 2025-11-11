"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Click, Link as LinkType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AnalyticsPage() {
  const params = useParams();
  const linkId = params.id as string;
  const [link, setLink] = useState<LinkType | null>(null);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      // Load link
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

      // Load clicks
      const clicksRef = collection(db, "clicks");
      const q = query(
        clicksRef,
        where("linkId", "==", linkId),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const clicksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as Click[];
      setClicks(clicksData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [linkId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  const uniqueCountries = new Set(clicks.filter(c => c.country).map(c => c.country)).size;
  const socialClicks = clicks.filter(c => c.socialSource).length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">{link.title}</p>
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
              <p className="text-sm text-muted-foreground">Unique locations</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Social Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{socialClicks}</p>
              <p className="text-sm text-muted-foreground">From social media</p>
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

