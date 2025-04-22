// import { v4 as uuidv4 } from 'uuid';

export const sampleScopes = [
  {
    // id: uuidv4(), // Genera un UUID válido id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    name: 'user_role',
    description: 'Role of the user',
    type: 'string',
    default: 'guest',
  },
  {
    // id: uuidv4(), // Genera un UUID válidoid: 'fedcba98-7654-3210-fedc-ba9876543210',
    name: 'is_admin',
    description: 'Indicates if the user is an administrator',
    type: 'boolean',
    default: 'false',
  },
  {
    //   id: uuidv4(), // Genera un UUID válidoid: '01234567-89ab-cdef-0123-456789abcdef',
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
  name: 'Invalid Name With Spaces', // No cumple la validación
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
