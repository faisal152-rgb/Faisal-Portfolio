import { describe, expect, it } from 'vitest';
import { mergeAssistantLead, getMissingAssistantLeadFields } from '../controllers/ai.controller.js';

describe('assistant workflow state', () => {
  it('preserves existing fields and applies non-empty corrections', () => {
    expect(mergeAssistantLead(
      { name: 'Faisal', email: 'old@example.com', service: 'Website' },
      { email: 'new@example.com', service: 'Mobile app', notes: 'Needs authentication' },
    )).toEqual({
      name: 'Faisal',
      email: 'new@example.com',
      service: 'Mobile app',
      notes: 'Needs authentication',
    });
  });

  it('reports only fields that are still missing', () => {
    expect(getMissingAssistantLeadFields({
      name: 'Faisal',
      email: 'faisal@example.com',
      service: 'Website',
    })).toEqual([['notes', 'the main project requirements']]);
  });
});