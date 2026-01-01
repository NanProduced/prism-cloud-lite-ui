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
 * Check if an IP address is private or local
 */
function isPrivateIp(ip: string): boolean {
  // IPv4 Private Ranges
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Pattern);
  if (match) {
    const octets = match.slice(1).map(Number);
    // 10.0.0.0/8
    if (octets[0] === 10) return true;
    // 172.16.0.0/12
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return true;
    // 192.168.0.0/16
    if (octets[0] === 192 && octets[1] === 168) return true;
    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) return true;
    // 169.254.0.0/16 (Link-local)
    if (octets[0] === 169 && octets[1] === 254) return true;
  }
  
  // IPv6 check (basic)
  // ::1 is loopback, fe80:: is link-local
  if (ip === '::1' || ip === '0:0:0:0:0:0:0:1' || ip.toLowerCase().startsWith('fe80:')) return true;

  return false;
}

/**
 * Resolve location information for a specific IP address
 */
export async function resolveIpLocation(ip: string): Promise<string | null> {
  if (!MAPTILER_KEY || !ip || ip === 'localhost' || isPrivateIp(ip)) {
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
