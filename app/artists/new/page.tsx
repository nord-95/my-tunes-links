"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/app-layout";
import ArtistForm from "@/components/artist-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NewArtistPage() {
  const router = useRouter();

  return (
    <AppLayout
      title="New Artist"
      action={
        <Button size="sm" variant="outline" onClick={() => router.push("/artists")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
      }
    >
      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ArtistForm
            onSuccess={() => router.push("/artists")}
            onCancel={() => router.push("/artists")}
          />
        </div>
      </div>
    </AppLayout>
  );
}
