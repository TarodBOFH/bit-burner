/** @param {NS} ns */
export async function main(ns: NS) {
    const args: string[] = ns.args.map((value) => value.toString());
    const target = args[0];

    await ns.weaken(target);
}
