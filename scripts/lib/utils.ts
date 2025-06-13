import { COLORS } from "scripts/lib/colors.ts";

import "scripts/lib/colors.ts";

export const PROGRAMS_FILE = "/data/programs.txt";

/** @param {NS} ns */
export function updatePrograms(ns) {
    const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
    const availablePrograms = programs.filter((program) => ns.fileExists(program, "home"));
    ns.tprintf(`Updating programs...`);
    availablePrograms.forEach((program) => ns.tprint(`✅ ${colorProgram(program)}  is available`));
    programs
        .filter((p) => availablePrograms.indexOf(p) === -1)
        .forEach((p) => ns.tprint(`❌ ${colorProgram(p)} is ${COLORS.red}NOT${COLORS.reset} available`));

    ns.write(PROGRAMS_FILE, JSON.stringify(availablePrograms), "w");
}

/** @param {NS} ns */
/** @param {String} who */
export function sayHello(ns, who ) {
    ns.tprint(`Hello ${who}, how are you?`);
}

/** @param {NS} ns */
export async function main(ns) {
    if (ns.args.length == 0) ns.tprint(`${COLORS.red}Error!!: Utils script cannot be invoked without parameters${COLORS.reset}`)
    else if (ns.args.length == 1) eval(`${ns.args[0]}(ns)`);
    else eval(`${ns.args[0]}(ns, ns.args.filter( ( value, index, array)  => index > 0 ))`);
}

/** @param {String} program */
export function colorProgram(program) {
    return `${COLORS.cyan}${program}${COLORS.reset}`;
}
