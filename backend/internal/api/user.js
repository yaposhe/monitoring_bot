import {sendResponse} from "./api.js";

/**
 * @typedef {import('./context.js').Context} Context
*/

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
 * @param {{userId: string, authed: boolean}} localCtx
*/
export async function handleGetUser(req, res, ctx, localCtx) {
    const userId = localCtx.userId;
    const user = await ctx.webserverDbMananger.getUserById(userId);
    if (!user) {
        throw new Error("Пользователь не найден");
    }
    const userModel = {email : user.email, role : user.role};
    sendResponse(res, 200, userModel);
}