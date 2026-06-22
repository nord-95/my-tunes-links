import path from "path";

// Private/reserved IP ranges — no geolocation possible
const PRIVATE_IP_RANGES = [
  /^127\./,
  /^192\.168\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^fe80:/i,
  /^localhost$/i,
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((pattern) => pattern.test(ip));
}

// Singleton reader — cached across warm function invocations
let _reader: any = null;
let _readerError: boolean = false;

async function getReader() {
  if (_readerError) return null;
  if (_reader) return _reader;

  try {
    const { Reader } = await import("@maxmind/geoip2-node");
    const dbPath = path.join(process.cwd(), "data", "GeoLite2-City.mmdb");
    _reader = await Reader.open(dbPath);
    return _reader;
  } catch {
    _readerError = true;
    return null;
  }
}

export interface GeoData {
  country?: string;
  city?: string;
  region?: string;
  countryCode?: string;
  timezone?: string;
}

export async function lookupIP(ip: string): Promise<GeoData> {
  if (!ip || isPrivateIP(ip)) return {};

  // Strip port if present (e.g. "1.2.3.4:12345" → "1.2.3.4")
  const cleanIP = ip.includes(":") && !ip.includes("::") ? ip.split(":")[0] : ip;

  try {
    const reader = await getReader();
    if (!reader) return {};

    const result = reader.city(cleanIP);
    return {
      country: result.country?.names?.en,
      city: result.city?.names?.en,
      region: result.subdivisions?.[0]?.names?.en,
      countryCode: result.country?.isoCode,
      timezone: result.location?.timeZone,
    };
  } catch {
    return {};
  }
}
