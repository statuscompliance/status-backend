export function createControlExample(overrides = {}) {
  return {
    name: 'Test Control Name',
    description: 'Test Control Description',
    period: 'WEEKLY',
    startDate: new Date('2025-01-01T00:00:00.000Z'),
    endDate: new Date('2025-12-31T23:59:59.000Z'),
    mashupId: 'abc123',
    params: { threshold: 10, endpoint: '/bpi' },
    status: 'draft',
    ...overrides,
  };
}
