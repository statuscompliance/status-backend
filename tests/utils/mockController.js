import { vi } from 'vitest';

/**
 * Mocks a method on a given model using Vitest's spy functionality.
 * It can be configured to resolve with a specific value or reject with an error.
 *
 * @param {object} model - The object containing the method to be mocked (e.g., a Sequelize model or service).
 * @param {string} action - The name of the method to spy on (as a string).
 * @param {*} returnValue - The value to resolve if the method is called (used when `error` is not provided).
 * @param {Error|null} [error=null] - Optional error to reject with, instead of resolving.
 * @param {boolean} [once=true] - If true, uses mockResolvedValueOnce/mockRejectedValueOnce. If false, uses mockResolvedValue/mockRejectedValue.
 * @returns {import('vitest').MockInstance} - The spy instance created by Vitest.
 */

export function mockController(model, action, returnValue, error = null, once = true) {
  const spy = vi.spyOn(model, action);
  if (error) {
    spy[once ? 'mockRejectedValueOnce' : 'mockRejectedValue'](error);
  } else if (once) {
    spy.mockResolvedValueOnce(returnValue);
  } else {
    spy.mockResolvedValue(returnValue);
  }
  return spy;
}
