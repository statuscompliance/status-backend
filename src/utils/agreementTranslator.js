import { v4 as uuidv4 } from 'uuid';

export function createAgreement(catalog, controls, scopes, overrides = {}) {
  const id = overrides.id || uuidv4();
  return {
    id: `tpa-${id}`,
    version: '1.0.0',
    type: 'agreement',
    context: createContext(catalog, scopes ,overrides.context || {}),
    terms: createTerms(controls, overrides.terms || {}),
    ...overrides
  };
}

function createContext(catalog, scopes = {} ,overrides = {}) {
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
      scopes: {
        // development: {
        //   project: {
        //     name: 'Project',
        //     description: 'Derived from catalog',
        //     type: 'string',
        //     default: catalog.id || '1010101010'
        //   },
        //   class: {
        //     name: 'Class',
        //     description: 'Group of Projects',
        //     type: 'string',
        //     default: '2020202020'
        //   },
        //   member: {
        //     name: 'Member',
        //     description: 'Default Member',
        //     type: 'string',
        //     default: '*'
        //   }
        // },
        ...scopes
      },
      ...overrides.definitions
    }
  };
}

function createTerms(controls, overrides = {}) {
  return {
    metrics: createMetrics(controls, overrides.metrics || {}),
    guarantees: createGuarantees(controls, overrides.guarantees || [])
  };
}

function createMetrics(controls, overrides = {}) {
  return controls?.reduce((metrics, control) => {
    const metricName = `${transformText(control.name)}_METRIC`;
    metrics[metricName] = {
      collector: {
        infrastructurePath: 'status-backend',
        endpoint: '/api/v1/computation',
        type: 'POST-GET-V1-STATUS',
        config: {
          backendUrl: 'http://status-backend:3001/api/v1/computation/bulk'
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

function createGuarantees(controls, overrides = []) {
  return controls?.map((control, index) => {
    let withElement = {};
    withElement[`${transformText(control.name)}_METRIC`] = {};
    return {
      id: transformText(control.name),
      notes: '',
      description: control.description || '',
      scope: control.scope || {}, // Im not sure if the scope can be defined by the control previously
      of: [{ // 
        scope: control.scope || {}, // In some way, the scope should be defined by the control
        objective: `${transformText(control.name)}_METRIC >= ${control.params['threshold']}`,
        with: withElement, // Here we will add the scope params if needed
        window: {
          type: 'static',
          initial: '2022-01-01',
          period: control.period.toLowerCase()
        }
      }],
      ...overrides[index]
    };
  }) || [];
}


function transformText(text) {
  return text.toUpperCase().replace(/\s+/g, '_');
}

