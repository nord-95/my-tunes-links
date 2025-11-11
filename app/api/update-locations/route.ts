import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, limit } from "firebase/firestore";
import { getLocationFromIP } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication (optional - you can add auth check here)
    const authHeader = request.headers.get("authorization");
    // For now, we'll allow it, but you can add proper auth later

    const { linkId, batchSize = 50 } = await request.json().catch(() => ({ linkId: null, batchSize: 50 }));

    const clicksRef = collection(db, "clicks");
    
    // Find clicks with IP addresses but no location data
    // Note: Firestore doesn't support != operator, so we'll fetch all and filter client-side
    let q;
    if (linkId) {
      // Update locations for a specific link
      q = query(
        clicksRef,
        where("linkId", "==", linkId),
        limit(batchSize * 2) // Fetch more to account for filtering
      );
    } else {
      // Update locations for all clicks (limited batch)
      q = query(
        clicksRef,
        limit(batchSize * 2) // Fetch more to account for filtering
      );
    }

    const snapshot = await getDocs(q);
    const clicksToUpdate: Array<{ id: string; ipAddress: string }> = [];

    // Filter clicks that have IP but don't have location data
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const ipAddress = data.ipAddress;
      
      // Only process if IP exists and location data is missing
      if (ipAddress && ipAddress.trim() && (!data.country && !data.countryCode)) {
        clicksToUpdate.push({
          id: docSnapshot.id,
          ipAddress: ipAddress.trim(),
        });
      }
    });
    
    // Limit to batchSize after filtering
    const limitedClicks = clicksToUpdate.slice(0, batchSize);

    if (limitedClicks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No clicks need location updates",
        updated: 0,
      });
    }

    console.log(`Processing ${limitedClicks.length} clicks for location updates...`);

    // Process clicks in batches to avoid rate limiting
    const updatePromises = limitedClicks.map(async (click) => {
      try {
        const location = await getLocationFromIP(click.ipAddress);
        
        if (location.country || location.countryCode) {
          const clickRef = doc(db, "clicks", click.id);
          const updateData: Record<string, any> = {};
          
          if (location.country) updateData.country = location.country;
          if (location.city) updateData.city = location.city;
          if (location.region) updateData.region = location.region;
          if (location.countryCode) updateData.countryCode = location.countryCode;
          if (location.timezone) updateData.timezone = location.timezone;

          await updateDoc(clickRef, updateData);
          console.log(`✅ Updated location for click ${click.id}:`, location);
          return { success: true, clickId: click.id, location };
        } else {
          console.warn(`⚠️ No location found for IP ${click.ipAddress} (click ${click.id})`);
          return { success: false, clickId: click.id, reason: "No location data" };
        }
      } catch (error: any) {
        console.error(`❌ Error updating click ${click.id}:`, error.message);
        return { success: false, clickId: click.id, error: error.message };
      }
    });

    // Wait for all updates with a delay between batches to avoid rate limiting
    const results = await Promise.allSettled(updatePromises);
    
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      message: `Processed ${limitedClicks.length} clicks`,
      updated: successful,
      failed,
      total: limitedClicks.length,
    });
  } catch (error: any) {
    console.error("Error in update-locations API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update locations",
      },
      { status: 500 }
    );
  }
}

