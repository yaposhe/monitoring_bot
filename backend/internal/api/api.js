import { handleGetPairs } from "./exchange.js";
import { handleGetConfig, handlePutConfig } from "./config.js";
import { handleGetBot, handleGetSessions, handleGetStat } from "./bot.js";
import { handleLogin, handleRegister, handleLogout } from "./auth.js";
import { handleGetUser } from "./user.js";
import { handleGetJournals, handleGetJournal } from "./journal.js";
import { validateToken } from "../../pkg/token/token.js"

/**
 * @typedef {import('./context.js').Context} Context
*/

/**
 * Проверка авторизации
 * @param {import('http').IncomingMessage} req
 * @returns {{userId : string, valid : boolean}}
*/
export function isAuthed(req) {
    const cookies = getCookies(req);
    const token = cookies.authToken;
    if (!token) {
        return { userId: "", valid: false };
    }
    return validateToken(token);
}

// Универсальная отправка JSON
export function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // CORS
    });
    res.end(JSON.stringify(data));
}

/**
 * Получение тела запроса
 * @param {import('http').IncomingMessage} req
 * @returns
*/
export async function getRequestBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => resolve(JSON.parse(body)));
    });
}

/**
 * Получение cookies
 * @param {import('http').IncomingMessage} req
*/
function getCookies(req) {
    const cookieHeader = req.headers.cookie;
    return cookieHeader?.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        cookies[name] = value;
        return cookies;
    }, {}) || {};
}

/**
 * 
 * @param {import('http').ServerResponse} res 
 * @param {string} cookieName 
 */
export function clearCookie(res, cookieName) {
    res.setHeader('Set-Cookie', `${cookieName}=deleted; Max-Age=-1; HttpOnly; Path=/`);
}

const getJournalByIdRegex = new RegExp('^\\/v1\\/api\\/journal\\/([^\\/]+)$');

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
 * @param {{userId: string, authed: boolean}} localCtx
*/
export async function handleApi(req, res, ctx, localCtx) {
    try {
        // Разбираем URL и параметры
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        // Роутинг API-эндпоинтов
        const matchGetJournalByIdRegex = pathname.match(getJournalByIdRegex);

        if (pathname === '/v1/api/exchange/bybit/pairs' && req.method === 'GET') {
            await handleGetPairs(req, res, ctx)
        } else if (pathname === '/v1/api/config' && req.method === 'GET') {
            await handleGetConfig(req, res, ctx);
        } else if (pathname === '/v1/api/config' && req.method === 'PUT') {
            await handlePutConfig(req, res, ctx);
        } else if (pathname === '/v1/api/bot' && req.method === 'GET') {
            await handleGetBot(req, res, ctx);
        } else if (pathname === '/v1/api/bot/sessions' && req.method === 'GET') {
            await handleGetSessions(req, res, ctx);
        } else if (pathname === '/v1/api/bot/stat' && req.method === 'GET') {
            await handleGetStat(req, res, ctx);
        } else if (pathname === '/v1/api/login' && req.method === 'POST') {
            await handleLogin(req, res, ctx);
        } else if (pathname === '/v1/api/register' && req.method === 'POST') {
            await handleRegister(req, res, ctx);
        } else if (pathname === '/v1/api/logout' && req.method === 'POST') {
            await handleLogout(req, res, ctx);
        } else if (pathname === '/v1/api/user' && req.method === 'GET') {
            await handleGetUser(req, res, ctx, localCtx);
        } else if (pathname === '/v1/api/journals' && req.method === 'GET') {
            await handleGetJournals(req, res, ctx);
        } else if (matchGetJournalByIdRegex && req.method === 'GET') {
            const id = matchGetJournalByIdRegex[1];
            await handleGetJournal(req, res, ctx, id);
        } else {
            sendResponse(res, 404, { error: 'API endpoint not found' });
        }
    } catch (error) {
        ctx.logger.error(error);
        sendResponse(res, 500, {
            error: 'Internal Server Error',
            details: error.message
        });
    }
}