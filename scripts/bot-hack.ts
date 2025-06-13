import { JobPayload } from "scripts/bot.ts";
import { announceJob, parseWorkerArgs } from "scripts/bot.ts";

//There are two kinds of bots, lite and full. Lite can only "run" tasks, hence cannot manage multiple orders (2GB limit)
//OTH, full bots can `run` other scripts. Spawning scripts is complex as the spawn script needs to handle it's own thread and ram usage, and communicate when 
// it has finished
export async function main(ns: NS) {

    const {botId, target, threads} = parseWorkerArgs(ns);

    ns.disableLog("ALL");
    ns.clearLog();

    const payload: JobPayload = {
        target: target,
        threads: threads,
        type: "grow"
    }

    try {          
        announceJob(ns, botId, "started", payload);
        const retValue = await ns.hack(target);
        announceJob(ns, botId, "done", payload, retValue);
    } catch (error) {
        announceJob(ns, botId, "error", payload);
    }
}
