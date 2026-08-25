import { describe, it, expect } from 'vitest';
import { buildGoogleAuthUrl, normalizeIntegrationState } from '../controllers/ai.controller.js';

describe('integration status helpers', () => {
  it('builds a Google OAuth authorize URL with the right params', () => {
    const url = buildGoogleAuthUrl('gmail', 'http://localhost:4173/admin');

    expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url).toContain('client_id=');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('scope=');
    expect(url).toContain('access_type=offline');
    expect(url).toContain('prompt=consent');
  });

  it('removes sensitive token values from integration payloads', () => {
    const payload = normalizeIntegrationState({
      gmail: {
        enabled: true,
        email: 'user@gmail.com',
        accessToken: 'secret-token',
        refreshToken: 'refresh-secret',
      },
      calendar: {
        enabled: false,
        accessToken: 'calendar-secret',
      },
    });

    expect(payload.gmail.accessToken).toBeUndefined();
    expect(payload.gmail.refreshToken).toBeUndefined();
    expect(payload.calendar.accessToken).toBeUndefined();
    expect(payload.gmail.email).toBe('user@gmail.com');
  });
});
