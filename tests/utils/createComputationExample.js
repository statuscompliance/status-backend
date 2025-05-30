export function createComputationExample(overrides = {}) {
  return {
    id: 'computationId',
    computationGroup: 'computationGroupId',
    value: true,
    scope: {
      project: 'showcase-status-monitoring',
      class: 'showcase',
      member: 'John Doe',
    },
    evidences: [
      { document: 'Document confirming the computation' },
    ],
    period: {
      from: '2024-05-07T02:00:00.000Z',
      to: '2024-05-07T02:59:59.999Z',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
