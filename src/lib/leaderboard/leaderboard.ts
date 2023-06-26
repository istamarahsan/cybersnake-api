import { DateTime } from "luxon"

export type LeaderboardEntry = {
    id: string,
    name: string,
    score: number,
    creationDate: DateTime
}