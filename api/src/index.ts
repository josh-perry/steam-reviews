import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { spawn } from 'child_process';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const dbPath = path.join(__dirname, '..', 'data', 'games.sqlite');
const roundsFilePath = path.join(__dirname, '..', 'data', 'daily-rounds.json');

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

interface Game {
    appId: number;
    name: string;
    rating: number;
    reviewCount: number;
}

interface GameRound {
    gameA: Game;
    gameB: Game;
    correctGame: Game;
}

interface RoundsData {
    rounds: GameRound[];
    generatedDate: string;
}

const STEAM_DATABASE_URL = 'https://github.com/250/Steam-250/releases/download/snapshots/snapshots.tar.xz';

const downloadFile = (url: string, destination: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                if (response.headers.location) {
                    downloadFile(response.headers.location, destination)
                        .then(resolve)
                        .catch(reject);
                    return;
                }
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve();
            });
            
            file.on('error', (err) => {
                fs.unlink(destination, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

const extractTarXz = (archivePath: string, extractDir: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const tar = spawn('tar', ['-xf', archivePath, '-C', extractDir]);
        
        tar.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`tar extraction failed with code ${code}`));
            }
        });
        
        tar.on('error', (err) => {
            reject(err);
        });
    });
};

const downloadAndExtractDatabase = async (): Promise<void> => {
    console.log('Downloading Steam database...');
    
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const tempArchivePath = path.join(dataDir, 'snapshots.tar.xz');
    const tempExtractDir = path.join(dataDir, 'temp_extract');
    
    try {
        await downloadFile(STEAM_DATABASE_URL, tempArchivePath);
        console.log('Download complete. Extracting archive...');
        
        if (!fs.existsSync(tempExtractDir)) {
            fs.mkdirSync(tempExtractDir, { recursive: true });
        }
        
        await extractTarXz(tempArchivePath, tempExtractDir);
        
        const extractedFiles = fs.readdirSync(tempExtractDir);
        const sqliteFile = extractedFiles.find(file => file.endsWith('.sqlite'));
        
        if (!sqliteFile) {
            throw new Error('No SQLite file found in extracted archive');
        }
        
        const sourcePath = path.join(tempExtractDir, sqliteFile);
        fs.copyFileSync(sourcePath, dbPath);
        
        console.log(`Database setup complete: ${sqliteFile} -> games.sqlite`);
        
        fs.rmSync(tempArchivePath);
        fs.rmSync(tempExtractDir, { recursive: true });
        
    } catch (error) {
        console.error('Error downloading/extracting database:', error);
        
        if (fs.existsSync(tempArchivePath)) {
            fs.rmSync(tempArchivePath);
        }
        if (fs.existsSync(tempExtractDir)) {
            fs.rmSync(tempExtractDir, { recursive: true });
        }
        
        throw error;
    }
};

const initializeDatabase = async (): Promise<void> => {
    if (fs.existsSync(dbPath)) {
        console.log('Database file exists, skipping download');
        return;
    }
    
    console.log('Database file not found, initializing...');
    await downloadAndExtractDatabase();
};

let db: sqlite3.Database;

const connectToDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to SQLite database');
                resolve();
            }
        });
    });
};

const isFileFromToday = (filePath: string): boolean => {
    try {
        const stats = fs.statSync(filePath);
        const fileDate = new Date(stats.mtime).toDateString();
        const today = new Date().toDateString();
        return fileDate === today;
    } catch (error) {
        return false;
    }
};

const createSeededRandom = (seed: number) => {
    let current = seed;
    return () => {
        current = ((current * 9301 + 49297) % 233280) / 233280;
        return current;
    };
};

const getDailySeed = (): number => {
    const today = new Date().toDateString();
    return today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
};

const shuffleArray = <T>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    const random = createSeededRandom(seed);
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
};

const createGameRound = (gameA: Game, gameB: Game): GameRound => {
    const correctGame = gameA.rating > gameB.rating ? gameA : gameB;
    return { gameA, gameB, correctGame };
};

