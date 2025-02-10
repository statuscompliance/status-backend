import models from '../../db/models.js';
import moment from 'moment';
import { getDates } from './dates.js';
import registry from '../config/registry.js';

export async function storeGuaranteePoints(guaranteeStates, agreementId) {
  try {
    const points = [];

    console.log(guaranteeStates);

    for (const guaranteeResult of guaranteeStates) {
      const agreementResponse = await registry.get(`api/v6/agreements/${agreementId}`);
      const agreement = agreementResponse.data;
      const guaranteeTerm = agreement.terms.guarantees.find(x => x.id === guaranteeResult.id);
      if (!guaranteeTerm) continue;

      const guaranteeResultWindow = guaranteeTerm.of[0].window;
      guaranteeResultWindow.from = getDates(
        new Date(guaranteeResult.period.from), 
        new Date(guaranteeResult.period.to), 
        guaranteeResultWindow.period || 'monthly'
      );
      guaranteeResultWindow.from = guaranteeResultWindow.from[guaranteeResultWindow.from.length - 1];

      const timestamp = moment(guaranteeResultWindow.from).toISOString();
      const pointData = {
        agreementId: guaranteeResult.agreementId,
        guaranteeId: guaranteeResult.id,
        guaranteeValue: Object.values(guaranteeResult.metrics)[0],
        guaranteeResult: guaranteeResult.value,
        timestamp: timestamp,
        metrics: guaranteeResult.metrics,
        scope: guaranteeResult.scope
      };

      points.push(pointData);
    }
    console.log(`[points] ${points.length} guarantee points successfully stored in PostgreSQL.`);
    const storedPoints = await models.Point.bulkCreate(points);
    return storedPoints;
  } catch (error) {
    console.error('Error storing guarantee points:', error);
  }
}
