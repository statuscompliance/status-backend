import { v4 as uuidv4 } from 'uuid';
import { getScopeSetsByControlIds, getScopeSpecs } from './scopeUtilities.js';

export async function agreementBuilder(catalog, controls, overrides = {}) {
  // Prefix 'tpa-'
  let rawId = overrides.id || uuidv4();
  const id = rawId.startsWith('tpa-') ? rawId : `tpa-${rawId}`;

  const controlIds = controls.map(control => control.id);
  const { scopesKeySet, scopeSets } = await getScopeSetsByControlIds(controlIds);
  const scopeSpecs = await getScopeSpecs(scopesKeySet);

  const { context: overridesContext, terms: overridesTerms, ...restOverrides } = overrides;

  return {
    id,
    version: '1.0.0',
    type: 'agreement',
    context: createContext(catalog, overridesContext || {}),
    terms: createTerms(controls, scopeSpecs, scopeSets, overridesTerms || {}),
    ...restOverrides
  };
}

export function createContext(catalog, overrides = {}) {
  return {
    validity: {
      initial: '2022-01-01',
      timeZone: 'America/Los_Angeles',
      ...overrides.validity, // Apply overrides first
      startDate: overrides.validity?.startDate || catalog.startDate || '1975-01-01',
      endDate: overrides.validity?.endDate || catalog.endDate || '2022-01-01',
    },
    definitions: {
      schemas: {},
      scopes: {},
      ...overrides.definitions
    }
  };
}

export function createTerms(controls, scopeSpecs, scopeSets, overrides = {}) {
  return {
    metrics: createMetrics(controls, overrides.metrics || {}),
    guarantees: createGuarantees(controls, scopeSpecs,  scopeSets, overrides.guarantees || [])
  };
}

export function createMetrics(controls, overrides = {}) {
  if (!Array.isArray(controls)) return {};
  return controls?.reduce((metrics, control) => {
    const metricName = `${transformText(control.name)}_METRIC`;
    metrics[metricName] = {
      collector: {
        infrastructurePath: 'status-backend',
        endpoint: '/api/v1/computations',
        type: 'POST-GET-V1-STATUS',
        config: {
          backendUrl: 'http://status-backend:3001/api/v1/computations/bulk'
        }
      },
      measure: {
        endpoint: control.params['endpoint'],
        params: Object.fromEntries(
          Object.entries(control.params).filter(([key]) => !['endpoint', 'threshold'].includes(key))
        ),
        scope: {}
      },
      ...overrides[metricName]
    };
    return metrics;
  }, {});
}

export function createGuarantees(controls, scopeSpecs, scopeSets, overrides = []) {
  return controls?.map((control, index) => {
    let withElement = {};
    withElement[`${transformText(control.name)}_METRIC`] = {}; // Here we should add the scoped params of the control
    const ofElements = scopeSets.map(scopeSet => ({
      scope: Object.fromEntries(scopeSet.scopes),
      objective: `${transformText(control.name)}_METRIC >= ${control.params['threshold']}`,
      with: withElement,
      window: {
        type: 'static',
        initial: '2022-01-01', // Governify need this for date handling
        period: control.period.toLowerCase()
      }
    }));

    return {
      id: transformText(control.name),
      notes: '',
      description: control.description || '',
      scope: scopeSpecs,
      of: ofElements,
      ...overrides[index]
    };
  }) || [];
}


export function transformText(text) {
  return text.toUpperCase().replace(/\s+/g, '_');
}

