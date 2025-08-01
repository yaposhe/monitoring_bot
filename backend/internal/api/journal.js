import {sendResponse} from "./api.js";
import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'url';

/**
 * @typedef {import('./context.js').Context} Context
*/


const journalPattern = /^(?:[A-Za-z0-9]+_\d+_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}\.log|log\.log)$/;
/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleGetJournals(req, res, ctx) {
    const { pathname, query } = parse(req.url, true);
    const pair = query.pair;

    const journal_dir = ctx.config.get("journal_dir");
    const files = await fs.readdir(journal_dir);
    const filteredFiles = files.filter(file => journalPattern.test(file));

    let resultFiles;
    if (pair !== 'all') {
        resultFiles = filteredFiles.filter(file => file.startsWith(pair + "_"));
    } else {
        resultFiles = filteredFiles;
    }
    
    sendResponse(res, 200, resultFiles);
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
 * @param {string} id
*/
export async function handleGetJournal(req, res, ctx, id) {
    const journal_dir = ctx.config.get("journal_dir");
    const journalPath = path.join(journal_dir, id);
    const journalContent = await fs.readFile(journalPath, 'utf8');
    const journal = {content : journalContent};
    sendResponse(res, 200, journal);
}