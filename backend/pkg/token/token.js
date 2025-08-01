/**
 * Генерация токена для пользователя
 * @param {string} userId 
 * @returns 
 */
export function generateToken(userId) {
    const timestamp = Date.now();
    const rawToken = `${userId}.${timestamp}`;
    // TODO: шифрование секретным ключом + преобразование строки в base64
    return rawToken;
}

/**
 * Проверка валидности токена
 * @param {string} token 
 * @returns {{userId : string, valid : boolean}}
 */
export function validateToken(token) {
    // TODO: расшифровка
    const decodedParts = token.split('.');
    if (decodedParts.length !== 2) {
        return {userId : "", valid : false};
    }
    const userId = decodedParts[0];
    const timestamp = Number(decodedParts[1]);
    return { userId : userId, valid : true };
}