import path from "path";
import fs from "fs";

import {sendResponse, getRequestBody} from "./api.js";

/**
 * @typedef {import('./context.js').Context} Context
*/

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleGetConfig(req, res, ctx) {
    const configJson = await readConfig(ctx.config.get("bot_config"));
    sendResponse(res, 200, configJson);
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handlePutConfig(req, res, ctx) {
    const configPath = ctx.config.get("bot_config");
    const currConfigJson = await readConfig(configPath);
    const updates = await getRequestBody(req);
    ctx.logger.info("Обновления конфигурации:");
    ctx.logger.info(updates);
    const updatedConfig = deepMerge(currConfigJson, updates);
    await saveConfig(updatedConfig, configPath);
    sendResponse(res, 200, updatedConfig);
}

async function readConfig(path) {
    const data = await fs.promises.readFile(path, 'utf8');
    return JSON.parse(data);
}

async function saveConfig(config, path) {
    await fs.promises.writeFile(path, JSON.stringify(config, null, 2), 'utf8');
}

function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
            // Для объектов делаем рекурсивное слияние
            if (!target[key]) {
                target[key] = {};
            }
            deepMerge(target[key], source[key]);
        } else {
            // Примитивы и массивы полностью перезаписываем
            target[key] = source[key];
        }
    }
    return target;
}