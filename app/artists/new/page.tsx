"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ArtistForm from "@/components/artist-form";

export default function NewArtistPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Artist</CardTitle>
            <CardDescription>
              Add a new artist to your collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArtistForm
              onSuccess={() => router.push("/artists")}
              onCancel={() => router.push("/artists")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

