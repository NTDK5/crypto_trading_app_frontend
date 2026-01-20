# CryptoTrade Frontend

Modern cryptocurrency trading platform frontend built with React, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Binary Options Trading** - Trade crypto with UP/DOWN predictions
- 💰 **Wallet Management** - Deposit, withdraw, and track your balance
- 📊 **Real-time Market Data** - Live cryptocurrency prices and charts
- 📈 **Dashboard** - Comprehensive trading statistics and analytics
- 🔐 **Authentication** - Secure login and registration
- 🎨 **Modern UI** - Beautiful dark-themed interface

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Recharts** - Charting library
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create environment file** (optional)
   
   Create a `.env` file in the root directory:
   ```env
   # API Configuration
   # The base URL for the backend API
   # If not set, defaults to '/api' which uses the Vite proxy (localhost:3000)
   VITE_API_URL=http://localhost:3000/api
   ```
   
   **Environment Variables:**
   - `VITE_API_URL` - Backend API URL (default: `/api` uses proxy to `http://localhost:3000`)
     - Development: `http://localhost:3000/api`
     - Production: Set to your production API URL (e.g., `https://api.yourapp.com/api`)

3. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3001`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

```bash
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── Header.tsx
│   ├── Layout.tsx
│   ├── ProtectedRoute.tsx
│   └── Sidebar.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Market.tsx
│   ├── Register.tsx
│   ├── Trade.tsx
│   └── Wallet.tsx
├── services/          # API services
│   ├── api.ts
│   ├── authService.ts
│   ├── marketService.ts
│   ├── tradeService.ts
│   └── walletService.ts
├── App.tsx            # Main app component
├── main.tsx           # Entry point
└── index.css          # Global styles
```

## Features Overview

### Trading Interface
- Select from multiple cryptocurrency pairs (BTC, ETH, BNB, SOL, ADA)
- Choose UP or DOWN direction
- Set investment amount and duration
- Real-time trade countdown
- Automatic trade settlement

### Wallet Management
- View balances across multiple assets
- Deposit and withdrawal requests
- Transaction history with status tracking
- Locked balance display for open trades

### Market Overview
- Real-time price updates
- 24-hour statistics (high, low, volume, change)
- Interactive price charts
- Multiple asset comparison

### Dashboard
- Trading statistics (win rate, total profit/loss)
- Recent trades overview
- Top markets display
- Balance summary

## API Integration

The frontend connects to the backend API at `/api`. All API calls are handled through service files in `src/services/`:

- **authService** - Authentication endpoints
- **walletService** - Wallet and transaction endpoints
- **tradeService** - Trading endpoints
- **marketService** - Market data endpoints

## Authentication

The app uses JWT tokens stored in localStorage:
- Access token for API requests
- Refresh token for token renewal
- Automatic token refresh on 401 errors

## Styling

The app uses Tailwind CSS with a custom dark theme:
- Dark background (`dark-900`, `dark-800`)
- Primary color scheme (`primary-500` to `primary-700`)
- Responsive design with mobile support

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier-friendly formatting

## License

ISC

