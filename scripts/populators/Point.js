import { models } from '../../src/models/models.js';
import { v4 as uuidv4 } from 'uuid';

async function populatePoints() {
  try {
    console.log('__________________________________');
    console.log('Starting points population...');
    console.log('__________________________________');

    // Predefined computation groups for reuse
    const computationGroups = [
      uuidv4(),
      uuidv4(),
      uuidv4(),
      uuidv4(),
      uuidv4()
    ];

    // Agreement IDs with tpa-UUID format
    const agreementIds = [
      'tpa-' + uuidv4(),
      'tpa-' + uuidv4(),
      'tpa-' + uuidv4(),
      'tpa-' + uuidv4(),
      'tpa-' + uuidv4()
    ];

    // Guarantee IDs
    const guaranteeIds = [
      'availability',
      'performance',
      'reliability',
      'security',
      'cost'
    ];

    const points = [
      {
        agreementId: agreementIds[0],
        guaranteeId: guaranteeIds[0],
        guaranteeValue: 99.8,
        guaranteeResult: true,
        timestamp: new Date('2024-06-01T10:00:00Z'),
        metrics: { uptime: 99.8, downtime: 0.2 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[0]
      },
      {
        agreementId: agreementIds[0],
        guaranteeId: guaranteeIds[1],
        guaranteeValue: 89.5,
        guaranteeResult: true,
        timestamp: new Date('2024-06-01T10:00:00Z'),
        metrics: { responseTime: 250, throughput: 1000 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[0]
      },
      {
        agreementId: agreementIds[0],
        guaranteeId: guaranteeIds[2],
        guaranteeValue: 98.5,
        guaranteeResult: true,
        timestamp: new Date('2024-06-01T10:00:00Z'),
        metrics: { errorRate: 0.015, successRate: 0.985 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[0]
      },

      // Another related group
      {
        agreementId: agreementIds[1],
        guaranteeId: guaranteeIds[0],
        guaranteeValue: 99.5,
        guaranteeResult: true,
        timestamp: new Date('2024-06-15T14:30:00Z'),
        metrics: { uptime: 99.5, downtime: 0.5 },
        scope: { country: 'Spain', city: 'Cordoba', declaration: '*' },
        computationGroup: computationGroups[1]
      },
      {
        agreementId: agreementIds[1],
        guaranteeId: guaranteeIds[3],
        guaranteeValue: 95.0,
        guaranteeResult: false,
        timestamp: new Date('2024-06-15T14:30:00Z'),
        metrics: { securityScore: 95, vulnerabilities: 3 },
        scope: { country: 'Spain', city: 'Cordoba', declaration: '*' },
        computationGroup: computationGroups[1]
      },

      // Individual points with different agreements
      {
        agreementId: agreementIds[2],
        guaranteeId: guaranteeIds[4],
        guaranteeValue: 85.2,
        guaranteeResult: true,
        timestamp: new Date('2024-05-20T09:15:00Z'),
        metrics: { costEfficiency: 85.2, budgetUsage: 92.1 },
        scope: { city: 'Seville' },
        computationGroup: computationGroups[0]
      },
      {
        agreementId: agreementIds[3],
        guaranteeId: guaranteeIds[0],
        guaranteeValue: 97.6,
        guaranteeResult: false,
        timestamp: new Date('2024-05-22T16:45:00Z'),
        metrics: { uptime: 97.6, downtime: 2.4 },
        scope: { city: 'Seville' },
        computationGroup: computationGroups[0]
      },
      {
        agreementId: agreementIds[4],
        guaranteeId: guaranteeIds[2],
        guaranteeValue: 94.8,
        guaranteeResult: false,
        timestamp: new Date('2024-05-25T11:30:00Z'),
        metrics: { errorRate: 0.052, successRate: 0.948 },
        scope: { declaration: '*' },
        computationGroup: computationGroups[2]
      },
      {
        agreementId: agreementIds[4],
        guaranteeId: guaranteeIds[1],
        guaranteeValue: 92.0,
        guaranteeResult: false,
        timestamp: new Date('2024-05-25T11:30:00Z'),
        metrics: { responseTime: 320, throughput: 850 },
        scope: { declaration: '*' },
        computationGroup: computationGroups[2]
      },

      // More points to reach 30
      {
        agreementId: agreementIds[0],
        guaranteeId: guaranteeIds[1],
        guaranteeValue: 87.5,
        guaranteeResult: true,
        timestamp: new Date('2024-06-05T08:00:00Z'),
        metrics: { responseTime: 230, throughput: 1200 },
        scope: { country: 'Spain' },
        computationGroup: computationGroups[3]
      },
      {
        agreementId: agreementIds[0],
        guaranteeId: guaranteeIds[3],
        guaranteeValue: 97.2,
        guaranteeResult: true,
        timestamp: new Date('2024-06-05T08:00:00Z'),
        metrics: { securityScore: 97.2, vulnerabilities: 1 },
        scope: { country: 'Spain' },
        computationGroup: computationGroups[3]
      },
      {
        agreementId: agreementIds[2],
        guaranteeId: guaranteeIds[0],
        guaranteeValue: 99.9,
        guaranteeResult: true,
        timestamp: new Date('2024-06-10T13:20:00Z'),
        metrics: { uptime: 99.9, downtime: 0.1 },
        scope: { country: 'Spain' },
        computationGroup: computationGroups[0]
      },
      {
        agreementId: agreementIds[2],
        guaranteeId: guaranteeIds[2],
        guaranteeValue: 99.1,
        guaranteeResult: true,
        timestamp: new Date('2024-06-10T13:20:00Z'),
        metrics: { errorRate: 0.009, successRate: 0.991 },
        scope: { country: 'Spain' },
        computationGroup: computationGroups[0]
      },
      {
        agreementId: agreementIds[1],
        guaranteeId: guaranteeIds[4],
        guaranteeValue: 92.3,
        guaranteeResult: true,
        timestamp: new Date('2024-06-18T09:45:00Z'),
        metrics: { costEfficiency: 92.3, budgetUsage: 87.5 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[4]
      },
      {
        agreementId: agreementIds[3],
        guaranteeId: guaranteeIds[1],
        guaranteeValue: 86.2,
        guaranteeResult: true,
        timestamp: new Date('2024-05-28T14:15:00Z'),
        metrics: { responseTime: 280, throughput: 950 },
        scope: { city: 'Seville', country: 'Spain' },
        computationGroup: computationGroups[4]
      },
      {
        agreementId: agreementIds[3],
        guaranteeId: guaranteeIds[3],
        guaranteeValue: 94.5,
        guaranteeResult: false,
        timestamp: new Date('2024-05-28T14:15:00Z'),
        metrics: { securityScore: 94.5, vulnerabilities: 4 },
        scope: { city: 'Seville', country: 'Spain' },
        computationGroup: computationGroups[4]
      },
      {
        agreementId: agreementIds[0],
        guaranteeId: guaranteeIds[4],
        guaranteeValue: 88.7,
        guaranteeResult: true,
        timestamp: new Date('2024-06-08T16:30:00Z'),
        metrics: { costEfficiency: 88.7, budgetUsage: 91.2 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[2]
      },
      {
        agreementId: agreementIds[4],
        guaranteeId: guaranteeIds[0],
        guaranteeValue: 98.3,
        guaranteeResult: true,
        timestamp: new Date('2024-05-30T10:00:00Z'),
        metrics: { uptime: 98.3, downtime: 1.7 },
        scope: { country: 'Spain', city: '*', location: '*', declaration: '*' },
        computationGroup: computationGroups[2]
      },
      {
        agreementId: agreementIds[2],
        guaranteeId: guaranteeIds[1],
        guaranteeValue: 88.3,
        guaranteeResult: true,
        timestamp: new Date('2024-06-12T11:45:00Z'),
        metrics: { responseTime: 210, throughput: 1300 },
        scope: { country: 'France', city: 'Paris', location: '*', declaration: '*' },
        computationGroup: computationGroups[2]
      },
      {
        agreementId: agreementIds[1],
        guaranteeId: guaranteeIds[2],
        guaranteeValue: 96.7,
        guaranteeResult: true,
        timestamp: new Date('2024-06-20T15:10:00Z'),
        metrics: { errorRate: 0.033, successRate: 0.967 },
        scope: { country: 'Germany', city: 'Berlin', location: '*', declaration: 'DEC-2024-001' },
        computationGroup: computationGroups[2]
      },
      {
        agreementId: agreementIds[3],
        guaranteeId: guaranteeIds[4],
        guaranteeValue: 90.1,
        guaranteeResult: true,
        timestamp: new Date('2024-06-01T09:30:00Z'),
        metrics: { costEfficiency: 90.1, budgetUsage: 89.8 },
        scope: { country: 'Italy', city: 'Rome', location: 'Via Appia 12', declaration: '*' },
        computationGroup: computationGroups[3]
      },
      {
        agreementId: agreementIds[4],
        guaranteeId: guaranteeIds[3],
        guaranteeValue: 93.8,
        guaranteeResult: false,
        timestamp: new Date('2024-06-02T13:50:00Z'),
        metrics: { securityScore: 93.8, vulnerabilities: 5 },
        scope: { country: 'Spain', city: 'Córdoba', declaration: '*' },
        computationGroup: computationGroups[3]
      },
      {
        agreementId: agreementIds[0],
        guaranteeId: guaranteeIds[0],
        guaranteeValue: 99.6,
        guaranteeResult: true,
        timestamp: new Date('2024-06-15T10:30:00Z'),
        metrics: { uptime: 99.6, downtime: 0.4 },
        scope: { country: 'Spain', city: 'Malaga', declaration: '*' },
        computationGroup: computationGroups[1]
      },
      {
        agreementId: agreementIds[2],
        guaranteeId: guaranteeIds[3],
        guaranteeValue: 96.4,
        guaranteeResult: true,
        timestamp: new Date('2024-06-18T14:20:00Z'),
        metrics: { securityScore: 96.4, vulnerabilities: 2 },
        scope: { country: 'asdasd' },
        computationGroup: computationGroups[1]
      },
      {
        agreementId: agreementIds[1],
        guaranteeId: guaranteeIds[1],
        guaranteeValue: 85.6,
        guaranteeResult: true,
        timestamp: new Date('2024-06-22T11:05:00Z'),
        metrics: { responseTime: 260, throughput: 980 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[3]
      },
      {
        agreementId: agreementIds[3],
        guaranteeId: guaranteeIds[2],
        guaranteeValue: 95.3,
        guaranteeResult: true,
        timestamp: new Date('2024-06-05T16:40:00Z'),
        metrics: { errorRate: 0.047, successRate: 0.953 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[1]
      },
      {
        agreementId: agreementIds[4],
        guaranteeId: guaranteeIds[4],
        guaranteeValue: 86.9,
        guaranteeResult: true,
        timestamp: new Date('2024-06-08T09:15:00Z'),
        metrics: { costEfficiency: 86.9, budgetUsage: 93.2 },
        scope: { country: 'Spain', city: 'Córdoba', declaration: '*' },
        computationGroup: computationGroups[1]
      },
      {
        agreementId: agreementIds[0],
        guaranteeId: guaranteeIds[2],
        guaranteeValue: 97.8,
        guaranteeResult: true,
        timestamp: new Date('2024-06-20T13:00:00Z'),
        metrics: { errorRate: 0.022, successRate: 0.978 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[4]
      },
      {
        agreementId: agreementIds[2],
        guaranteeId: guaranteeIds[0],
        guaranteeValue: 99.1, 
        guaranteeResult: true,
        timestamp: new Date('2024-06-25T10:50:00Z'),
        metrics: { uptime: 99.1, downtime: 0.9 },
        scope: { country: 'Spain', city: 'Seville', declaration: '*' },
        computationGroup: computationGroups[4]
      }
    ];

    let created = 0;
    let existing = 0;

    for (const pointData of points) {
      // Try to create the point
      try {
        await models.Point.create(pointData);
        console.log(`Point for agreement "${pointData.agreementId}" (${pointData.guaranteeId}) successfully created.`);
        created++;
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`Point for agreement "${pointData.agreementId}" (${pointData.guaranteeId}) already exists.`);
          existing++;
        } else {
          throw error;
        }
      }
    }

    console.log(`Points population completed. Created: ${created}, Already existing: ${existing}`);
  } catch (error) {
    console.error('Error during points population:', error);
  }
}

await populatePoints();
