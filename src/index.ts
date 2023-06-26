import { exit } from "process";
import { loadEnv } from "./env.js";
import { CybersnakeApiConfig, start } from "./cybersnakeApi.js";

const env = loadEnv();
if (!env.success) {
    console.error("Failed to load environment variables.")
    env.error.issues.forEach(err => console.error(err.path.join("."), err.message))
    exit(1)
}
const config: CybersnakeApiConfig = {
    port: env.data.PORT,
    accessSecret: env.data.ACCESS_SECRET,
    mysqlHost: env.data.MYSQL_HOST,
    mysqlDatabase: env.data.MYSQL_DATABASE,
    mysqlUser: env.data.MYSQL_USER,
    mysqlPassword: env.data.MYSQL_PASSWORD
}
start(config)