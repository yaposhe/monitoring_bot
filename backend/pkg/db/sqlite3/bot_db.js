import { Sqlite3DbConnector } from "./sqlite3_db.js";

export class BotDbManager extends Sqlite3DbConnector {
    /**
     * @param {string} dbFile - Путь к файлу базы данных.
     * @param {import("../../logger/logger.js").Logger} logger
     */
    constructor(dbFile, logger) {
        super(dbFile, logger);
    }

    /**
     * Метод для получения всех сессий
     * @returns 
     */
    getSessions() {
        const sql = 'SELECT id, started_at FROM sessions ORDER BY started_at DESC';
        return new Promise((resolve, reject) => {
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Метод для получения статистики по торговым парам
     * @param {string} launch_id
     */
    getStatistics(launch_id) {
        const sql = `SELECT p.*, s.started_at 
                     FROM trading_pairs p 
                     JOIN sessions s ON p.launch_id = s.id 
                     WHERE p.launch_id = ?`;
        return new Promise((resolve, reject) => {
            this.db.all(sql, [launch_id], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}