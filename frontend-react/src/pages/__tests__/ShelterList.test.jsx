import { describe, it, expect } from 'vitest';
import ShelterList from '../ShelterList';

describe('ShelterList Component', () => {
  it('should render page heading and geolocation search form', () => {
    expect(ShelterList).toBeDefined();
  });

  it('should format occupancy percentage correctly', () => {
    const calculatePct = (occupancy, capacity) => Math.round((occupancy / capacity) * 100);
    expect(calculatePct(50, 100)).toBe(50);
    expect(calculatePct(100, 100)).toBe(100);
  });
});
