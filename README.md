# Steam Reviews Game

A full-stack application for guessing Steam game ratings. The project is split into a frontend and API structure.

## Project Structure

```
steam-reviews/
├── package.json          # Root package.json for managing both projects
├── frontend/             # Frontend application (TypeScript + Lit)
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.ts
├── api/                  # Express API server
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── README.md
```

## Development

### Quick Start (Both Frontend & API)

```bash
# Install dependencies for both projects
npm run install:all

# Start both frontend and API in development mode
npm run dev
```

### Individual Project Commands

#### Frontend Development
```bash
cd frontend
npm install
npm run dev        # Start webpack dev server
npm run build      # Build for production
```

#### API Development
```bash
cd api
npm install
npm run dev        # Start API server with nodemon
npm run build      # Build TypeScript to JavaScript
npm run start      # Start production server
```

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/games` - Get list of games with ratings

## Environment Variables (API)

Create a `.env` file in the `api` directory:

```
PORT=5000
NODE_ENV=development
```

## Technologies

### Frontend
- TypeScript
- Lit (Web Components)
- Redux Toolkit
- Webpack

### API
- Node.js
- Express
- TypeScript
- CORS enabled for frontend communication