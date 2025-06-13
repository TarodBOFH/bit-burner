import { COLORS } from "scripts/lib/colors.ts";
import { PROGRAMS_FILE } from "scripts/lib/utils.js";
import * as SERVERS from "scripts/lib/servers.ts";


/** @param {NS} ns */
export async function main(ns) {   
    const targets = JSON.parse(ns.read(SERVERS.NUKABLE_SERVERS)).map((t) => t.hostname);
    const programs = JSON.parse(ns.read(PROGRAMS_FILE));

    targets.forEach((target) => {
        if (programs.indexOf("BruteSSH.exe") != -1) ns.brutessh(target);
        if (programs.indexOf("FTPCrack.exe") != -1) ns.ftpcrack(target);
        if (programs.indexOf("relaySMTP.exe") != -1) ns.relaysmtp(target);
        if (programs.indexOf("HTTPWorm.exe") != -1) ns.httpworm(target);
        if (programs.indexOf("SQLInject.exe") != -1) ns.sqlinject(target);
        if (ns.nuke(target)) ns.tprint(`Server ${COLORS.brightYellow}${target}${COLORS.reset} nuked`)
        else ns.tprint(`${COLORS.red}Server ${COLORS.brightYellow}${target}${COLORS.red} failed`)
    });

    ns.run("scripts/scanner.js"); // need to rescan after a nuke
}
