import { Router, Request, Response } from 'express';
import { TrafficResponse, TrafficCondition } from '@smartflow/shared';

const router: Router = Router();

/**
 * Traffic Routes
 */

// GET /api/v1/traffic - Fetch all traffic data
router.get('/', (_req: Request, res: Response): void => {
  const response: TrafficResponse = {
    success: true,
    data: [
      {
        id: '1',
        roadName: 'NLEX Traffic',
        duration: 12,
        condition: 'normal' as TrafficCondition,
        lastUpdated: new Date().toISOString(),
        coordinates: { latitude: 14.5994, longitude: 120.9842 },
      },
      {
        id: '2',
        roadName: 'SLEX Traffic',
        duration: 18,
        condition: 'congested' as TrafficCondition,
        lastUpdated: new Date().toISOString(),
        coordinates: { latitude: 14.5522, longitude: 121.0265 },
      },
    ],
  };
  res.json(response);
});

// GET /api/v1/traffic/:id - Fetch specific traffic data
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const response: TrafficResponse = {
    success: true,
    data: [
      {
        id,
        roadName: `Traffic #${id}`,
        duration: Math.floor(Math.random() * 60),
        condition: 'normal' as TrafficCondition,
        lastUpdated: new Date().toISOString(),
        coordinates: { latitude: 14.5994, longitude: 120.9842 },
      },
    ],
  };
  res.json(response);
});

export default router;
