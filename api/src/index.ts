import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'data', '202511_06_A3183.steam.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Steam Reviews API is running' });
});

app.get('/api/games', (req, res) => {
    const query = 'SELECT * FROM app WHERE adult = 0 AND total_reviews > 5000 ORDER BY RANDOM() LIMIT 20';

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database query error:', err.message);
            res.status(500).json({ error: 'Failed to fetch games from database' });
            return;
        }

        const games = rows.map((row: any, index: number) => ({
            appId: row.id,
            name: row.name,
            rating: row.positive_reviews && row.negative_reviews
                ? parseFloat(((row.positive_reviews / (row.positive_reviews + row.negative_reviews)) * 5).toFixed(1))
                : 0,
            reviewCount: row.total_reviews || 0
        }));

        res.json(games);
    });
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }

        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});