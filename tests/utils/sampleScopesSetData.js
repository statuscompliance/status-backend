import mongoose from 'mongoose';

export const sampleScopeSets = [
  {
    _id: new mongoose.Types.ObjectId('647890abcdef123456789012'),
    controlId: 101,
    scopes: new Map([
      ['read', 'true'],
      ['write', 'false'],
    ]),
  },
  {
    _id: new mongoose.Types.ObjectId('5e9b8c7d6a5e4f3c2b1a0987'),
    controlId: 102,
    scopes: new Map([
      ['view', 'true'],
      ['edit', 'true'],
      ['delete', 'false'],
    ]),
  },
  {
    _id: new mongoose.Types.ObjectId('abcdef0123456789abcdef01'),
    controlId: 101,
    scopes: new Map([
      ['access', 'full'],
    ]),
  },
];

export const newScopeSetData = {
  controlId: 103,
  scopes: new Map([
    ['execute', 'true'],
    ['monitor', 'true'],
  ]),
};

export const updatedScopeSetData = {
  controlId: 103,
  scopes: new Map([
    ['execute', 'false'],
    ['configure', 'true'],
  ]),
};

export const scopeSetForControlId101 = sampleScopeSets.filter(set => set.controlId === 101);
