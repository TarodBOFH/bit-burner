import * as SERVERS from "scripts/lib/servers.ts";


/** @param {NS} ns */
export async function main(ns: NS) {
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("sleep");
    ns.disableLog("scp");
    ns.disableLog("exec");
    ns.disableLog("getHackingLevel");
    ns.disableLog("getServerRequiredHackingLevel");

    const sleepControl = new TaskFinishStack();

    var script = "hack-script.js";
    var targets: string[] = (JSON.parse(ns.read(SERVERS.HACKABLE_SERVERS)) as Server[]).map(s => s.hostname);
    targets = targets.filter((hostname) => ns.getServerRequiredHackingLevel(hostname) <= ns.getHackingLevel());
    var rooted = (JSON.parse(ns.read(SERVERS.ROOT_ACCESS_SERVERS)) as Server[]).map(s => s.hostname);

    targets.filter((s) => {
        var server = ns.getServer(s);
        const serverDifficulty = server.hackDifficulty ?? 0
        return serverDifficulty <= ns.getHackingLevel();
    }).forEach((value) => {
        var server = ns.getServer(value);

        if (server.hasAdminRights) {
            var scriptRam = ns.getScriptRam(script);
            if (server.ramUsed + scriptRam < server.maxRam) {
                var threads = Math.floor((server.maxRam - server.ramUsed) / scriptRam);
                ns.scp(script, server.hostname);
                ns.exec(script, server.hostname, threads, server.hostname);
            }
        }
    })
    /*
    // share
    const shareScript = "/scripts/share.ts"
    const shareScriptRam = ns.getScriptRam(shareScript);

    rooted
        .filter(noHomeFilter)
        .filter((value) => targets.indexOf(value) == -1)
        .forEach(hostname => {
            if (hasFreeRam(ns, hostname, shareScriptRam)) {
                const threads = threadsFor(ns, hostname, shareScriptRam);
                ns.scp(shareScript, hostname);
                ns.exec(shareScript, hostname, threads, hostname);
            }
        });
    */

    const weakenScript = "/scripts/weaken.ts"
    const weakenScriptRam = ns.getScriptRam(weakenScript);

    while (true) {
        const weakeners = rooted // rooted servers that can run the weaken script
            .filter(noHomeFilter)
            .filter(freeRamFilter(ns, weakenScriptRam));

        ns.printf(`There are ${weakeners.length} idle servers to run weaken`);
        if (weakeners.length > 0) {
            ns.printf(`There are ${weakeners.length} weakeners, finding target...`);
            const target = findServerToWeaken(ns, targets.sort(deltaSecurityLevelComparator(ns)));
            ns.printf(`Found ${target} to weaken`);

            if (target) {
                const securityLevel = ns.getServerSecurityLevel(target);
                const minSecurityLevel = ns.getServerMinSecurityLevel(target);
                var remainingSecurity = securityLevel - minSecurityLevel;

                for (var i = 0; i < weakeners.length && remainingSecurity > 0; i++) {                    
                    const hostname = weakeners[i];
                    const server = ns.getServer(weakeners[i]);

                    ns.printf(`Launched weaken from ${hostname} to ${target}. Remaining security is ${remainingSecurity}`);

                    var threads = Math.min(threadsFor(ns, hostname, weakenScriptRam), Math.ceil(remainingSecurity / 0.05));
                    remainingSecurity -= 0.05 * threads;

                    const weakenTime = ns.getWeakenTime(target);
                    ns.scp(weakenScript, server.hostname);
                    ns.exec(weakenScript, server.hostname, threads, target);

                    sleepControl.add(weakenTime);

                    ns.printf(`Launched weaken from ${hostname} to ${target} with ${threads}. Remaining security will be ${remainingSecurity}`);
                    if (remainingSecurity <= 0 ) break;
                };
            } else {
                const sleepTime = sleepControl.nextSleep();
                ns.printf(`No target found. Next server liberates at finish in ${sleepTime} milis. Consider running growers instead.`);
                await ns.sleep(Math.max(sleepTime, 1000));
            }
        } else {
            const sleepTime = sleepControl.nextSleep();

            ns.printf(`There are no more available weakeners. Sleeping. Consider purchasing more servers...`);
            ns.printf(`Next weaken finish in ${sleepTime} milis`);
            await ns.sleep(Math.max(sleepTime, 1000));
        }
    }
}

