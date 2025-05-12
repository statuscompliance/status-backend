const API_PREFIX = process.env.API_PREFIX || '';

export const sampleConfigurations = [
  {
    endpoint: `${API_PREFIX}/users`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/scripts`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/controls`,
    available: false,
  },
  {
    endpoint: `${API_PREFIX}/grafana`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/assistant`,
    available: true,
    limit: 1,
  },
  {
    endpoint: `${API_PREFIX}/thread`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/catalogs`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/computations`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/points`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/scopes`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/config`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/github/auth`,
    available: true,
  },
  {
    endpoint: `${API_PREFIX}/header`,
    available: true,
  },
  {
    endpoint: 'docs',
    available: true,
  },
  {
    endpoint: 'api-docs',
    available: true,
  },
];
