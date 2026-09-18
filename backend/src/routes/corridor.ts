import { Router, Request, Response } from 'express';
import { getCorridorStatus } from '../services/corridor';

/**
 * Per-exit corridor status for the mobile app.
 *
 * Deliberately the same path and response shape the app used to fetch straight
 * from the dashboard, so switching it over is a change of address and nothing
 * more - no new API client, no new types, no screen changes.
 *
 * What is different is where the numbers come from. The app used to read the
 * dashboard's SQL-aggregated endpoint, which the dashboard itself had stopped
 * rendering from because it disagreed with the map: it counted jams near the
 * corridor that the map discarded for not lying on it. This route runs the
 * dashboard's own derivation over the dashboard's own live feed, so the phone
 * and the dashboard show the same road.
 *
 * Serving it from here rather than deriving on the phone also means the
 * assistant's tools read the identical numbers - one derivation, two readers,
 * nothing to drift.
 */

const router: Router = Router();

router.get('/corridor-status/full', async (_req: Request, res: Response): Promise<void> => {
  const result = await getCorridorStatus();

  if (!result.available) {
    /*
     * 503 rather than an empty corridor: the app draws "clear" from an absence
     * of jams, so returning an empty payload when the feed is down would paint
     * the whole road green. The screen has an explicit offline state for this.
     */
    res.status(503).json({
      success: false,
      error: 'Corridor data unavailable',
      message: result.reason,
    });
    return;
  }

  res.json({ success: true, data: result.data });
});

export default router;
