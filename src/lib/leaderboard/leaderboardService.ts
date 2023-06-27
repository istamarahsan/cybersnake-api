import { UUID, randomUUID } from "crypto";
import { Result, error, ok } from "../../util/result.js";
import { LeaderboardEntry } from "./leaderboard.js";
import { LeaderboardData } from "./leaderboardData.js";
import { DateTimeProvider } from "../../util/date.js";

export class LeaderboardService {
    private readonly data: LeaderboardData
    private readonly dateTimeProvider: DateTimeProvider
    constructor(data: LeaderboardData, dateTimeProvider: DateTimeProvider) {
        this.data = data;
        this.dateTimeProvider = dateTimeProvider;
    }
    async addEntry(name: string, score: number): Promise<Result<LeaderboardEntry>> {
        const uuid: UUID = randomUUID();
        const now = this.dateTimeProvider.now();
        return this.data.addEntry(uuid, name, score, now);
    }
    async getAllEntries(): Promise<Result<LeaderboardEntry[]>> {
        return await this.data.getAllEntries();
    }
    async clearAllEntries(): Promise<Result<undefined>> {
        const deleteResult = await this.data.deleteAllEntries();
        return deleteResult.ok ? ok(undefined) : error(undefined);
    }
}