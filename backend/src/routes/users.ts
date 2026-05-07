import { Router, Request, Response } from 'express';
import { UpdateUserRequest, UserResponse } from '@smartflow/shared';

const router: Router = Router();

const getMockUser = (id: string) => ({
  id,
  displayName: id === '1' ? 'NLEX Traveler' : `User ${id}`,
  username: id === '1' ? 'nlextraveler' : `user${id}`,
  email: `user${id}@example.com`,
  avatarUri: undefined,
});

/**
 * Users Routes
 */

// GET /api/v1/users/current - Fetch current user (mock)
router.get('/current', (_req: Request, res: Response): void => {
  const response: UserResponse = {
    success: true,
    data: getMockUser('1'),
  };
  res.json(response);
});

// GET /api/v1/users/:id - Fetch specific user
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const response: UserResponse = {
    success: true,
    data: getMockUser(id),
  };
  res.json(response);
});

// PATCH /api/users/:id - Update specific user
router.patch(
  '/:id',
  (
    req: Request<{ id: string }, UserResponse, UpdateUserRequest>,
    res: Response
  ): void => {
    const authorizationHeader = req.header('authorization');

    if (!authorizationHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Bearer token is required',
      });
      return;
    }

    const { id } = req.params;
    const { displayName, username, email, avatarUri } = req.body;
    const existingUser = getMockUser(id);

    const response: UserResponse = {
      success: true,
      data: {
        ...existingUser,
        displayName: displayName ?? existingUser.displayName,
        username: username ?? existingUser.username,
        email: email ?? existingUser.email,
        avatarUri: avatarUri ?? existingUser.avatarUri,
      },
    };

    res.json(response);
  }
);

export default router;
