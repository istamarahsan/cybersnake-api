import Koa from 'koa'
import Router from 'koa-router';
import { DateTimeProvider } from './util/date.js';
import { DateTime } from 'luxon';
import { LeaderboardService } from './lib/leaderboard/leaderboardService.js';
import { KyselyData } from './data/kysely.js';
import { Kysely, MysqlDialect } from 'kysely';
import { DB } from 'kysely-codegen';
import { createPool } from 'mysql2'
import { koaBody } from 'koa-body';
import { z } from 'zod';

export type CybersnakeApiConfig = {
    port: number,
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

    const leaderboardPostSchema = z.object({
        name: z.string(),
        score: z.number().int(),
    })
    router.post('/leaderboard', koaBody(), async (ctx) => {
        if (!(ctx.request.headers["content-type"] === "application/json")) {
            ctx.status = 400
            return
        }
        const parse = leaderboardPostSchema.safeParse(ctx.request.body)
        if (!parse.success) {
            ctx.status = 400
            return
        }
        const result = await leaderboardService.addEntry(parse.data.name, parse.data.score)
        ctx.status = result.ok ? 200 : 500
    })

    app.use(router.routes())

    app.listen(Math.floor(config.port));
}