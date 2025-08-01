import fs from "fs";

export class Logger {
  constructor(options = {}) {
    this.colors = {
      error: '\x1b[31m', // red
      warn: '\x1b[33m', // yellow
      info: '\x1b[32m', // green
      debug: '\x1b[34m', // blue
      trace: '\x1b[37m', // white
      reset: '\x1b[0m'
    };

    this.logFile = options.logFile;
    this.console = options.console;
  }

  #getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  #log(level, message) {
    const timestamp = this.#getTimestamp();
    const color = this.colors[level] || '';
    const reset = this.colors.reset;

    // Преобразуем объект в строку, если это не строка и не Error
    let messageStr;
    if (typeof message === 'object' && !(message instanceof Error)) {
        messageStr = JSON.stringify(message, null, 2); // Форматированный JSON
    } else if (message instanceof Error) {
        messageStr = message.stack || message.message; // Ошибки выводим с stack trace
    } else {
        messageStr = message; // Оставляем как есть (число, строка и т. д.)
    }

    const formattedMessage = `${timestamp} [${level.toUpperCase()}] ${messageStr}`;

    if (this.console) {
        if (level == 'warn') {
            console.warn(`${color}${formattedMessage}${reset}`);
        } else if (level == 'error') {
            console.error(`${color}${formattedMessage}${reset}`);
        } else {
            console.log(`${color}${formattedMessage}${reset}`);
        }
    }

    if (this.logFile) {
        fs.appendFileSync(this.logFile, `${formattedMessage}\n`);
    }
}

  error(message) {
    this.#log('error', message);
  }

  warn(message) {
    this.#log('warn', message);
  }

  info(message) {
    this.#log('info', message);
  }

  debug(message) {
    this.#log('debug', message);
  }

  trace(message) {
    this.#log('trace', message);
  }
}