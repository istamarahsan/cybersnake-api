import { exit } from "process";
import { loadEnv } from "./env.js";
import { CybersnakeApiConfig, start } from "./cybersnakeApi.js";
import { number } from "zod";

const env = loadEnv();
if (!env.success) {
    console.error("Failed to load environment variables.")
    env.error.issues.forEach(err => console.error(err.path.join("."), err.message))
    exit(1)
}
const port = Number.parseInt(env.data.PORT)
const config: CybersnakeApiConfig = {
    port: port,
    accessSecret: env.data.ACCESS_SECRET,
    mysqlHost: env.data.MYSQL_HOST,
    mysqlDatabase: env.data.MYSQL_DATABASE,
    mysqlUser: env.data.MYSQL_USER,
    mysqlPassword: env.data.MYSQL_PASSWORD
}
start(config)