function findServerToWeaken(ns: NS, servers: string[]): string | undefined {
    return servers
        .filter(needsWeakenFilter(ns))
    [0] ?? undefined
}

var _deltaSecurityLevelComparator: (value: string, other: string) => number;
function deltaSecurityLevelComparator(ns: NS): (value: string, other: string) => number {
    if (!_deltaSecurityLevelComparator) _deltaSecurityLevelComparator = (a: string, b: string) => {
        const deltaA = ns.getServerSecurityLevel(a) - ns.getServerMinSecurityLevel(a);
        const deltaB = ns.getServerSecurityLevel(b) - ns.getServerMinSecurityLevel(b);
        if (deltaA > deltaB) return -1;
        else if (deltaB > deltaA) return 1;
        return 0;
    }
    return _deltaSecurityLevelComparator;
}

// Avoid instantiating several closures
var _weakenFilter: (server: string) => boolean;
function needsWeakenFilter(ns: NS): (server: string) => boolean {
    if (!_weakenFilter) _weakenFilter = (server) => (ns.getServerSecurityLevel(server) != ns.getServerMinSecurityLevel(server));
    return _weakenFilter;
}

const noHomeFilter = (value: string) => value != "home";

var freeRamFilters: ((server: string) => boolean)[] = []; //factory funtions have as many dimensions as parameters. entryset of parameters potential key
function freeRamFilter(ns: NS, ramNeeded: number): (server: string) => boolean {
    if (!freeRamFilters[ramNeeded]) freeRamFilters[ramNeeded] = (server) => {
        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        return (maxRam - usedRam) >= ramNeeded;
    }
    return freeRamFilters[ramNeeded];
}

function hasFreeRam(ns: NS, hostname: string, ramNeeded: number) {
    return freeRamFilter(ns, ramNeeded)(hostname);
}

function threadsFor(ns: NS, hostname: string, scriptRam: number): number {
    const maxRam = ns.getServerMaxRam(hostname);
    const usedRam = ns.getServerUsedRam(hostname);

    return Math.floor((maxRam - usedRam) / scriptRam);
}

class EarliestFinish {
    milis: number | null = null;

    reset() { this.milis = null }

    update(value: Date | number) {
        const time = typeof value === "number" ? new Date().getTime() + Math.trunc(value) : value.getTime();
        if (!this.milis || this.milis > time) this.milis = time;
    }

    milisTo(date: Date = new Date()) {
        const now = date.getTime();
        const delta = (this.milis ?? 0) - now;
        return delta > 0 ? delta : 0;
    }
}

class TaskFinishStack {
    constructor(round: number = 1000) {
        this.round = round;
    }

    round: number;

    ns: NS;
    stack: number[] = [];

    reset() { this.stack = [] }

    add(number: number) {
        const now = new Date().getTime();
        const stopTime = round(now + number, this.round);
        if (this.stack.indexOf(stopTime) != -1) return; // already added
        if (this.stack.length == 0) this.stack.push(stopTime);
        else (this.stack.splice(sortedIndex(this.stack, stopTime), 0, stopTime));
    }

    nextSleep() {
        const stopTime = this.stack.shift() ?? 0;
        const delta = round(stopTime - new Date().getTime(), this.round);

        return delta > 0 ? delta : 0;
    }
}

function sortedIndex(array: number[], value: number) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = low + high >>> 1;
        if (array[mid] < value) low = mid + 1;
        else high = mid;
    }
    return low;
}

function round(number: number, multiple: number) {
    if (number > 0) return Math.ceil(number / multiple) * multiple;
    else if (number < 0) return Math.floor(number / multiple) * multiple;
    else return multiple;
}
