import { z } from "zod";

const schema = z.object({
    PORT: z.string().default("3000"),
    ACCESS_SECRET: z.string(),
    MYSQL_USER: z.string(),
    MYSQL_PASSWORD: z.string(),
    MYSQL_HOST: z.string(),
    MYSQL_DATABASE: z.string(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): z.SafeParseReturnType<z.input<typeof schema>, Env> {
    return schema.safeParse({
        PORT: process.env.PORT,
        ACCESS_SECRET: process.env.ACCESS_SECRET,
        MYSQL_USER: process.env.MYSQL_USER,
        MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
        MYSQL_HOST: process.env.MYSQL_HOST,
        MYSQL_DATABASE: process.env.MYSQL_DATABASE,
    });
}