import {loadAvailablePairs} from "../../pkg/exchange_api/bybit/api.js"
import {sendResponse} from "./api.js";

let pairs = await loadAvailablePairs(true)
let pairsLastUpdated = new Date();

/**
 * @typedef {import('./context.js').Context} Context
*/

/**
 * 
 * @returns {boolean}
 */
function isPairsActual() {
    const now = new Date();
    const diffHours = (now - pairsLastUpdated) / (1000 * 60 * 60);
    return diffHours <= 1;
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleGetPairs(req, res, ctx) {
    let _pairs = []
    if (isPairsActual()) {
        _pairs = pairs
    } else {
        _pairs = await loadAvailablePairs(true, ctx.logger);
    }
    sendResponse(res, 200, _pairs)
}