import { config, geocoding, geolocation, type GeocodingSearchResult } from '@maptiler/client';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string;

// Initialize config
config.apiKey = MAPTILER_KEY;

export interface ResolvedAddress {
  fullText: string;
  city?: string;
  country?: string;
}

/**
 * Perform reverse geocoding to get a readable address from coordinates
 */
export async function reverseGeocode(lng: number, lat: number): Promise<ResolvedAddress | null> {
  if (!MAPTILER_KEY) return null;
  
  try {
    const result = await geocoding.reverse([lng, lat], { limit: 1 });
    if (result.features && result.features.length > 0) {
      const feature = result.features[0];
      return {
        fullText: feature.place_name,
        city: (feature as any).context?.find((c: any) => c.id.startsWith('place'))?.text,
        country: (feature as any).context?.find((c: any) => c.id.startsWith('country'))?.text,
      };
    }
    return null;
  } catch (error) {
    console.error('[MapTiler] Reverse geocoding failed:', error);
    return null;
  }
}

/**
 * Resolve location information for a specific IP address
 */
export async function resolveIpLocation(ip: string): Promise<string | null> {
  if (!MAPTILER_KEY || !ip || ip === '127.0.0.1' || ip === '0:0:0:0:0:0:0:1' || ip === 'localhost') {
    return null;
  }

  try {
    // Note: MapTiler Client SDK geolocation.info() typically gets the CURRENT visitor.
    // For a specific IP, we use the Fetch API directly as per MapTiler REST docs.
    const response = await fetch(`https://api.maptiler.com/geolocation/${ip}.json?key=${MAPTILER_KEY}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.city && data.country) {
      return `${data.city}, ${data.country}`;
    } else if (data.country) {
      return data.country;
    }
    return null;
  } catch (error) {
    console.error('[MapTiler] IP resolution failed:', error);
    return null;
  }
}

export { geocoding, geolocation };
