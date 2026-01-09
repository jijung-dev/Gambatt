import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

/* -------------------- TIME FORMAT -------------------- */
function timeFormat() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");

    return (
        `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
}

/* -------------------- FILE ROTATION -------------------- */
const transport = new DailyRotateFile({
    filename: "logs/app-%Y-week-%W.log",
    datePattern: "YYYY-[week]-WW",
    maxFiles: "2w",
});

/* -------------------- LOGGER -------------------- */
const logger = winston.createLogger({
    level: "debug",
    transports: [new winston.transports.Console(), transport],
    format: winston.format.printf(({ level, message }) => {
        return `[${timeFormat()}][${level.toUpperCase().padEnd(5)}] ${message}`;
    }),
});

/* -------------------- CONSOLE OVERRIDE -------------------- */
const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
};

function formatArgs(args) {
    return args
        .map((a) =>
            typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
        )
        .join(" ");
}

console.log = (...args) => {
    original.log(...args);
    logger.info(formatArgs(args));
};

console.warn = (...args) => {
    original.warn(...args);
    logger.warn(formatArgs(args));
};

console.error = (...args) => {
    original.error(...args);
    logger.error(formatArgs(args));
};

console.debug = (...args) => {
    original.debug(...args);
    logger.debug(formatArgs(args));
};
