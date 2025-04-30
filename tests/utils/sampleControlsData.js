export const sampleControls = [
  {
    id: 50,
    name: 'User Role Check',
    description: 'Verifies the role of the user accessing a resource.',
    period: 'MONTHLY',
    params: { endpoint: '/api/user/role', threshold: 'admin' },
    status: 'finalized'
  },
  {
    id: 51,
    name: 'Language Preference Setting',
    description: 'Ensures the user preferred language is set.',
    period: 'WEEKLY',
    params: { endpoint: '/api/user/lang', threshold: 'es' },
    status: 'finalized'
  },
  {
    id: 52,
    name: 'Admin Check',
    description: 'Checks if the user has administrator privileges.',
    period: 'DAILY',
    params: { endpoint: '/api/user/admin', threshold: 'true' },
    status: 'finalized'
  },
  {
    id: 53,
    name: 'Data Usage Limit',
    description: 'Tracks and limits the data usage of a user.',
    period: 'HOURLY',
    params: { endpoint: '/api/data/usage', max: 1000 },
    status: 'draft'
  },
  {
    id: 54,
    name: 'Feature Flag Enabled',
    description: 'Checks if a specific feature flag is enabled for the user.',
    period: 'WEEKLY',
    params: { endpoint: '/api/features', flag: 'new_dashboard', enabled: true },
    startDate: new Date('2025-05-01').toISOString(),
    endDate: new Date('2025-12-31').toISOString(),
    status: 'finalized'
  },
  {
    id: 55,
    name: 'API Request Throttling',
    description: 'Limits the number of API requests from a specific IP address.',
    period: 'HOURLY',
    params: { endpoint: '/api/*', max_requests: 100 },
    status: 'finalized'
  }
]
