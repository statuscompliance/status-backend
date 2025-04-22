export const sampleScopes = [
  {
    name: 'user_role',
    description: 'Role of the user',
    type: 'string',
    default: 'guest',
  },
  {
    name: 'is_admin',
    description: 'Indicates if the user is an administrator',
    type: 'boolean',
    default: 'false',
  },
  {
    name: 'language_preference',
    description: 'Preferred language of the user',
    type: 'string',
    default: 'en',
  },
];

export const newScopeData = {
  name: 'feature_enabled',
  description: 'Indicates if a certain feature is enabled',
  type: 'boolean',
  default: 'false',
};

export const invalidScopeData = {
  name: 'Invalid Name With Spaces',
  description: 'An invalid scope',
  type: 'string',
  default: 'test',
};

export const updatedScopeData = {
  name: 'updated_feature',
  description: 'Updated description for the feature flag',
  type: 'boolean',
  default: 'true',
};
