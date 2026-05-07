# SmartFlow NLEX - Mobile App Prototype

A modern React Native/Expo mobile application with a Node.js Express backend for real-time traffic management in NLEX (North Luzon Expressway).

## 📋 Project Structure

This is a **monorepo** with the following structure:

```
smartflow-nlex-monorepo/
├── frontend/                 # React Native / Expo app
│   ├── app/                  # Expo Router app directory
│   │   ├── _layout.tsx      # Root navigation layout
│   │   ├── index.tsx        # Splash/onboarding screen
│   │   └── (tabs)/          # Tab-based navigation
│   │       ├── _layout.tsx
│   │       ├── dashboard.tsx # Main dashboard
│   │       ├── alerts.tsx    # Alerts screen
│   │       └── profile.tsx   # Profile screen
│   ├── components/          # Reusable components
│   │   ├── TrafficCard.tsx
│   │   ├── SegmentStatusCard.tsx
│   │   ├── EventForecastCard.tsx
│   │   └── HotspotCard.tsx
│   ├── constants/           # Constants and theme
│   │   ├── colors.ts
│   │   └── typography.ts
│   ├── hooks/               # Custom React hooks (optional)
│   ├── types/               # Local type definitions
│   ├── app.json             # Expo configuration
│   ├── tsconfig.json        # TypeScript configuration
│   └── package.json
│
├── backend/                 # Node.js Express API server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   │   ├── dashboard.ts
│   │   │   ├── traffic.ts
│   │   │   ├── segments.ts
│   │   │   ├── forecasts.ts
│   │   │   ├── hotspots.ts
│   │   │   └── users.ts
│   │   ├── controllers/     # Business logic (optional)
│   │   ├── services/        # Service layer (optional)
│   │   ├── middleware/      # Express middleware
│   │   └── index.ts         # Server entry point
│   ├── tsconfig.json        # TypeScript configuration
│   └── package.json
│
├── shared/                  # Shared TypeScript types
│   ├── types/
│   │   └── index.ts         # Common DTOs and interfaces
│   └── package.json
│
└── package.json             # Root workspace config

```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd smartflow-nlex-monorepo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This will install dependencies for all three workspaces (frontend, backend, shared).

### Development

#### Start Frontend (React Native / Expo)

```bash
npm run frontend
```

This will start the Expo development server. You can then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Press `w` to open web browser
- Scan QR code with Expo Go app on your phone

#### Start Backend (Express API)

```bash
npm run backend
```

The API server will run on `http://localhost:3000`

#### Start Both Frontend & Backend

```bash
npm run dev
```

### Building

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Build Backend
```bash
cd backend
npm run build
```

#### Type Checking

```bash
npm run type-check
```

## 📱 Features

### Dashboard Screen
- **NLEX Traffic Display**: Real-time traffic duration and condition
- **Segment Status**: Northbound/Southbound traffic information
- **Event Forecasts**: Upcoming events and alerts
- **ML Hotspots**: Machine learning identified traffic hotspots
- **Pull-to-Refresh**: Swipe down to refresh data

### Navigation
- **Tab-based Navigation**: Dashboard, Alerts, Profile
- **Expo Router**: File-based routing system
- **Dark Mode**: Pre-configured dark theme

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React Native with Expo
- **Routing**: Expo Router (file-based)
- **Language**: TypeScript (strict mode)
- **Styling**: React Native StyleSheet
- **State Management**: React hooks (useState, useEffect)

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **API Format**: RESTful JSON API

### Shared Types
- All API request/response types are defined in `shared/types/index.ts`
- Used by both frontend and backend to ensure type safety
- Single source of truth for data contracts

## 📝 Coding Standards

### TypeScript Configuration
- `strict: true` - Enforces strict type checking
- `noImplicitAny: true` - No implicit `any` types
- `strictNullChecks: true` - Null/undefined safety
- `noUnusedLocals: true` - No unused variables
- `noUnusedParameters: true` - No unused function parameters

### Component Structure
```tsx
interface ComponentProps {
  // All props explicitly typed
  title: string;
  onPress?: () => void;
}

const MyComponent: React.FC<ComponentProps> = ({ title, onPress }) => {
  // Component implementation
};

export default MyComponent;
```

