import { methods } from '../config/grafana.js';

export async function searchItems(req, res) {
  try {
    const {
      query = '',
      tag,
      type,
      dashboardUIDs,
      folderUIDs,
      starred,
      limit = 1000,
      page = 1,
    } = req.query;

    // Utility to parse comma-separated values into an array, or return undefined for empty values.
    const parseList = (val) =>
      val ? (Array.isArray(val) ? val : val.split(',')) : undefined;

    const tags = parseList(tag);
    const dashUIDs = parseList(dashboardUIDs);
    const folderUIDsParsed = parseList(folderUIDs);

    const starredFlag = starred === 'true' ? true : starred === 'false' ? false : undefined;

    const limitNum = Math.min(Number(limit), 5000) || 1000;
    const pageNum = Number(page) || 1;

    const response = await methods.search.search(
      query || undefined,
      tags,
      type || undefined,
      undefined,            // dashboardIds (deprecated)
      dashUIDs,
      undefined,            // folderIds (deprecated)
      folderUIDsParsed,
      starredFlag,
      limitNum,
      pageNum
    );

    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      return res.status(status).json(data);
    }
    return res.status(500).json({
      message: 'Failed to search in Grafana due to server error',
      error: error.message,
    });
  }
}
