/**
 * Creates a mock Grafana panel object with sensible defaults.
 *
 * @param {object} overrides - Properties to override the default panel.
 * @param {string} overrides.type - The type of the panel (e.g., 'graph', 'table', 'stat').
 * @param {string} overrides.datasourceType - The type of the datasource (e.g., 'prometheus', 'grafana-postgresql-datasource').
 * @param {object[]} [overrides.targets] - Custom targets array. Will be generated if not provided.
 * @returns {object} A mock Grafana panel object.
 */
export const  createMockPanel = (overrides = {}) => {
  const panelId = overrides.id // Unique ID
  const panelType = overrides.type || 'graph';
  const datasourceType = overrides.datasourceType || 'prometheus';
  const datasourceUid = overrides.datasourceUid || 'mock-ds-uid'; // A default mock UID

  let defaultTargets = [];

  switch (datasourceType) {
    case 'prometheus':
    // Prometheus targets use 'expr'
      defaultTargets = [
        {
          refId: 'A',
          expr: `metric_${panelId}`, // Example PromQL expression
          datasource: { type: datasourceType, uid: datasourceUid },
        },
      ];
      break;
    case 'grafana-postgresql-datasource':
    case 'mysql': // Or other SQL-based datasources
    // SQL-based targets use 'rawSql' and optionally 'table'
      defaultTargets = [
        {
          refId: 'A',
          rawSql: `SELECT * FROM data_${panelId}`,
          table: `table_${panelId}`, // Only if applicable for the SQL type
          datasource: { type: datasourceType, uid: datasourceUid },
        },
      ];
      break;
      // Add more cases for other datasource types as needed
    default:
      console.warn(`[createMockPanel] Unsupported datasource type: ${datasourceType}. Using generic target.`);
      defaultTargets = [{ refId: 'A', query: `query_for_panel_${panelId}`, datasource: { type: datasourceType, uid: datasourceUid } }];
  }

  // If specific targets are provided, use them, otherwise use the generated defaults
  const targets = overrides.targets || defaultTargets;

  return {
    id: panelId,
    title: overrides.title || `Panel ${panelId}`,
    type: panelType,
    fieldConfig: { defaults: { displayName: `P${panelId}` } },
    gridPos: overrides.gridPos || { x: 0, y: 0, w: 12, h: 8 }, // Sensible default
    targets: targets,
    // Add other common panel properties here as needed (e.g., options, thresholds)
    ...overrides // Allow any other property to be overridden
  };
};
