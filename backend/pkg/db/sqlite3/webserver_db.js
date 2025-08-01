import { Sqlite3DbConnector } from "./sqlite3_db.js";

export class WsDbManager extends Sqlite3DbConnector {
    /**
     * @param {string} dbFile - Путь к файлу базы данных.
     * @param {import("../../logger/logger.js").Logger} logger
     */
    constructor(dbFile, logger) {
        super(dbFile, logger);
    }

    /**
     * Получает пользователя по email из базы данных
     * @param {string} email - Email пользователя
     * @returns {Promise<{id: string, email: string, password: string, role : string}|null>} Объект пользователя или null если не найден
     */
    getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT id, email, password, role FROM users WHERE email = ?',
                [email],
                (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row || null);
                    }
                }
            );
        });
    }

    /**
 * Получает пользователя по ID из базы данных
 * @param {number|string} id - Идентификатор пользователя
 * @returns {Promise<{id: string, email: string, password: string, role : string}|null>} Объект пользователя или null если не найден
 */
    getUserById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT id, email, password, role FROM users WHERE id = ?', // Запрос SQL
                [id],                                                 // Параметры запроса
                (err, row) => {                                       // Callback-функция
                    if (err) {
                        reject(err);                                   // Ошибка при выполнении запроса
                    } else {
                        resolve(row || null);                          // Результат или null, если запись не найдена
                    }
                }
            );
        });
    }

    /**
     * 
     * @param {string} email 
     * @param {string} password 
     */
    createUser(email, password) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO users (email, password) VALUES (?, ?)',
                [email, password],
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        // this.lastID содержит ID последней вставленной записи
                        resolve(this.lastID.toString());
                    }
                }
            );
        });
    }

    /**
     * 
     * @param {string} password 
     */
    updateUserPass(password) {

    }
}