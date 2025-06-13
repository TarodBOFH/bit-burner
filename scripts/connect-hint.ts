// @ts-ignore
/** @param {NS} ns */
export async function main(ns: NS) {
    const target = ns.args[0];
    if (!target || typeof target !== "string") {
        ns.tprint("❌ Usage: run connect-to.js <target-host>");
        return;
    }

    const current = ns.getHostname();
    const fromHome = findPath(ns, "home", target);
    const fromCurrent = findPath(ns, current, target);

    const chosenPath = chooseShorterPath(fromHome, fromCurrent);
    if (!chosenPath) {
        ns.tprint(`❌ No path found to ${target}`);
        return;
    }

    ns.tprint(`🔗 Best path to ${target}: ${chosenPath.join(" -> ")}`);

    ns.tprint("🧭 You don't have the Singularity API. Use the following commands:");
    const commands = chosenPath.slice(1).map(s => `connect ${s};`);
    ns.tprint("\n"+commands.join(" "));
}

/**
 * Breadth-first search to find the path from `start` to `target`
 */
function findPath(ns: NS, start: string, target: string): string[] | null {
    const queue: string[][] = [[start]];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
        const path = queue.shift();
        if (!path) continue;

        const node = path[path.length - 1];
        if (node === target) return path;

        for (const neighbor of ns.scan(node)) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push([...path, neighbor]);
            }
        }
    }

    return null;
}

/**
 * Chooses the shorter of two paths, prioritizing non-null and shorter
 */
function chooseShorterPath(a: string[] | null, b: string[] | null): string[] | null {
    if (!a) return b;
    if (!b) return a;
    return a.length <= b.length ? a : b;
}
