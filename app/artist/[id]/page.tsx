"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Artist } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { 
  ExternalLink, 
  Edit, 
  Trash2, 
  User,
  Globe,
  Mail,
  ArrowLeft
} from "lucide-react";

export default function ArtistDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const artistId = params.id as string;
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        router.push("/auth");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadArtist = useCallback(async () => {
    if (!artistId || !user) return;
    
    try {
      const artistRef = doc(db, "artists", artistId);
      const artistDoc = await getDoc(artistRef);
      
      if (artistDoc.exists()) {
        const data = artistDoc.data();
        const artistData: Artist = {
          id: artistDoc.id,
          userId: data.userId,
          name: data.name,
          slug: data.slug,
          bio: data.bio,
          profileImageUrl: data.profileImageUrl,
          website: data.website,
          socialLinks: data.socialLinks,
          newsletterEmails: data.newsletterEmails || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        if (artistData.userId !== user.uid) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this artist",
            variant: "destructive",
          });
          router.push("/");
          return;
        }
        
        setArtist(artistData);
      } else {
        toast({
          title: "Artist Not Found",
          description: "The artist you're looking for doesn't exist",
          variant: "destructive",
        });
        router.push("/");
      }
    } catch (error: any) {
      console.error("Error loading artist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load artist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [artistId, user, router, toast]);

  useEffect(() => {
    if (user) {
      loadArtist();
    }
  }, [user, loadArtist]);

  const deleteArtist = async () => {
    if (!artist) return;
    if (!confirm("Are you sure you want to delete this artist? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "artists", artist.id));
      toast({
        title: "Success",
        description: "Artist deleted successfully",
      });
      router.push("/artists");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete artist",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading artist details...</div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Artist not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/artists")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Artists
          </Button>
        </div>

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            {artist.profileImageUrl ? (
              <img
                src={artist.profileImageUrl}
                alt={artist.name}
                className="w-32 h-32 rounded-full object-cover border"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{artist.name}</h1>
              {artist.bio && (
                <p className="text-muted-foreground mt-2 max-w-2xl">{artist.bio}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => router.push(`/artist/edit/${artist.id}`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Artist
            </Button>
            <Button
              variant="destructive"
              onClick={deleteArtist}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {artist.website && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={artist.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  {artist.website}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          )}

          {artist.socialLinks && artist.socialLinks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {artist.socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 border rounded hover:bg-accent transition-colors"
                    >
                      <span className="capitalize">{link.platform}</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {artist.newsletterEmails && artist.newsletterEmails.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Newsletter Emails ({artist.newsletterEmails.length})
                </CardTitle>
                <CardDescription>
                  Email addresses collected for newsletter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {artist.newsletterEmails.map((email, index) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      {email}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">Slug</p>
                <p className="text-sm text-muted-foreground font-mono">{artist.slug}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(artist.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">{formatDate(artist.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

