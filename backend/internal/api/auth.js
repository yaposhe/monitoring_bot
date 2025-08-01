import {generateToken} from "../../pkg/token/token.js"
import {sendResponse, getRequestBody, clearCookie} from "./api.js";

/**
 * @typedef {import('./context.js').Context} Context
*/

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleLogin(req, res, ctx) {
    const requestBody = await getRequestBody(req);
    const { email, password } = requestBody;
    if (!email || ! password) {
        throw new Error("Логин или пароль пустые");
    }
    const user = await ctx.webserverDbMananger.getUserByEmail(email);
    if (!user || user.password != password) {
        throw new Error("Пользователь не найден");
    }
    const userId = user.id;
    const token = generateToken(userId);
    res.setHeader('Set-Cookie', `authToken=${token}; HttpOnly; Path=/; Max-Age=10000; SameSite=Lax`);
    sendResponse(res, 201, {token: token});
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleRegister(req, res, ctx) {
    const requestBody = await getRequestBody(req);
    const { email, password } = requestBody;
    if (!email || ! password) {
        throw new Error("Логин или пароль пустые");
    }
    const user = await ctx.webserverDbMananger.getUserByEmail(email);
    if (user) {
        throw new Error("Пользователь с таким email уже существует");
    }
    const userId = await ctx.webserverDbMananger.createUser(email, password);

    const token = generateToken(userId);
    // Устанавливаем куку
    res.setHeader('Set-Cookie', `authToken=${token}; HttpOnly; Path=/; Max-Age=10000; SameSite=Lax`);
    sendResponse(res, 201, {});
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {Context} ctx
*/
export async function handleLogout(req, res, ctx) {
    clearCookie(res, 'authToken');
    sendResponse(res, 201, {});
}
