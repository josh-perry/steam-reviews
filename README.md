# steam reviews
A daily (*dle) game about guessing which Steam games have higher reviews.

Play it [here](https://steam.literallyjosh.com/)!

## Development
### Quick Start
```bash
npm run install:all
npm run dev
```

### Docker
Alternatively with Docker:
```bash
docker compose up --build
```

## API Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/rounds` - Get the game for today

## Technologies
### Frontend
- TypeScript
- Lit (Web components)
- Redux
- Webpack

### API
- Node.js
- Express
- TypeScript
- CORS