import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

/* -------------------- LOG DIRECTORY -------------------- */
const LOG_DIR = "./logs";
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/* -------------------- TIME FORMAT -------------------- */
const timeFormat = winston.format.timestamp({
    format: "DD-MM-YYYY HH:mm:ss",
});

/* -------------------- FILE ROTATION -------------------- */
const fileTransport = new DailyRotateFile({
    dirname: LOG_DIR,
    filename: "app-%DATE%.log",
    datePattern: "YYYY-[week]-WW",
    maxFiles: "2w",
});

/* -------------------- LOGGER -------------------- */
const logger = winston.createLogger({
    level: "debug",
    format: winston.format.combine(
        timeFormat,
        winston.format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}][${level
                .toUpperCase()
                .padEnd(5)}] ${message}`;
        })
    ),
    transports: [new winston.transports.Console(), fileTransport],
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

export default logger;
