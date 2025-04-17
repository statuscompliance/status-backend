export function calculateCompliance(computations) {
  if (computations.length === 0) return [];

  // Extract common properties from the first computation
  const { computationGroup, controlId, period, scope } = computations[0];

  // Create a trimmed scope by removing the last key
  const scopeKeys = Object.keys(scope);
  const trimmedScope = { ...scope };

  if (scopeKeys.length > 0) {
    delete trimmedScope[scopeKeys[scopeKeys.length - 1]];
  }

  // Calculate total and true evidence counts
  const { totalEvidences, trueCount } = computations.reduce(
    (acc, comp) => {
      const evidences = Array.isArray(comp.evidences) ? comp.evidences : [];
      acc.totalEvidences += evidences.length;
      acc.trueCount += evidences.filter(
        (evidence) => evidence.result === true
      ).length;
      return acc;
    },
    { totalEvidences: 0, trueCount: 0 }
  );

  // Calculate compliance value
  const complianceValue =
    totalEvidences > 0 ? Math.round((trueCount / totalEvidences) * 100) : 0;

  return [
    {
      id: computationGroup,
      value: complianceValue,
      scope: trimmedScope,
      evidences: computations,
      period,
      controlId,
    },
  ];
}
