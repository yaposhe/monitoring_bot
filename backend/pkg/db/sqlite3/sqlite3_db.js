import sqlite3 from 'sqlite3';
import {existsSync} from "fs";

import {IDbConnector} from "../iconnector.js"

const { Database } = sqlite3.verbose();

export class Sqlite3DbConnector extends IDbConnector {
    /**
     * @param {string} dbFile - Путь к файлу базы данных.
     * @param {import("../../logger/logger.js").Logger} logger
     * @throws {Error} Если не удалось подключиться к базе данных.
     */
    constructor(dbFile, logger) {
        super();
        this.dbPath = dbFile
        this.logger = logger;
        this.open();
    }

    open() {
        if (!existsSync(this.dbPath)) {
            this.logger.error(`Ошибка создания подключения к бд: Файл бд ${this.dbPath} не существует`);
            process.exit(1);
        }
        this.db = new Database(this.dbPath, (err) => {
            if (err) {
                throw new Error(`Ошибка открытия базы данных: ${err.message}`);
            } else {
                this.logger.info(`Создано подключение к бд ${this.dbPath}`);
            }
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    this.logger.info(`Подключение к бд ${this.dbPath} закрыто`);
                    resolve();
                }
            });
        });
    }
}