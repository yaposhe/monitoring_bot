import { execSync } from 'node:child_process';

const serviceName = 'bot';

console.log(`Проверяется статус службы "${serviceName}"...`);

try {
    const command = `systemctl status ${serviceName}`;
    const output = execSync(command, { encoding: 'utf8', timeout: 5000 }); // Таймаут 5 секунд
    console.log(output);
} catch (err) {
    console.error(`Ошибка выполнения команды: ${err.message}`);
    console.error(`Код завершения: ${err.status}`);
    console.error(`Сообщение об ошибке: ${err.stderr ? err.stderr : '(нет)'}`);
}