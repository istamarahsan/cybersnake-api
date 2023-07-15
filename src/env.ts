import { z } from "zod";

const schema = z.object({
    PORT: z.string().default("3000"),
    ACCESS_SECRET: z.string(),
    POSTGRES_URL: z.string(),
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): z.SafeParseReturnType<z.input<typeof schema>, Env> {
    return schema.safeParse({
        PORT: process.env.PORT,
        ACCESS_SECRET: process.env.ACCESS_SECRET,
        POSTGRES_URL: process.env.POSTGRES_URL,
    });
}