const generateGameRounds = (games: Game[], totalRounds: number = 10): GameRound[] => {
    if (games.length < 2) return [];
    
    const seed = getDailySeed();
    let shuffledGames = shuffleArray(games, seed);
    const rounds: GameRound[] = [];
    let gameIndex = 0;
    
    for (let i = 0; i < totalRounds; i++) {
        if (gameIndex + 1 >= shuffledGames.length) {
            const usedGames = shuffledGames.slice(0, gameIndex);
            const remainingGames = games.filter(g => 
                !usedGames.some(used => used.appId === g.appId)
            );
            const reshuffled = shuffleArray(remainingGames, seed + i);
            shuffledGames.splice(gameIndex, 0, ...reshuffled);
        }
        
        const gameA = shuffledGames[gameIndex];
        const gameB = shuffledGames[gameIndex + 1];
        gameIndex += 2;
        
        rounds.push(createGameRound(gameA, gameB));
    }
    
    return rounds;
};

const transformDatabaseRow = (row: any): Game => ({
    appId: row.id,
    name: row.name,
    rating: row.positive_reviews && row.negative_reviews
        ? parseFloat(((row.positive_reviews / (row.positive_reviews + row.negative_reviews)) * 100).toFixed(2))
        : 0,
    reviewCount: row.total_reviews || 0
});

const fetchGamesFromDatabase = (): Promise<Game[]> => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM app WHERE adult = 0 AND total_reviews > 5000 ORDER BY RANDOM() LIMIT 25';
        
        db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Database query error:', err.message);
                reject(err);
                return;
            }
            
            const games = rows.map(transformDatabaseRow);
            resolve(games);
        });
    });
};

const saveRoundsToFile = (rounds: GameRound[]): void => {
    const roundsData: RoundsData = {
        rounds,
        generatedDate: new Date().toISOString()
    };
    
    const dataDir = path.dirname(roundsFilePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(roundsFilePath, JSON.stringify(roundsData, null, 2));
    console.log('Game rounds generated and saved for today');
};

const loadRoundsFromFile = (): GameRound[] | null => {
    try {
        const fileContent = fs.readFileSync(roundsFilePath, 'utf8');
        const roundsData: RoundsData = JSON.parse(fileContent);
        return roundsData.rounds;
    } catch (error) {
        return null;
    }
};

const generateAndSaveRounds = async (): Promise<GameRound[]> => {
    const games = await fetchGamesFromDatabase();
    const rounds = generateGameRounds(games, 10);
    saveRoundsToFile(rounds);
    return rounds;
};

const getRounds = async (): Promise<GameRound[]> => {
    const fileExists = fs.existsSync(roundsFilePath);
    const isFromToday = fileExists && isFileFromToday(roundsFilePath);
    
    if (isFromToday) {
        console.log('Loading rounds from cached file');
        const cachedRounds = loadRoundsFromFile();
        if (cachedRounds) {
            return cachedRounds;
        }
        console.log('Failed to load from cache, generating new rounds');
    } else {
        console.log('Generating new rounds for today');
    }
    
    return await generateAndSaveRounds();
};

const extractUniqueGames = (rounds: GameRound[]): Game[] => {
    const gamesMap = new Map<number, Game>();
    
    rounds.forEach(round => {
        gamesMap.set(round.gameA.appId, round.gameA);
        gamesMap.set(round.gameB.appId, round.gameB);
    });
    
    return Array.from(gamesMap.values());
};

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Steam Reviews API is running' });
});

app.get('/api/rounds', async (req, res) => {
    try {
        const rounds = await getRounds();
        res.json(rounds);
    } catch (error) {
        console.error('Error serving rounds:', error);
        res.status(500).json({ error: 'Failed to generate game rounds' });
    }
});

app.get('/api/games', async (req, res) => {
    try {
        const rounds = await getRounds();
        const games = extractUniqueGames(rounds);
        res.json(games);
    } catch (error) {
        console.error('Error serving games:', error);
        res.status(500).json({ error: 'Failed to fetch games from database' });
    }
});

process.on('SIGINT', () => {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

const startServer = async (): Promise<void> => {
    try {
        await initializeDatabase();
        await connectToDatabase();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();