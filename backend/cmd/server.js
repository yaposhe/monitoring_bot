import fs from "fs";
import path from "path";
import { createServer } from "http"

import { BotDbManager } from '../pkg/db/sqlite3/bot_db.js';
import { WsDbManager } from '../pkg/db/sqlite3/webserver_db.js';
import { Logger } from '../pkg/logger/logger.js';
import { handleApi, isAuthed } from "../internal/api/api.js";
import { Context } from "../internal/api/context.js";
import { Config } from "../pkg/config/config.js";

// Получаем текущую директорию запуска
const PROJECT_ROOT = process.cwd();
const STATIC_DIR = path.join(PROJECT_ROOT, 'frontend');

const CONFIG_PATH = path.join(PROJECT_ROOT, "config", "config.json");
const config = new Config(CONFIG_PATH);

const logger = new Logger({ logFile: config.get("log_path"), console: true });

const path_to_bot_db = config.get("bot_db");
let botDb = null
if (path_to_bot_db != "__test__") {
    botDb = new BotDbManager(path_to_bot_db, logger);
}
const webserverDb = new WsDbManager(config.get("webserver_db"), logger)

const ctx = new Context(botDb, webserverDb, logger, config);

const PORT = config.get("port");
const HOST = config.get("host");

/**
 * Закрытие базы данных при завершении работы приложения
 * @param {string} signal
*/
const gracefulShutdown = async (signal) => {
    logger.info(`Получен сигнал ${signal}, завершаю работу...`);
    try {
        if (ctx.botDbManager) {
            await ctx.botDbManager.close();
        }
        
        await ctx.webserverDbMananger.close();
        logger.info("Сервер завершает работу");
        server.close()
        process.exit(0);
    } catch (error) {
        logger.error('Ошибка завершения работы');
        logger.error(error)
        process.exit(1);
    }
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

logger.info(`Путь к статическим файлам: ${STATIC_DIR}`);

const SUCCESS_STATUS_CODES = [200, 201, 302];

// MIME-типы
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
};

// Пути к страницам ошибок
const ERROR_PAGES = {
    404: path.join(STATIC_DIR, 'html', 'errors', '404.html'),
    500: path.join(STATIC_DIR, 'html', 'errors', '500.html')
};

/**
 * @param {import('http').ServerResponse} res
 * @param {string} filePath 
*/
async function serveStaticFile(res, filePath) {
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    const content = await fs.promises.readFile(filePath);
    res.writeHead(200, {
        'Content-Type': contentType,
        //'Cache-Control': 'public, max-age=3600'
        'Cache-Control': 'no-cache'
    });
    res.end(content, 'utf-8');
}

/**
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode 
*/
async function serveErrorPage(res, statusCode) {
    try {
        const errorPage = await fs.promises.readFile(ERROR_PAGES[statusCode], 'utf-8');
        res.writeHead(statusCode, { 'Content-Type': 'text/html' });
        res.end(errorPage);
    } catch (err) {
        res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
        res.end(`${statusCode} Error`);
    }
}

/**
 * Логирует HTTP-запрос с временем выполнения.
 * @param {import('http').IncomingMessage} req - Объект запроса (из Node.js `http`).
 * @param {number} statusCode - HTTP-статус ответа (например, 200, 404).
 * @param {[number, number]} startTime - Время начала обработки (возврат `process.hrtime()`).
 */
export function logRequest(req, statusCode, startTime) {
    // Вычисляем время выполнения
    const diff = process.hrtime(startTime);
    const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2); // в мс

    let msg = '';
    const remoteIp = req.socket.remoteAddress;
    if (remoteIp) {
        msg = `${req.method} ${req.url} ${statusCode} с ${remoteIp} | ${responseTime} [мс]`;
    } else {
        msg = `${req.method} ${req.url} ${statusCode} | ${responseTime} [мс]`;
    }
    if (SUCCESS_STATUS_CODES.includes(statusCode)) {
        logger.info(msg);
    } else {
        logger.warn(msg);
    }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
*/
async function handleRequest(req, res) {
    // Начало замера времени
    const startTime = process.hrtime();

    // Событие окончания запроса
    res.on('finish', () => {
        logRequest(req, res.statusCode, startTime);
    });

    const objAuth = isAuthed(req);
    const localCtx = {authed : objAuth.valid, userId : objAuth.userId};

    // Обработка запроса
    let filePath;
    if (req.url === '/') {
        const flagIsAuthed = objAuth.valid;
        if (!flagIsAuthed) {
            res.writeHead(302, { 'Location': '/html/auth.html' });
            res.end();
            return;
        }

        filePath = path.join(STATIC_DIR, 'index.html');
    } else if (req.url.startsWith('/v1/api/')) {
        // API обработка
        await handleApi(req, res, ctx, localCtx);
        return;
    } else {
        filePath = path.join(STATIC_DIR, req.url);
    }
    // Обработка запроса статичного файла
    if (req.url != "/html/auth.html" && req.url != "/favicon.ico" && req.url != "/js/auth.js" && req.url != "/css/auth.css" && req.url != "/.well-known/security.txt") {
        const objAuth = isAuthed(req);
        const flagIsAuthed = objAuth.valid;
        if (!flagIsAuthed) {
            res.writeHead(302, { 'Location': '/html/auth.html' });
            res.end();
            return;
        }
    }
    try {
        await serveStaticFile(res, filePath);
        return;
    } catch (err) {
        if (err.code === 'ENOENT') {
            await serveErrorPage(res, 404);
            return;
        }
        await serveErrorPage(res, 500);
        return;
    }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
*/
let server = createServer(async (req, res) => {
    await handleRequest(req, res);
});

server.listen(PORT, HOST, () => {
    const msg = `Сервер запущен: http://${HOST}:${PORT}`
    logger.info(msg)
});