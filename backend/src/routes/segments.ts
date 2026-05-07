import { Router, Request, Response } from 'express';
import { SegmentsResponse, TrafficCondition, SegmentStatus } from '@smartflow/shared';

const router: Router = Router();

/**
 * Segments Routes
 */

// GET /api/v1/segments - Fetch all segment data
router.get('/', (_req: Request, res: Response): void => {
  const response: SegmentsResponse = {
    success: true,
    data: [
      {
        id: 'seg1',
        direction: 'northbound' as SegmentStatus,
        startingPoint: 'Manila',
        destination: 'Quezon City',
        condition: 'normal' as TrafficCondition,
        distance: 15,
        estimatedTime: 25,
      },
      {
        id: 'seg2',
        direction: 'southbound' as SegmentStatus,
        startingPoint: 'Quezon City',
        destination: 'Manila',
        condition: 'congested' as TrafficCondition,
        distance: 15,
        estimatedTime: 45,
      },
      {
        id: 'seg3',
        direction: 'eastbound' as SegmentStatus,
        startingPoint: 'Pasig',
        destination: 'Antipolo',
        condition: 'normal' as TrafficCondition,
        distance: 20,
        estimatedTime: 30,
      },
    ],
  };
  res.json(response);
});

// GET /api/v1/segments/:id - Fetch specific segment
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const response: SegmentsResponse = {
    success: true,
    data: [
      {
        id,
        direction: 'northbound' as SegmentStatus,
        startingPoint: 'Point A',
        destination: 'Point B',
        condition: 'normal' as TrafficCondition,
        distance: 10,
        estimatedTime: 20,
      },
    ],
  };
  res.json(response);
});

export default router;
