export function calculateCompliance(computations) {
  if (computations.length === 0) return [];
  
  const computationGroup = computations[0].computationGroup;
  const controlId = computations[0].controlId;
  const period = computations[0].period;
  
  const scopeKeys = Object.keys(computations[0].scope);
  const trimmedScope = { ...computations[0].scope };
  delete trimmedScope[scopeKeys[scopeKeys.length - 1]];
  
  const totalEvidences = computations.reduce((sum, comp) => sum + comp.evidences.length, 0);
  const trueCount = computations.reduce((sum, comp) =>
    sum + comp.evidences.filter(evidence => evidence.result === true).length, 0);
  console.log(`[compliance] True evidences: ${trueCount}`);
  console.log(`[compliance] Total evidences: ${totalEvidences}`);
  const complianceValue = totalEvidences > 0 ? Math.round((trueCount / totalEvidences) * 100) : 0;
  
  return [{
    id: computationGroup,
    value: complianceValue,
    scope: trimmedScope,
    evidences: computations,
    period: period,
    controlId: controlId
  }];
}
