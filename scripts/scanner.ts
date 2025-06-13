import { COLORS } from "scripts/lib/colors.ts";
import { PROGRAMS_FILE } from "scripts/lib/utils.js";
import * as SERVERS from "scripts/lib/servers.ts";
import { Server } from "scripts/lib/servers.ts";


/** @param {NS} ns */
export async function main(ns: NS) {
    const programs = JSON.parse(ns.read(PROGRAMS_FILE));

    const currentServer = ns.getHostname();

    ns.tprint(`Current server: ${COLORS.brightYellow}${currentServer}`)
    ns.tprint(`Scanning...`)

    const all_servers = deepscan(ns, currentServer).map((server) => new Server(
        server, 
        ns.getServerMoneyAvailable(server), 
        ns.getServerMaxMoney(server), 
        ns.getServerMinSecurityLevel(server), 
        ns.getServerSecurityLevel(server))
    );
        


    const moneyServers = all_servers.filter((server) => server.maxMoney > 0);
    const nukableServers = all_servers.filter((server) => !ns.hasRootAccess(server.hostname) && ns.getServerNumPortsRequired(server.hostname) <= programs.length);

    const rootedServers = all_servers.filter((server) => ns.hasRootAccess(server.hostname));
    const hackableServers = rootedServers.filter(server => moneyServers.includes(server));

    hackableServers.forEach((server) => ns.tprintf(`Server ${server.coloredHostname} is hackable`)); 
    nukableServers.forEach((server) => ns.tprintf(`Server ${server.coloredHostname} is nukable`)); 

    const contractServers = all_servers.filter((server) => ns.ls(server.hostname, ".cct").length > 0);

    ns.tprintf(`Found ${all_servers.length.colored} servers. ${nukableServers.length.colored} are nukable. ${moneyServers.length.colored} have money. ${rootedServers.length.colored} have root access. ${hackableServers.length.colored} have root access and money.`);
    ns.tprintf(`Found ${contractServers.length.colored} servers with contracts`);

    ns.write(SERVERS.ALL_SERVERS, JSON.stringify(all_servers, null, 2), "w");
    ns.write(SERVERS.MONEY_SERVERS, JSON.stringify(moneyServers, null, 2), "w");
    ns.write(SERVERS.HACKABLE_SERVERS, JSON.stringify(hackableServers, null, 2), "w");
    ns.write(SERVERS.NUKABLE_SERVERS, JSON.stringify(nukableServers, null, 2), "w");
    ns.write(SERVERS.ROOT_ACCESS_SERVERS, JSON.stringify(rootedServers, null, 2), "w");
    ns.write(SERVERS.CONTRACT_SERVERS, JSON.stringify(contractServers, null, 2), "w");
}

function deepscan(ns: NS, host: string, servers: string[] = []) {
    servers.push(host);
    ns.scan(host).forEach(s => !servers.includes(s) ? deepscan(ns, s, servers) : null);
    return servers;
}
