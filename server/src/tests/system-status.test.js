import { describe, it, expect } from 'vitest';
import { buildSystemStatusResponse } from '../controllers/system.controller.js';

describe('system status response builder', () => {
  it('returns a healthy operational payload when the service is reachable', () => {
    const response = buildSystemStatusResponse({ isOperational: true });

    expect(response.success).toBe(true);
    expect(response.data.isOperational).toBe(true);
    expect(response.data.status).toBe('operational');
    expect(response.data.statusText).toBe('Available for Opportunities');
    expect(response.data.statusLabel).toBe('Available');
  });

  it('returns a degraded payload when the service is not operational', () => {
    const response = buildSystemStatusResponse({ isOperational: false, message: 'Gateway timeout' });

    expect(response.success).toBe(false);
    expect(response.data.isOperational).toBe(false);
    expect(response.data.status).toBe('offline');
    expect(response.data.message).toBe('Gateway timeout');
  });
});
