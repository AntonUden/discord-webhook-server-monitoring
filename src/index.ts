import * as dotenv from "dotenv";
import consoleStamp from "console-stamp";
import { red } from "colors";
import { ServerMonitor } from "./ServerMonitor";

dotenv.config();
consoleStamp(console);

if (process.env["DISCORD_WEBHOOK_URL"] == undefined) {
  console.log(red("Missing config value: DISCORD_WEBHOOK_URL"));
  process.exit(1);
}

const discordWebhookUrl = String(process.env["DISCORD_WEBHOOK_URL"]);

if (discordWebhookUrl.trim().length == 0) {
  console.log(red("Invalid config value: DISCORD_WEBHOOK_URL is empty"));
  process.exit(1);
}

const reportingInterval = parseInt(String(process.env["REPORTING_INTERVAL"] || 60));

if (isNaN(reportingInterval)) {
  console.log(red("Invalid config value: REPORTING_INTERVAL is not a valid number"));
  process.exit(1);
}

new ServerMonitor({
  discordWebHook: discordWebhookUrl,
  reportingInterval: reportingInterval,
});
