import { v4 as uuidv4 } from 'uuid';

export function createPointExample(overrides = {}) {
  return {
    id: uuidv4(),
    agreementId: 'agreementId',
    guaranteeId: 'guaranteeId',
    guaranteeValue: 0.95,
    guaranteeResult: true,
    timestamp: new Date().toISOString(),
    metrics: {
      latency: 150,
      uptime: 99.9,
    },
    scope: {
      region: 'EU',
      environment: 'prod',
    },
    computationGroup: uuidv4(),
    ...overrides,
  };
}
