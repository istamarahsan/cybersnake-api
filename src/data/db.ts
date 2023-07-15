export interface Leaderboard {
  name: string;
  score: number;
  creation: Date;
}

export interface DB {
  leaderboard: Leaderboard;
}  