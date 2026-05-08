import * as analyticsService from '../services/analytics.service.js';

export async function getDashboard(req, res, next) {
  try {
    const data = await analyticsService.getUserAnalytics(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
}
