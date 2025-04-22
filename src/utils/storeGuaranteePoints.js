import { models } from '../models/models';
import { formatISO } from 'date-fns';
import { getDates } from './dates.js';

const PERIOD_DEFAULT = 'monthly';
export async function storeGuaranteePoints(guaranteeStates, agreement) {
  const result = { storedPoints: [], error: [] };

  const points = [];

  for (const guaranteeResult of guaranteeStates) {
    const guaranteeTerm = agreement.terms.guarantees.find(
      (g) => g.id === guaranteeResult.id
    );
    if (!guaranteeTerm) continue;

    const { of } = guaranteeTerm;

    if (!of?.length || !of[0].window) continue;
    if (
      !guaranteeResult.period ||
      !guaranteeResult.period.from ||
      !guaranteeResult.period.to
    )
      continue;

    const periodType = of[0].window.period || PERIOD_DEFAULT;

    const dateWindows = getDates(
      new Date(guaranteeResult.period.from),
      new Date(guaranteeResult.period.to),
      periodType
    );

    const lastWindowDate = dateWindows[dateWindows.length - 1];

    const timestamp = formatISO(lastWindowDate);
    const computationGroup = guaranteeResult.evidences?.[0]?.computationGroup;

    const pointData = {
      agreementId: guaranteeResult.agreementId,
      guaranteeId: guaranteeResult.id,
      guaranteeValue: Object.values(guaranteeResult.metrics)[0],
      guaranteeResult: guaranteeResult.value,
      timestamp,
      metrics: guaranteeResult.metrics,
      scope: guaranteeResult.scope,
      computationGroup,
    };

    try {
      const existingPoint = await models.Point.findOne({
        where: {
          timestamp: pointData.timestamp,
          scope: pointData.scope,
          guaranteeId: pointData.guaranteeId,
          agreementId: pointData.agreementId,
        },
      });

      if (existingPoint) {
        result.error.push({
          type: 'DUPLICATE_POINT',
          data: pointData,
          message: 'Point already exists',
        });
      } else {
        points.push(pointData);
      }
    } catch (queryError) {
      console.error('[points] Error checking for existing point:', queryError);
      result.error.push({
        type: 'CHECK_ERROR',
        id: guaranteeResult.id,
        message: 'Error checking existing point',
        details: queryError.message,
      });
    }
  }

  try {
    if (points.length > 0) {
      result.storedPoints = await models.Point.bulkCreate(points);
    }
  } catch (storeError) {
    console.error('[points] Error storing guarantee points:', storeError);

    result.error.push({
      type: 'STORE_ERROR',
      message: 'Error storing guarantee points',
      details: storeError.message,
    });
  }
  return result;
}
