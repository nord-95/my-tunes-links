"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    loadData();
  }, [linkId]);

  const loadData = async () => {
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
  };

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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">{link.title}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Created</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{formatDate(link.createdAt)}</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Clicks</CardTitle>
            <CardDescription>Last 50 clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clicks.slice(0, 50).map((click) => (
                <div
                  key={click.id}
                  className="flex justify-between items-center p-2 border rounded"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(click.timestamp)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {click.userAgent || "Unknown device"}
                    </p>
                  </div>
                  {click.referrer && (
                    <p className="text-xs text-muted-foreground">
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

