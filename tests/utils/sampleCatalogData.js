const defaultStartDate = new Date('2025-01-01').toISOString();
const defaultEndDate = new Date('2025-12-31').toISOString();

const createCatalog = (id, name, description, options = {}) => ({
  id,
  name,
  description,
  startDate: options.startDate || defaultStartDate,
  endDate: options.endDate || defaultEndDate,
  status: options.status || 'finalized',
  ...(options.dashboard_id && { dashboard_id: options.dashboard_id }),
  ...(options.tpaId && { tpaId: options.tpaId })
});

export const sampleCatalogs = [
  createCatalog(
    '10',
    'Regulatory Compliance',
    'Collection of documents ensuring compliance with industry regulations.'
  ),
  createCatalog(
    '11',
    'Financial Reporting',
    'Documentation ensuring adherence to financial regulations (e.g., SOX, IFRS).',
    { 
      startDate: new Date('2025-03-20').toISOString(),
      endDate: new Date('2025-06-21').toISOString()
    }
  ),
  createCatalog(
    '12',
    'Information Security',
    'Collection of security policies and procedures (e.g., ISO 27001, NIST).',
    { 
      startDate: new Date('2025-07-01').toISOString(),
      endDate: new Date('2025-09-30').toISOString(),
      status: 'draft'
    }
  ),
  createCatalog(
    '13',
    'Supply Chain',
    'Documents ensuring ethical and legal supply chain practices.',
    {
      dashboard_id: 'ae08pn1m04lxcd',
      tpaId: 'tpa-d702a2e2-9d13-4e5f-9991-886ec0be7a28'
    }
  ),
  createCatalog(
    '14',
    'AML Compliance',
    'Catalog of guidelines and processes for Anti-Money Laundering compliance.'
  ),
  createCatalog(
    '15',
    'HIPAA',
    'Documents ensuring compliance with healthcare regulations.',
    {
      startDate: new Date('2025-04-30').toISOString(),
      endDate: new Date('2025-05-31').toISOString()
    }
  )
];
