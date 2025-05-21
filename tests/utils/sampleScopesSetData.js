import mongoose from 'mongoose';

export const sampleScopeSets = [
  {
    _id: new mongoose.Types.ObjectId('647890abcdef123456789012'),
    controlId: 50,
    scopes: new Map([
      ['country', 'Spain'],
      ['city', 'Seville'],
      ['declaration', '*']
    ])
  },
  {
    _id: new mongoose.Types.ObjectId('5e9b8c7d6a5e4f3c2b1a0987'),
    controlId: 51,
    scopes: new Map([
      ['country', 'Spain'],
      ['city', 'Madrid'],
      ['declaration', '*']
    ])
  },
  {
    _id: new mongoose.Types.ObjectId('abcdef0123456789abcdef01'),
    controlId: 52,
    scopes: new Map([
      ['country', 'Spain'],
      ['city', '*'],
      ['location', '*'],
      ['declaration', '*']
    ])
  },
];

export const newScopeSetData = {
  controlId: 53,
  scopes: new Map([
    ['country', 'France'],
    ['city', 'Paris'],
    ['declaration', 'DEC-2024-001']
  ])
};

export const updatedScopeSetData = {
  controlId: 53,
  scopes: new Map([
    ['country', 'Germany'],
    ['city', 'Berlin'],
    ['declaration', 'DEC-2024-002']
  ])
};

export const scopeSetForControlId50 = sampleScopeSets.filter(set => set.controlId === 50);
