import { models } from '../models/models.js';
import moment from 'moment';
import { getDates } from './dates.js';

export async function storeGuaranteePoints(guaranteeStates, agreement) {
  const result = { storedPoints: [], error: [] };

  const points = [];

  for (const guaranteeResult of guaranteeStates) {
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
    const computationGroup = guaranteeResult.evidences[0]?.computationGroup;
    console.log(`Computation Group: ${computationGroup}`);
    const pointData = {
      agreementId: guaranteeResult.agreementId,
      guaranteeId: guaranteeResult.id,
      guaranteeValue: Object.values(guaranteeResult.metrics)[0],
      guaranteeResult: guaranteeResult.value,
      timestamp: timestamp,
      metrics: guaranteeResult.metrics,
      scope: guaranteeResult.scope,
      computationGroup: computationGroup
    };

    const existingPoint = await models.Point.findOne({
      where: {
        timestamp: pointData.timestamp,
        scope: pointData.scope,
        guaranteeId: pointData.guaranteeId,
        agreementId: pointData.agreementId
      }
    });

    console.log(`existingPoint: ${JSON.stringify(existingPoint,null, 2)}`);

    if (existingPoint !== null) {
      result.error.push({ message: `Point with \n timestamp: ${pointData.timestamp},\n scope: \n ${JSON.stringify(pointData.scope)},\n guaranteeId: ${pointData.guaranteeId},\n and agreementId: ${pointData.agreementId}\n already exists.` });
      console.log(`[points] Point with \n timestamp: ${pointData.timestamp},\n scope: \n ${JSON.stringify(pointData.scope)},\n guaranteeId: ${pointData.guaranteeId},\n and agreementId: ${pointData.agreementId}\n already exists.`);
    } else {
      points.push(pointData);
    }

  }

  try {
    console.log(`[points] ${points.length} guarantee points successfully stored in PostgreSQL.`);
    result.storedPoints = await models.Point.bulkCreate(points);
  } catch (error) {
    console.error('Error storing guarantee points:', error);
    result.error.push({ message: 'Error storing guarantee points', details: error });
  }

  return result;
}
