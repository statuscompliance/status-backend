import registry from '../config/registry.js';
import { agreementBuilder } from './agreementBuilder.js';
import _ from 'lodash';

export async function updateOrCreateAgreement(catalog, controls, agreementId) {

  const agreement = await agreementBuilder(catalog, controls, { id: agreementId });

  try {
    const response = await registry.get(`api/v6/agreements/${agreementId}`);

    const oldAgreement = response.data;

    if (!_.isEqual(agreement, oldAgreement)) {

      await registry.put(`api/v6/agreements/${agreementId}`, agreement);
    }
  } catch (error) {
    if (error.response?.status === 404) {

      await registry.post('api/v6/agreements', agreement);
    } else {
      throw error; // Rethrow other errors
    }
  }
};
