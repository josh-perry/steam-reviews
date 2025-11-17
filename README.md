# steam reviews
A daily (*dle) game about guessing which Steam games have higher reviews + a game about guessing the correct steam game based on store tags!

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

### Production
```bash
docker compose down && docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

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