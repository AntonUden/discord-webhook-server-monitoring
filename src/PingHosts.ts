export const DefaultPingHosts: PingHost[] = [
  { name: "Cloudflare", ip: "1.1.1.1" },
  { name: "Google", ip: "8.8.8.8" },
]

Object.freeze(DefaultPingHosts);

export interface PingHost {
  name: string;
  ip: string;
}
