import { methods } from '../config/grafana.js';

// In-memory cache for dashboard responses
const dashboardCache = new Map();
const DASHBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches dashboard data by UID, using in-memory cache to reduce API calls.
 * @param {string} uid - Grafana dashboard UID
 * @returns {Promise<object>} - The dashboard object
 */
async function getDashboardWithCache(uid) {
  const now = Date.now();
  const cached = dashboardCache.get(uid);

  // Check if the dashboard exists in the cache and if it hasn't expired
  if (cached && now - cached.fetchedAt < DASHBOARD_CACHE_TTL) {
    return cached.dashboard;
  }

  // If not in cache or expired, fetch the dashboard data from Grafana
  const response = await methods.dashboard.getDashboardByUID(uid);
  const dashboard = response.data.dashboard;

  // Store the fetched dashboard data in the cache along with the current timestamp
  dashboardCache.set(uid, { dashboard, fetchedAt: now });
  return dashboard;
}

/**
 * Transforms a list of Panel model instances into DTOs by fetching
 * the full panel metadata from Grafana and merging it.
 *
 * @param {Array<object>} panels - Array of panel records with dataValues
 * @returns {Promise<Array<object>>} - Array of enriched panel DTOs
 */

export async function mapPanelsToDTO(panels) {
  const result = [];

  for (const panelRecord of panels) {
    const panel = panelRecord.dataValues || panelRecord;
    const { dashboardUid, id: panelId } = panel;

    if (!dashboardUid) {
      // Skip panels without a dashboard reference
      continue;
    }

    try {
      const dashboard = await getDashboardWithCache(dashboardUid);
      const panelElement = dashboard.panels.find((e) => e.id === panelId);

      if (!panelElement) {
        // If panel not found in dashboard, skip
        continue;
      }

      // Extract the target from the panel element
      const target = (panelElement.targets && panelElement.targets[0]) || {};

      result.push({
        ...panel,
        title: panelElement.title,
        type: panelElement.type,
        sqlQuery: target.rawSql,
        table: target.table,
        displayName: target.alias,
        gridPos: panelElement.gridPos,
      });
    } catch (error) {
      // Log and skip failures for individual dashboards/panels
      console.error(
        `Error mapping panel ${panelId} for dashboard ${dashboardUid}:`,
        error
      );
    }
  }

  return result;
}
