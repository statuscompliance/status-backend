export function calculateCompliance(computations) {
  if (computations.length === 0) return [];
  
  const computationGroup = computations[0].computationGroup;
  const control_id = computations[0].control_id;
  const period = computations[0].period;
  
  const scopeKeys = Object.keys(computations[0].scope);
  const trimmedScope = { ...computations[0].scope };
  delete trimmedScope[scopeKeys[scopeKeys.length - 1]];
  
  const totalEvidences = computations.reduce((sum, comp) => sum + comp.evidences.length, 0);
  const trueCount = computations.reduce((sum, comp) => 
    sum + comp.evidences.filter(evidence => evidence.result === true).length, 0);
  
  const complianceValue = totalEvidences > 0 ? Math.round((trueCount / totalEvidences) * 100) : 0;
  
  return [{
    id: computationGroup,
    value: complianceValue,
    scope: trimmedScope,
    evidences: computations,
    period: period,
    control_id: control_id
  }];
}
