export enum COLORS {
    black = "\u001b[30m",
    red = "\u001b[31m",
    green = "\u001b[32m",
    yellow = "\u001b[33m",
    blue = "\u001b[34m",
    magenta = "\u001b[35m",
    cyan = "\u001b[36m",
    white = "\u001b[37m",
    brightBlack = "\u001b[30;1m",
    brightRed = "\u001b[31;1m",
    brightGreen = "\u001b[32;1m",
    brightYellow = "\u001b[33;1m",
    brightBlue = "\u001b[34;1m",
    brightMagenta = "\u001b[35;1m",
    brightCyan = "\u001b[36;1m",
    brightWhite = "\u001b[37;1m",
    reset = "\u001b[0m",
}

declare global {
    interface Number {
        readonly colored: string;
    }
}

declare global {
    interface Object {
        readonly blacked: string;
        readonly redded: string;
        readonly greened: string;
        readonly yellowed: string;
        readonly blued: string;
        readonly magentaed: string;
        readonly cyaned: string;
        readonly whited: string;
        readonly brightBlacked: string;
        readonly brightRedded: string;
        readonly brightGreened: string;
        readonly brightYellowed: string;
        readonly brightBlued: string;
        readonly brightMagentaed: string;
        readonly brightCyaned: string;
        readonly brightWhited: string;
    }
}

function suffixColorName(name: string): string {
    const lastChar = name.at(-1)?.toLowerCase();
    if (lastChar === 'd') return name + 'ed';   // red → redded
    if (lastChar === 'e') return name + 'd';    // blue → blued
    return name + 'ed';                         // black → blacked
}

(Object.entries(COLORS) as [keyof typeof COLORS, string][])
    .filter(([name]) => name !== "reset")
    .map(([key, value]) => {
        const propName = suffixColorName(key);
        return [propName, value] as const;
    })
    .forEach(([colorName, ansiCode]) => {
        Object.defineProperty(Object.prototype, colorName, {
            get: function () {
                return `${ansiCode}${this}${COLORS.reset}`;
            },
            enumerable: false,
            configurable: true
        });
    });

Object.defineProperty(Number.prototype, "colored", {
    get: function () { return `${this.brightBlued}`; },
    enumerable: true,
    configurable: true
});

/** @param {String} program */
export function colorProgram(program: String) {
    return `${COLORS.cyan}${program}${COLORS.reset}`;
}

/** @param {NS} ns */
export async function main(ns: NS) {
    const now = new Date();
    const twentyFour = 24;

    ns.printf(`${now.blacked}`);
    ns.tprint(`${now.blacked}`);
    ns.printf(`${twentyFour.colored}`);
    ns.tprintf(`${twentyFour.colored}`);
}
