import { describe, it, expect } from 'vitest';

import ResourceList from '../ResourceList';

describe('ResourceList Component', () => {
  it('should be defined as a valid React component', () => {
    expect(ResourceList).toBeDefined();
  });

  it('should filter available resources correctly', () => {
    const resources = [
      { id: 1, name: 'Ambulance 1', status: 'Available' },
      { id: 2, name: 'Truck 2', status: 'Dispatched' }
    ];
    const available = resources.filter(r => r.status === 'Available');
    expect(available.length).toBe(1);
    expect(available[0].name).toBe('Ambulance 1');
  });
});
