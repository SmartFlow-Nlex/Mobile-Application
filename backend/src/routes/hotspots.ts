import { Router, Request, Response } from 'express';
import { HotspotsResponse, AlertSeverity } from '@smartflow/shared';

const router: Router = Router();

/**
 * Hotspots Routes
 */

// GET /api/v1/hotspots - Fetch all hotspots
router.get('/', (_req: Request, res: Response): void => {
  const response: HotspotsResponse = {
    success: true,
    data: [
      {
        id: 'hs1',
        name: 'Sideroad Entry',
        location: { latitude: 14.5994, longitude: 120.9842 },
        reason: 'congestion',
        severity: 'medium' as AlertSeverity,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'hs2',
        name: 'Member Management Details',
        location: { latitude: 14.6091, longitude: 120.9824 },
        reason: 'accident',
        severity: 'high' as AlertSeverity,
        timestamp: new Date().toISOString(),
      },
      {
        id: 'hs3',
        name: 'Market Intersection',
        location: { latitude: 14.5678, longitude: 121.0234 },
        reason: 'construction',
        severity: 'low' as AlertSeverity,
        timestamp: new Date().toISOString(),
      },
    ],
  };
  res.json(response);
});

// GET /api/v1/hotspots/:id - Fetch specific hotspot
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const response: HotspotsResponse = {
    success: true,
    data: [
      {
        id,
        name: `Hotspot #${id}`,
        location: { latitude: 14.5994, longitude: 120.9842 },
        reason: 'congestion',
        severity: 'medium' as AlertSeverity,
        timestamp: new Date().toISOString(),
      },
    ],
  };
  res.json(response);
});

export default router;
