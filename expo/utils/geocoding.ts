type NominatimResult = {
  lat?: string;
  lon?: string;
};

export type GeocodedCoordinates = {
  lat: number;
  lng: number;
};

function normalizeHungarianAddress(address: string): string {
  return address
    .replace(/(\d{4})\.\s*/g, '$1 ')
    .replace(/\bu\.?(?=\s|$)/gi, 'utca')
    .replace(/\butc\.?(?=\s|$)/gi, 'utca')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
}

function getStreetFocusedAddress(normalizedAddress: string): string {
  return normalizedAddress
    .replace(/^\d{4}\s*,?\s*/i, '')
    .replace(/^Budapest\s*,?\s*/i, '')
    .replace(/,?\s*Hungary$/i, '')
    .replace(/,?\s*Magyarország$/i, '')
    .trim();
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  return queries
    .map((query) => query.replace(/\s+/g, ' ').trim())
    .filter((query) => {
      if (query.length === 0 || seen.has(query.toLowerCase())) return false;
      seen.add(query.toLowerCase());
      return true;
    });
}

function buildGeocodeQueries(venueName: string, address: string): string[] {
  const normalizedAddress = normalizeHungarianAddress(address);
  const streetFocusedAddress = getStreetFocusedAddress(normalizedAddress);
  const cleanVenueName = venueName.trim();

  return uniqueQueries([
    cleanVenueName && streetFocusedAddress ? `${cleanVenueName} ${streetFocusedAddress} Budapest` : '',
    streetFocusedAddress ? `${streetFocusedAddress}, Budapest, Hungary` : '',
    streetFocusedAddress ? `${streetFocusedAddress}, Budapest, Magyarország` : '',
    cleanVenueName && normalizedAddress ? `${cleanVenueName} ${normalizedAddress}` : '',
    normalizedAddress ? `${normalizedAddress}, Hungary` : '',
    address,
  ]);
}

async function geocodeQuery(query: string): Promise<GeocodedCoordinates | null> {
  const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
  const response = await fetch(geocodeUrl, {
    headers: {
      'User-Agent': 'ComeGetItApp/1.0',
      Accept: 'application/json',
    },
  });

  if (!response.ok) return null;

  const geocodeData = (await response.json()) as NominatimResult[];
  const firstResult = Array.isArray(geocodeData) ? geocodeData[0] : null;
  const lat = Number.parseFloat(String(firstResult?.lat ?? ''));
  const lng = Number.parseFloat(String(firstResult?.lon ?? ''));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Geocodes a venue using several Budapest-friendly query variants.
 */
export async function geocodeVenueAddress(
  venueName: string,
  address?: string | null
): Promise<GeocodedCoordinates | null> {
  if (!address?.trim()) return null;

  const queries = buildGeocodeQueries(venueName, address);
  for (const query of queries) {
    try {
      const result = await geocodeQuery(query);
      if (result) {
        console.log('[Geocoding] Resolved venue address', { venueName, query, result });
        return result;
      }
    } catch (error) {
      console.warn('[Geocoding] Query failed', { venueName, query, error });
    }
  }

  console.warn('[Geocoding] No coordinates found for venue', { venueName, address });
  return null;
}
