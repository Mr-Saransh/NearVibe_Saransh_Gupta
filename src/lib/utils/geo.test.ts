import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateDistance, formatDistance, isValidCoordinate } from './geo';

describe('Geographic Utilities & Haversine Formula', () => {
  it('correctly calculates distance between Noida Sec 62 and Connaught Place, Delhi', () => {
    // Noida Sec 62: 28.5355, 77.3910
    // Connaught Place: 28.6315, 77.2167
    const dist = calculateDistance(28.5355, 77.3910, 28.6315, 77.2167);
    // Real physical distance is approx 20-22 km
    assert.ok(dist >= 18 && dist <= 24, `Expected ~20km, got ${dist}km`);
  });

  it('calculates zero distance for identical coordinates', () => {
    const dist = calculateDistance(28.5355, 77.3910, 28.5355, 77.3910);
    assert.strictEqual(dist, 0);
  });

  it('correctly calculates distance between DLF CyberHub and Hauz Khas', () => {
    // CyberHub: 28.4950, 77.0895
    // Hauz Khas: 28.5534, 77.1944
    const dist = calculateDistance(28.4950, 77.0895, 28.5534, 77.1944);
    assert.ok(dist >= 10 && dist <= 15, `Expected ~12km, got ${dist}km`);
  });

  it('handles invalid or non-numeric coordinates gracefully', () => {
    // @ts-ignore
    const dist = calculateDistance(NaN, 77.3910, 28.6315, 77.2167);
    assert.strictEqual(dist, 0);
  });

  it('formats distance in meters when under 1 km and in km when over', () => {
    assert.strictEqual(formatDistance(0.4), '400 m away');
    assert.strictEqual(formatDistance(5.2), '5.2 km away');
    assert.strictEqual(formatDistance(undefined), '');
  });

  it('validates planetary coordinate bounds', () => {
    assert.strictEqual(isValidCoordinate(28.5, 77.2), true);
    assert.strictEqual(isValidCoordinate(95.0, 77.2), false); // Latitude > 90
    assert.strictEqual(isValidCoordinate(28.5, 195.0), false); // Longitude > 180
  });
});
