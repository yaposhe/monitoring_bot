import { execSync } from "child_process"
import { platform } from "os";
import { parse } from 'url';

import { sendResponse } from "./api.js";

const service_bot_name = "bot.service";

/**
 * @typedef {import('./context.js').Context} Context
*/

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleGetStat(req, res, ctx) {
    const { pathname, query } = parse(req.url, true);
    const session_id = query.session_id;
    if (ctx.botDbManager) {
        const stat = await ctx.botDbManager.getStatistics(session_id);
        sendResponse(res, 200, stat);
    } else {
        throw new Error("Ошибка подключения к базе бота");
    }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleGetSessions(req, res, ctx) {
    if (ctx.botDbManager) {
        const sessions = await ctx.botDbManager.getSessions();
        sendResponse(res, 200, sessions);
    } else {
        throw new Error("Ошибка подключения к базе бота");
    }
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleGetBot(req, res, ctx) {
    const { pathname, query } = parse(req.url, true);
    const action = query.action;
    const _platform = platform()
    if (_platform != "linux") {
        throw new Error(`Действие ${action} поддерживается только на linux. Текущая платформа: ${_platform}`);
    }
    let result = {};
    if (action === 'start') {
        const command = `systemctl start ${service_bot_name}`
        const output = execSync(command, {
            encoding: 'utf8',
            timeout: 5000
        })
    } else if (action === 'stop') {
        const command = `systemctl stop ${service_bot_name}`
        const output = execSync(command, {
            encoding: 'utf8',
            timeout: 5000
        })
    } else if (action === 'status') {
        const command = `systemctl is-active ${service_bot_name}`
        ctx.logger.debug(command)
        const output = execSync(command, {
            encoding: 'utf8',
            timeout: 5000
        }).trim()
        ctx.logger.debug(`Вывод команды: ${output}`)
        result.output = output;
    } else if (action === 'restart') {
        const command = `systemctl restart ${service_bot_name}`
        const output = execSync(command, {
            encoding: 'utf8',
            timeout: 5000
        })
    } else {
        throw new Error(`Неверное действие с ботом: ${action}`);
    }
    sendResponse(res, 200, result);
}