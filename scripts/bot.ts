export const BotConfig = {
    PORTS: {
        WORKER_ANNOUNCEMENTS: 1,
        PORT_BOT_JOBS: 2,
        JOB_ANNOUNCEMENTS: 3,
    },
    SLEEP_INTERVAL_IDLE: 200,
    SLEEP_INTERVAL_CHECK: 50,
    SCRIPT_DIR: "/scripts",
};
 
export interface Message {
    from: string;
    to: string;
    timestamp: Date;
    payload: any;
}

export interface BotJob extends Message {
    payload: JobPayload
}

export interface JobPayload {
    type: "weaken" | "grow" | "hack";
    target: string;
    threads: number;
}

export interface BotAnnouncement extends Message {
    payload: {
        type: "ready" | "stopping";
    }
}

export interface JobAnnouncement extends Message {
    payload: {
        type: "started" | "done" | "error";
        job: JobPayload;
        return?: number
    } 
}

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
        announceBot(ns, botId, "ready");
        processJobs(ns, botId);
    } catch (error: any) {
        ns.print(`🤖 Bot [${botId}] FATAL ERROR. ${error.toString()}`);
    } finally {
        announceBot(ns, botId, "stopping")
    }
}

export async function processJobs(ns: NS, botId: string) {
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
                    const params: ScriptArg[] = [botId, payload.target, payload.threads]  ;
                    ns.run("scripts/bot-"+payload.type+".ts", payload.threads, ...params) // build args                } else {
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


export function announceBot(ns: NS, botId: string, type: "ready" | "stopping") {
    const msg: BotAnnouncement = {
        from: botId,
        to: "daemon",
        timestamp: new Date(),
        payload: {
            type: type,
        }
    }
    return sendMessage(ns, BotConfig.PORTS.WORKER_ANNOUNCEMENTS, msg);
}

export function announceJob(ns: NS, botId: string, type: "started" | "done" | "error", job: JobPayload, retValue?: number) {
    const msg: JobAnnouncement = {
        from: botId,
        to: "daemon",
        timestamp: new Date(),
        payload: {
            type: type,
            job: job,
        }
    }
    if (retValue) msg.payload.return = retValue;
    return sendMessage(ns, BotConfig.PORTS.JOB_ANNOUNCEMENTS, msg);
}

function sendMessage(ns: NS, port: number, msg: Message) {
    const retValue = ns.writePort(port, msg);
    if (retValue) {
        const error =  `🤖 Bot [${msg.from}] FATAL ERROR. WORKER ANNOUNCMENT QUEUE IS FULL`;
        ns.print(error);
        throw new Error(error);
    }
}

export function parseWorkerArgs(ns: NS): { botId: string; target: string; threads: number; } {
    const botId = ns.args[0] as string;
    if (!botId) {
        throw new Error("❌ Jobs must be started with the bot ID as the first argument.");
    }

    const target = ns.args[1] as string;
    if (!target) {
        throw new Error("❌ Jobs must be started with the target as second argument.");
    }

    
    const threads = ns.args[2].valueOf() as number;
    if (!threads) {
        throw new Error("❌ Jobs must be started with threads as second argument.");
    }

    return {botId: botId, target: target, threads: threads}
}
