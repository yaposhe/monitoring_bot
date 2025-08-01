import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
/**
* @typedef {import("../logger/logger.js").Logger} Logger
 *  */

export class Config {
    /**
     * 
     * @param {string} configPath 
     */
    constructor(configPath/*, logger*/) {
        this.configPath = resolve(configPath);
        this.config = {};
        this.#load();
    }

    #load() {
        const configFile = readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configFile);
    }

    get(key) {
        return this.config[key];
    }

    getAll() {
        return this.config;
    }
}