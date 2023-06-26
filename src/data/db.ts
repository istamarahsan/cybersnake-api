export interface Leaderboard {
    name: string;
    score: number;
    creation: Date;
    id: string;
  }
  
  export interface DB {
    leaderboard: Leaderboard;
  }  