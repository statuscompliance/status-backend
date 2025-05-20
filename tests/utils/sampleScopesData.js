export const sampleScopes = [
  {
    name: 'country',
    description: 'Computation area',
    type: 'string',
    default: '*',
  },
  {
    name: 'city',
    description: 'Country City',
    type: 'string',
    default: '*',
  },
  {
    name: 'declaration',
    description: 'Declaration identifier',
    type: 'string',
    default: '*',
  },
  {
    name: 'location',
    description: 'Specific location of the establishment',
    type: 'string',
    default: '*',
  },
];

export const newScopeData = {
  name: 'business_unit',
  description: 'Business unit identifier',
  type: 'string',
  default: '*',
};

export const invalidScopeData = {
  name: 'Invalid Name With Spaces',
  description: 'An invalid scope',
  type: 'string',
  default: 'test',
};

export const updatedScopeData = {
  name: 'region',
  description: 'Geographic region identifier',
  type: 'string',
  default: '*',
};
