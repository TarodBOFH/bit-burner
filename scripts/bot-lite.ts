import { BotConfig,BotJob,JobPayload } from "scripts/bot.ts";
import { announceBot, announceJob } from "scripts/bot.ts";
 

//There are two kinds of bots, lite and full. Lite can only "run" tasks, hence cannot manage multiple orders (2GB limit)
//OTH, full bots can `run` other scripts. Spawning scripts is complex as the spawn script needs to handle it's own thread and ram usage, and communicate when 
// it has finished
export async function main(ns: NS) {

    const botId = ns.args[0] as string;
    if (!botId) {
        ns.tprint("❌ Bot must be started with a unique ID as the first argument.");
        return;
    }

    ns.disableLog("ALL");
    ns.clearLog();
    ns.ui.openTail();

    ns.print(`🤖 Bot [${botId}] started. Listening for jobs on port ${BotConfig.PORTS.PORT_BOT_JOBS}...`);

    try {
        announceBot(ns, botId, "ready")
        processJobs(ns, botId);
    } catch (error: any) {
        ns.print(`🤖 Bot [${botId}] FATAL ERROR. ${error.toString()}`);
    } finally {
        try { announceBot(ns, botId, "stopping") } catch (error: any) {
            ns.print(`🤖 Bot [${botId}] FATAL ERROR. WORKER ANNOUNCMENT QUEUE IS FULL`);
            ns.print(`🤖 Bot [${botId}] ERROR: ${error}`);
        }
    }
}

async function processJobs(ns: NS, botId: string) {
    const port = ns.getPortHandle(BotConfig.PORTS.PORT_BOT_JOBS);
    while (true) {
        if (!port.empty()) {
            const raw = port.peek();
            try {
                const job: BotJob = JSON.parse(String(raw));
                const payload = job.payload;
                if (job.to === botId) {
                    port.read(); // consume only if addressed to this bot
                    ns.print(`📨 Job received: ${payload.type} ${payload.threads}x on ${payload.target}`);
                    announceJob(ns, botId, "started", payload);
                    const retValue = await processJob(ns, payload);

                    if (retValue) {
                        announceJob(ns, botId, "done", payload, retValue);
                        ns.print(`✅ Job ${payload.type} on ${payload.target} ran with result ${retValue}`);
                    } else {
                        announceJob(ns, botId, "error", payload);
                        ns.print(`❌ Failed to run ${payload.type} on ${payload.target}`);
                    }
                } else {
                    await ns.sleep(BotConfig.SLEEP_INTERVAL_CHECK);
                }
            } catch {
                port.read(); // consume invalid entry
                ns.print(`⚠️ Ignoring malformed job: ${raw}`);
            }
        } else {
            await ns.sleep(BotConfig.SLEEP_INTERVAL_IDLE);
        }
    }
}

async function processJob(ns: NS, payload: JobPayload) {
    const options: BasicHGWOptions = {
        threads: payload.threads
    }
    let retValue: number;
    switch (payload.type) {
        case "weaken":
            retValue = await ns.weaken(payload.target, options); break;
        case "grow":
            retValue = await ns.grow(payload.target, options); break;
        case "hack":
            retValue = await ns.hack(payload.target, options); break;
        default:
            throw new Error(`Unknown job type ${payload.type}`);
    }
    return retValue;
}
