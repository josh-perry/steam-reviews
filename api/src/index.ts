import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Steam Reviews API is running' });
});

app.get('/api/games', (req, res) => {
  const games = [
    {
      id: 1,
      name: "Counter-Strike 2",
      appId: 730,
      rating: 4.2,
      reviewCount: 15420
    },
    {
      id: 2,
      name: "Dota 2",
      appId: 570,
      rating: 4.5,
      reviewCount: 28650
    },
    {
      id: 3,
      name: "Steam Deck",
      appId: 1675200,
      rating: 4.8,
      reviewCount: 8943
    },
    {
      id: 4,
      name: "Apex Legends",
      appId: 1172470,
      rating: 3.9,
      reviewCount: 45231
    },
    {
      id: 5,
      name: "Team Fortress 2",
      appId: 440,
      rating: 4.6,
      reviewCount: 67890
    },
    {
      id: 6,
      name: "Portal 2",
      appId: 620,
      rating: 4.9,
      reviewCount: 12567
    },
    {
      id: 7,
      name: "Half-Life: Alyx",
      appId: 546560,
      rating: 4.7,
      reviewCount: 9834
    }
  ];
  
  res.json(games);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});