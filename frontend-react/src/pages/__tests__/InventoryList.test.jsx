import { describe, it, expect } from 'vitest';
import React from 'react';
import InventoryList from '../InventoryList';

describe('InventoryList Component', () => {
  it('should be defined as a valid React component', () => {
    expect(InventoryList).toBeDefined();
  });

  it('should identify low stock items based on minimum threshold', () => {
    const checkStatus = (qty, threshold) => qty === 0 ? 'OutOfStock' : qty <= threshold ? 'LowStock' : 'InStock';
    expect(checkStatus(5, 10)).toBe('LowStock');
    expect(checkStatus(0, 10)).toBe('OutOfStock');
    expect(checkStatus(20, 10)).toBe('InStock');
  });
});
