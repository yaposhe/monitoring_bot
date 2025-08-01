/**
 * @typedef {import("../../pkg/db/sqlite3/bot_db.js").BotDbManager} BotDbManager
 * @typedef {import("../../pkg/db/sqlite3/webserver_db.js").WsDbManager} WsDbManager
 * @typedef {import("../../pkg/logger/logger.js").Logger} Logger
 * @typedef {import("../../pkg/config/config.js").Config} Config
*/

export class Context {
    /**
     * Создание контекста запроса
     * @param {BotDbManager} botDbManager 
     * @param {WsDbManager} webserverDbMananger 
     * @param {Logger} logger 
     * @param {Config} config
     */
    constructor(botDbManager, webserverDbMananger, logger, config) {
        this.botDbManager = botDbManager;
        this.webserverDbMananger = webserverDbMananger;
        this.logger = logger;
        this.config = config;
    }
}