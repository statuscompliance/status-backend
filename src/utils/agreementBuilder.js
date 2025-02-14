import { v4 as uuidv4 } from 'uuid';
import { getScopeSetsByControlIds, getScopeSpecs } from './scopeUtilities.js';

export async function agreementBuilder(catalog, controls, overrides = {}) {
  const id = overrides.id || uuidv4();
  const controlIds = controls.map(control => control.id);
  const { scopesKeySet, scopeSets } = await getScopeSetsByControlIds(controlIds);
  const scopeSpecs = await getScopeSpecs(scopesKeySet);
  return {
    id: `tpa-${id}`,
    version: '1.0.0',
    type: 'agreement',
    context: createContext(catalog ,overrides.context || {}),
    terms: createTerms(controls, scopeSpecs, scopeSets, overrides.terms || {}),
    ...overrides
  };
}

function createContext(catalog, overrides = {}) {
  return {
    validity: {
      initial: '2022-01-01',
      timeZone: 'America/Los_Angeles',
      startDate: catalog.startDate || '1975-01-01',
      endDate: catalog.endDate || '2022-01-01',
      ...overrides.validity // Override validity settings if provided
    },
    definitions: {
      schemas: {},
      scopes: {},
      ...overrides.definitions
    }
  };
}

function createTerms(controls, scopeSpecs, scopeSets, overrides = {}) {
  return {
    metrics: createMetrics(controls, overrides.metrics || {}),
    guarantees: createGuarantees(controls, scopeSpecs,  scopeSets, overrides.guarantees || [])
  };
}

function createMetrics(controls, overrides = {}) {
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

function createGuarantees(controls, scopeSpecs, scopeSets, overrides = []) {
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


function transformText(text) {
  return text.toUpperCase().replace(/\s+/g, '_');
}

