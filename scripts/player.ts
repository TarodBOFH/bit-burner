
export async function main(ns: NS) {
    ns.ramOverride(1.85); // magic number; not counting getPlayer() inside the first loop.
    //allows us to display the error

    const hacking_level = ns.getHackingLevel();

    const currentRam = ns.getServerMaxRam("home");
    const nextRam = currentRam << 1;
    const maxRam = ns.getPurchasedServerMaxRam();
    
    const home_upgrade_cost = ns.getPurchasedServerUpgradeCost("home", nextRam);

    ns.tprint(`Home server has ${currentRam} and can be upgraded to ${maxRam}; Next upgrade (${nextRam} will cost ${home_upgrade_cost})`);

    if (currentRam == 8) {
        ns.alert("Home server RAM is not enough to automate anything you moron. Please do some manual stuff and come back later.")
        return -1;
    }

    while(true) {
        const money = ns.getPlayer().money
        
        await ns.sleep(10*1000);
    }
}
