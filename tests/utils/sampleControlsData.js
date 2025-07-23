let controlIdCounter = 1000;

export function createControlExample(overrides = {}) {
  const id = overrides.id || controlIdCounter++;
  return {
    id,
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

export const sampleControls = [
  {
    id: 50,
    name: 'Data Privacy',
    description: 'Ensures data privacy documents have more than 10 sections.',
    period: 'MONTHLY',
    params: { endpoint: '/bpi', threshold: 10 },
    status: 'finalized',
    catalogId: 10
  },
  {
    id: 51,
    name: 'Balance Sheet Accuracy Check',
    description: 'Validates that balance sheets are complete and meet reporting standards.',
    period: 'WEEKLY',
    params: { endpoint: '/bpi', threshold: 1 },
    status: 'finalized',
    catalogId: 11
  },
  {
    id: 52,
    name: 'Income Statement',
    description: 'Ensures that income statements are reviewed and contain all required sections.',
    period: 'MONTHLY',
    params: { endpoint: '/bpi', threshold: 10 },
    status: 'finalized',
    catalogId: 11
  },
  {
    id: 53,
    name: 'Audit Trail Completeness',
    description: 'Verifies that all financial transactions are documented for audit compliance.',
    period: 'WEEKLY',
    params: { endpoint: '/bpi', threshold: 1 },
    status: 'draft',
    catalogId: 11
  },
  {
    id: 54,
    name: 'Financial Disclosure Check',
    description: 'Ensures all financial disclosures contain accurate and complete information.',
    period: 'MONTHLY',
    params: { endpoint: '/bpi', threshold: 5 },
    startDate: new Date('2025-05-01').toISOString(),
    endDate: new Date('2025-12-31').toISOString(),
    status: 'finalized',
    catalogId: 11
  },
  {
    id: 55,
    name: 'Supply Chain Verification',
    description: 'Validates that all supply chain documentation meets compliance requirements.',
    period: 'MONTHLY',
    params: { endpoint: '/bpi', threshold: 8 },
    status: 'finalized',
    catalogId: 13
  }
]
