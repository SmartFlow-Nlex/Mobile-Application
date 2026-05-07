import { Router, Request, Response } from 'express';
import { ForecastsResponse, AlertSeverity } from '@smartflow/shared';

const router: Router = Router();

/**
 * Forecasts Routes
 */

// GET /api/v1/forecasts - Fetch all forecasts
router.get('/', (_req: Request, res: Response): void => {
  const response: ForecastsResponse = {
    success: true,
    data: [
      {
        id: 'fc1',
        title: 'Featured at DMS Panalo Grounds',
        description: 'Event expected at 6:10 a.m.',
        severity: 'medium' as AlertSeverity,
        timestamp: new Date().toISOString(),
        affectedSegments: ['seg1'],
      },
      {
        id: 'fc2',
        title: 'ML-Identified Hotspots',
        description: 'Multiple incidents detected',
        severity: 'high' as AlertSeverity,
        timestamp: new Date().toISOString(),
        affectedSegments: ['seg2'],
      },
      {
        id: 'fc3',
        title: 'Residential Countryside Freqs',
        description: 'Potential congestion expected',
        severity: 'low' as AlertSeverity,
        timestamp: new Date().toISOString(),
        affectedSegments: ['seg3'],
      },
    ],
  };
  res.json(response);
});

// GET /api/v1/forecasts/:id - Fetch specific forecast
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const response: ForecastsResponse = {
    success: true,
    data: [
      {
        id,
        title: `Forecast #${id}`,
        description: 'Event details',
        severity: 'medium' as AlertSeverity,
        timestamp: new Date().toISOString(),
        affectedSegments: [],
      },
    ],
  };
  res.json(response);
});

export default router;