### Styling
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // All styles defined in StyleSheet
});
```

## 📦 Workspace Imports

### Import Shared Types
```tsx
// Frontend
import { TrafficData, DashboardData } from '@smartflow/shared';

// Backend
import { ApiResponse, TrafficData } from '@smartflow/shared';
```

### Path Aliases
Frontend:
```
@/* → ./*
@components/* → ./components/*
@constants/* → ./constants/*
@smartflow/shared → ../shared/types/index.ts
```

Backend:
```
@/* → ./src/*
@routes/* → ./src/routes/*
@smartflow/shared → ../shared/types/index.ts
```

## 🔌 API Endpoints

### Dashboard
- `GET /api/v1/dashboard` - Aggregated dashboard data

### Traffic
- `GET /api/v1/traffic` - All traffic data
- `GET /api/v1/traffic/:id` - Specific traffic

### Segments
- `GET /api/v1/segments` - All segment status
- `GET /api/v1/segments/:id` - Specific segment

### Forecasts
- `GET /api/v1/forecasts` - All forecasts
- `GET /api/v1/forecasts/:id` - Specific forecast

### Hotspots
- `GET /api/v1/hotspots` - All hotspots
- `GET /api/v1/hotspots/:id` - Specific hotspot

### Users
- `GET /api/v1/users/current` - Current user
- `GET /api/v1/users/:id` - Specific user

## 🎨 Design System

### Colors
- **Primary**: `#007AFF` (Blue)
- **Success**: `#34C759` (Green)
- **Warning**: `#FF9500` (Orange)
- **Danger**: `#FF3B30` (Red)
- **Background**: `#1a1a1a` (Dark)
- **Surface**: `#2a2a2a` (Lighter Dark)

### Typography
- **Heading Styles**: h1, h2, h3, h4
- **Body Styles**: body, bodySm, bodyXs
- **Label Styles**: label, labelSm
- **Font Weights**: light, normal, medium, semibold, bold

## 🧪 Testing

### Type Checking
```bash
npm run type-check
```

### Running Tests
```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && npm test
```

## 📚 Adding a New Screen

1. Create the screen file in `frontend/app/(tabs)/myscreen.tsx`
2. Add any required components in `frontend/components/`
3. Update shared types in `shared/types/index.ts` if needed
4. Add tab navigation in `frontend/app/(tabs)/_layout.tsx`

Example:
```tsx
// frontend/app/(tabs)/myscreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@constants/colors';

interface MyScreenProps {}

const MyScreen: React.FC<MyScreenProps> = () => {
  return <View style={styles.container}></View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default MyScreen;
```

## 📚 Adding a New API Endpoint

1. Create route file in `backend/src/routes/myfeature.ts`
2. Import route in `backend/src/index.ts`
3. Add types to `shared/types/index.ts`
4. Call API from frontend using fetch or axios

Example:
```ts
// backend/src/routes/myfeature.ts
import { Router, Request, Response } from 'express';
import { MyFeatureResponse } from '@smartflow/shared';

const router: Router = Router();

router.get('/', (req: Request, res: Response): void => {
  const response: MyFeatureResponse = {
    success: true,
    data: [],
  };
  res.json(response);
});

export default router;
```

## 🔄 Updating Dependencies

```bash
# Update specific package
npm install package-name@latest -w frontend

# Update all packages in a workspace
npm update -w frontend
```

## 📖 Environment Variables

Create a `.env` file in the `backend/` folder:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

Frontend uses `app.json` for Expo configuration.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000 (macOS/Linux)
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Clear Cache
```bash
# Frontend
cd frontend && rm -rf node_modules package-lock.json && npm install

# Backend
cd backend && rm -rf node_modules package-lock.json && npm install
```

### Expo Issues
```bash
expo logout
expo login
```

## 📄 License

MIT

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Ensure TypeScript passes: `npm run type-check`
4. Submit a pull request

## 📞 Support

For issues and questions, please refer to:
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [Expo Router Docs](https://expo.github.io/router/)
- [Express Docs](https://expressjs.com)
