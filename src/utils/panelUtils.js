
import { methods } from '../config/grafana.js';
import redis from '../config/redis.js';

// TTL for Redis cache entries: 1 week in seconds
const REDIS_PANEL_TTL = 7 * 24 * 60 * 60;

/**
 * Retrieves a panel object from Redis cache by its panel ID.
 * @param {number|string} panelId - The unique panel identifier
 * @returns {Promise<object|null>} - Parsed panel data from Redis, or null if not cached
 */
async function getPanelFromRedis(panelId) {
  const json = await redis.get(`grafana:panel:${panelId}`);
  return json ? JSON.parse(json) : null;
}

/**
 * Caches a panel object in Redis with a TTL.
 * @param {number|string} panelId - The unique panel identifier
 * @param {object} data - The panel metadata to cache
 */
async function cachePanelInRedis(panelId, data) {
  await redis.set(
    `grafana:panel:${panelId}`,
    JSON.stringify(data),
    'EX',
    REDIS_PANEL_TTL
  );
}

/**
 * Maps an array of panel records to DTOs by enriching them
 * with metadata fetched from Grafana or Redis cache.
 *
 * @param {Array<object>} panels - Array of panel records (Sequelize models or plain objects)
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

    // Check Redis cache for the panel metadata
    const cached = await getPanelFromRedis(panelId);
    if (cached) {
      result.push({ ...panel, ...cached });
      continue;
    }

    try {
      // Fetch full dashboard from Grafana
      const response = await methods.dashboard.getDashboardByUID(dashboardUid);
      const dashboard = response.data.dashboard;

      // Find the specific panel by its ID
      const panelElement = dashboard.panels.find((e) => e.id === panelId);

      if (!panelElement) {
        // If panel not found in dashboard, skip
        continue;
      }

      // Extract relevant target metadata
      const target = (panelElement.targets && panelElement.targets[0]) || {};

      const dto = {
        title: panelElement.title,
        type: panelElement.type,
        sqlQuery: target.rawSql,
        table: target.table,
        displayName: target.alias,
        gridPos: panelElement.gridPos,
      };

      // Enrich the result and cache the panel
      result.push({ ...panel, ...dto });

      await cachePanelInRedis(panelId, dto);

    } catch (error) {
      // Log and skip failed panel mappings
      console.error(
        `Error mapping panel ${panelId} for dashboard ${dashboardUid}:`,
        error
      );
    }
  }

  return result;
}
