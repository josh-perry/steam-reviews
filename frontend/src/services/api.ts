import { Game } from '../store/slices/gameStatusSlice';

const API_BASE_URL = '/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface GameRound {
  gameA: Game;
  gameB: Game;
  correctGame: Game;
}

class ApiService {
  private async fetchWithErrorHandling<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Error:', error);
      return { 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      };
    }
  }

  async getRounds(): Promise<ApiResponse<GameRound[]>> {
    return this.fetchWithErrorHandling<GameRound[]>(`${API_BASE_URL}/rounds`);
  }

  async getGames(): Promise<ApiResponse<Game[]>> {
    return this.fetchWithErrorHandling<Game[]>(`${API_BASE_URL}/games`);
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.fetchWithErrorHandling(`${API_BASE_URL}/health`);
  }
}

export const apiService = new ApiService();