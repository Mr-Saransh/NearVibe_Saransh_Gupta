/**
 * Geographic utilities for NearVibe
 * Haversine formula distance calculation and NCR coordinates
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CityHub {
  name: string;
  label: string;
  latitude: number;
  longitude: number;
}

export const NCR_CITIES: CityHub[] = [
  { name: 'All NCR', label: 'All Delhi NCR', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Noida', label: 'Noida (Sec 62 & Expressway)', latitude: 28.5355, longitude: 77.3910 },
  { name: 'Delhi', label: 'Delhi (Central & South)', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Gurugram', label: 'Gurugram (Cyber City & Golf Course)', latitude: 28.4595, longitude: 77.0266 },
  { name: 'Ghaziabad', label: 'Ghaziabad (Indirapuram & Raj Nagar)', latitude: 28.6692, longitude: 77.4538 },
  { name: 'Greater Noida', label: 'Greater Noida (Knowledge Park)', latitude: 28.4744, longitude: 77.5040 },
];

/**
 * Calculates great-circle distance between two points on a sphere using the Haversine formula.
 * @returns distance in kilometers (km) rounded to 1 decimal place.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function formatDistance(km?: number): string {
  if (km === undefined || km === null || isNaN(km)) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

/**
 * Validates if coordinates are within standard planetary ranges
 */
export function isValidCoordinate(lat?: number, lon?: number): boolean {
  if (lat === undefined || lon === undefined) return false;
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
