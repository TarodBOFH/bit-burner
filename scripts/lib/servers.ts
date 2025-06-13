import { COLORS } from "scripts/lib/colors.ts";

const SERVER_COLOR = COLORS.brightYellow

export const ALL_SERVERS = "/data/servers/all.txt";
export const MONEY_SERVERS = "/data/servers/money.txt";
export const HACKABLE_SERVERS = "/data/servers/hackable.txt";
export const NUKABLE_SERVERS = "/data/servers/nukable.txt";
export const ROOT_ACCESS_SERVERS = "/data/servers/root-access.txt";
export const CONTRACT_SERVERS = "/data/servers/contracts.txt";
export const OWN_SERVERS = "/data/servers/own.txt";

export class Server {
    constructor(
        readonly hostname: string,
        readonly money: number,
        readonly maxMoney: number,
        readonly minimunSecurity: number,
        readonly currentSecurity: number,
        ) { }

    get coloredHostname() {
        return `${SERVER_COLOR}${this.hostname}${COLORS.reset}`;
    }
}
