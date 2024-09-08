import { cyan, green, red } from "colors";
import { Configuration } from "./Configuration";
import { EmbedBuilder, WebhookClient } from "discord.js";
import axios from "axios";
import * as ping from "ping";
import { DefaultPingHosts, PingHost } from "./PingHosts";

export class ServerMonitor {
  private _webhookClient;

  constructor(config: Configuration) {
    this._webhookClient = new WebhookClient({ url: config.discordWebHook });

    const run = () => {
      try {
        this.report();
      } catch (err) {
        console.error(red("An error occured while trying to report data"), err);
      }
    }

    if (config.reportingInterval < 1) {
      throw new Error("Reporting interval has to be at least 1");
    }

    setInterval(() => {
      run();
    }, config.reportingInterval * 1000);
    run();
  }

  async report() {
    console.log("Collecting data...");

    //#region IP
    console.log("Getting ip...");
    let ip: string | null = null;
    try {
      const ipRequest = await axios.get("https://myip.wtf/json");
      ip = ipRequest.data.YourFuckingIPAddress;
      console.log("Our ip is " + cyan(String(ip)));
    } catch (err) {
      console.error(red("Failed to get IP"), err);
    }
    //#endregion

    //#region Ping
    const pingResults: PingResult[] = [];

    const hosts = DefaultPingHosts;
    for (let i = 0; i < hosts.length; i++) {
      const host = hosts[i];
      console.log("Pinging " + cyan(host.name) + "(" + cyan(host.ip) + ")");
      const response = await ping.promise.probe(host.ip);

      const loss = parseInt(response.packetLoss);

      let min: number | null = null;
      let max: number | null = null;
      let avg: number | null = null;


      if (response.alive) {
        min = parseInt(response.min);
        max = parseInt(response.max);
        avg = parseInt(response.avg);
      }

      pingResults.push({
        alive: response.alive,
        host: host,
        min: min,
        max: max,
        avg: avg,
        packetLoss: loss,
      });
    }
    //#endregion

    let allOk = true;
    let ipProblem = false;
    let pingProblem = false;

    if (ip == null) {
      allOk = false;
      ipProblem = true;
      console.warn(red("Problem detected: Could not fetch ip"));
    }

    if (pingResults.find(r => !r.alive)) {
      allOk = false;
      pingProblem = true;
      console.warn(red("Problem detected: One or more hosts could not be reached"));
    }

    let statusText = "Current status: " + (allOk ? "OK." : "Problem detected!");

    if (ipProblem) {
      statusText += "\nCould not fetch public IP!";
    }

    if (pingProblem) {
      statusText += "\nOne or more ping hosts are down!";
    }

    const color = allOk ? 0x00FF00 : 0xFF0000;

    const embed = new EmbedBuilder();
    embed.setTitle("Server status");
    embed.setColor(color);
    embed.setDescription(statusText);
    embed.setTimestamp();

    if (process.env["EMBED_IMAGE"]) {
      embed.setImage(process.env["EMBED_IMAGE"])
    }

    if (process.env["EMBED_THUMBNAIL"]) {
      embed.setThumbnail(process.env["EMBED_THUMBNAIL"])
    }


    embed.addFields([{
      name: "--- Public IP ---",
      value: ipProblem ? "Unknown" : String(ip),
    }]);

    embed.addFields([{ name: "--- Ping results ---", value: "(Min) (Avg) (Max) (Loss)" }]);
    pingResults.forEach(result => {
      let value = "Unreachable";

      if (result.alive) {
        value = "(" + result.min + ") (" + result.avg + ") (" + result.max + ") (" + result.packetLoss + ")";
      }

      embed.addFields({
        name: result.host.name + " (" + result.host.ip + ")",
        value: value,
      });
    })

    console.log("Sending message...");
    await this._webhookClient.send({ embeds: [embed] });
    console.log(green("Log sent"));
  }
}

interface PingResult {
  alive: boolean;
  host: PingHost;
  min: number | null;
  max: number | null;
  avg: number | null;
  packetLoss: number;
}
