export const PORTS = {
		allServers: 1,
        hackableServers: 2,
        nukableServers: 20
}



/** @param {NS} ns */
export async function main(ns: NS) {    
}

class Event {
    version: number = 0;
    id: string = crypto.randomUUID();
    time: Date = new Date();
    source: string = "UNDEFINED";
    detail: string = "UNDEFINED";
    payload: any;

    constructor(payload: any) { this.payload = payload }
}
