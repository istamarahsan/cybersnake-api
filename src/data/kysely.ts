import { Kysely } from "kysely";
import { LeaderboardData } from "../lib/leaderboard/leaderboardData.js";
import { Result, error, ok } from "../util/result.js";
import { DateTime } from "luxon";
import { LeaderboardEntry } from "../lib/leaderboard/leaderboard.js";
import { DB } from "./db.js";

export class KyselyData implements LeaderboardData {
    private readonly db: Kysely<DB>
    constructor(db: Kysely<DB>) {
        this.db = db;
    }
    async addEntry(id: string, name: string, score: number, date_created: DateTime): Promise<Result<LeaderboardEntry>> {
        try {
            await this.db.insertInto('leaderboard')
                .values({
                    id: id,
                    name: name,
                    score: score,
                    creation: date_created.toJSDate()
                }).execute();
            const inserted = await this.db.selectFrom("leaderboard").selectAll().where("id", "=", id).executeTakeFirst();
            if (inserted !== undefined) {
                const entry: LeaderboardEntry = {
                    id: inserted.id,
                    name: inserted.name,
                    score: inserted.score,
                    creationDate: DateTime.fromJSDate(inserted.creation)
                }
                return ok(entry)
            }
            return error(undefined)
        } catch (_) {
            return error(undefined)
        }

    }
    async getAllEntries(): Promise<Result<LeaderboardEntry[]>> {
        try {
            const entries = await this.db.selectFrom("leaderboard").selectAll().orderBy("score", "desc").execute();
            const mapped = entries.map((entry) => {
                return {
                    id: entry.id,
                    name: entry.name,
                    score: entry.score,
                    creationDate: DateTime.fromJSDate(entry.creation)
                }
            })
            return ok(mapped)
        } catch (_) {
            return error(undefined)
        }
    }
    async deleteAllEntries(): Promise<Result<bigint>> {
        try {
            const result = await this.db.deleteFrom("leaderboard").executeTakeFirst();
            return ok(result.numDeletedRows)
        } catch (_) {
            return error(undefined)
        }
    }
}