import Koa from 'koa'
import Router from 'koa-router';
import { DateTimeProvider } from './util/date.js';
import { DateTime } from 'luxon';
import { LeaderboardService } from './lib/leaderboard/leaderboardService.js';
import { KyselyData } from './data/kysely.js';
import { Kysely, MysqlDialect } from 'kysely';
import { DB } from './data/db.js';
import { createPool } from 'mysql2'
import { koaBody } from 'koa-body';
import { z } from 'zod';

export type CybersnakeApiConfig = {
    port: number,
    enableSsl: boolean,
    accessSecret: string,
    mysqlHost: string,
    mysqlDatabase: string,
    mysqlUser: string,
    mysqlPassword: string
}

export function start(config: CybersnakeApiConfig) {
    const app = new Koa()
    const router = new Router()
    const dateTimeProvider: DateTimeProvider = {
        now() {
            return DateTime.now().toUTC()
        },
    }
    const db = new KyselyData(new Kysely<DB>({
        dialect: new MysqlDialect({
            pool: createPool({
                host: config.mysqlHost,
                database: config.mysqlDatabase,
                user: config.mysqlUser,
                password: config.mysqlPassword,
                ssl: config.enableSsl ? {
                    rejectUnauthorized: true
                } : undefined
            })
        })
    }))
    const leaderboardService = new LeaderboardService(db, dateTimeProvider)

    app.use(async (ctx, next) => {
        await next();
        const rt = ctx.response.get('X-Response-Time');
        console.log(`${ctx.method} ${ctx.url} - ${rt}`);
    });

    app.use(async (ctx, next) => {
        const start = Date.now();
        await next();
        const ms = Date.now() - start;
        ctx.set('X-Response-Time', `${ms}ms`);
    });

    app.use(async (ctx, next) => {
        if (!(ctx.request.header['authorization']?.startsWith("Bearer") ?? false)
            || !(ctx.request.header['authorization']?.endsWith(config.accessSecret) ?? false)) {
            ctx.status = 401
            ctx.body = 'Unauthorized'
            return
        }
        await next()
    })

    router.get('/healthcheck', async (ctx) => {
        ctx.status = 200
    })

    const leaderboardPostRequestSchema = z.object({
        name: z.string(),
        score: z.number().int(),
    })
    router.post('/leaderboard', koaBody(), async (ctx) => {
        if (!(ctx.request.headers["content-type"] === "application/json")) {
            ctx.status = 400
            return
        }
        const parse = leaderboardPostRequestSchema.safeParse(ctx.request.body)
        if (!parse.success) {
            ctx.status = 400
            return
        }
        const result = await leaderboardService.addEntry(parse.data.name, parse.data.score)
        ctx.status = result.ok ? 200 : 500
    })

    const leaderboardGetResponseSchema = z.object({
        page: z.number().int().default(0),
        pages: z.number().int().default(1),
        pageSize: z.number().int().default(1),
        data: z.array(
            z.object({
                name: z.string(),
                score: z.number().int(),
                date: z.string(),
            }))
    })
    router.get('/leaderboard', async (ctx) => {
        const fetch = await leaderboardService.getAllEntries()
        if (!fetch.ok) {
            ctx.status = 500
            return
        }
        const parse = leaderboardGetResponseSchema.safeParse({
            page: 0,
            pages: 1,
            pageSize: fetch.value.length,
            data: fetch.value.map(entry => ({
                name: entry.name,
                score: entry.score,
                date: entry.creationDate.toISO()
            }))
        })
        if (!parse.success) {
            ctx.status = 500
            return
        }
        ctx.status = 200
        ctx.body = JSON.stringify(parse.data)
    })

    router.delete('/leaderboard', async (ctx) => {
        const result = await leaderboardService.clearAllEntries()
        ctx.status = result.ok ? 200 : 500
    })

    app.use(router.routes())

    const port = Math.floor(config.port)
    app.listen(port)
    console.log(`Listening on port ${port}`)
}