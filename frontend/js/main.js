const baseUrl = window.location.origin;

let botConfig = {};
let unsavedPairParamsChanges = {};
let bot_sessions = [];
let daemonState = 0; // 0 - не запущен, 1 - запущен
let userEmail = "";
let role = "user"; // или "admin"

function getToken() {
    return localStorage.getItem('authToken');
}

const pairParamsKey = "pair_params";

// Загрузка конфигурации
async function loadConfig() {
    try {
        console.debug('Получаю конфиг')
        const response = await fetch('/v1/api/config');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        botConfig = await response.json();

        const pairs = Object.keys(botConfig.pair_params);
        console.debug(`${response.ok} Получил конфиг, содержащий ${pairs.length} пар`)
        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i];
            const existingPairsSelect = document.getElementById('existingPairs');
            const option = document.createElement('option');
            option.value = pair;
            option.textContent = pair;
            existingPairsSelect.appendChild(option);
        }
        updateUI();
    } catch (error) {
        console.error('Ошибка загрузки конфигурации: ', error);
    }
}

// Загрузка пар
async function loadPairs() {
    try {
        console.debug('Получаю пары, доступные для торговли')
        const response = await fetch('/v1/api/exchange/bybit/pairs');
        const pairs = await response.json();
        const availablePairsSelect = document.getElementById('availablePairs');
        pairs.forEach(pair => {
            const option = document.createElement('option');
            option.value = pair;
            option.textContent = pair;
            availablePairsSelect.appendChild(option);
        });
        console.debug(`Получил ${pairs.length} пар`)
    } catch (e) {
        console.error('Ошибка загрузки пар: ', e);
    }
}

async function loadSessions() {
    try {
        console.debug('Получаю сессии запуска бота')
        const response = await fetch('/v1/api/bot/sessions');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const sessions = await response.json();
        bot_sessions = sessions;
        console.debug(`Получил ${bot_sessions.length} сессий`)
    } catch (e) {
        console.error('Ошибка загрузки сессий: ', e);
    }
}

async function loadStat(session_id) {
    try {
        const url = new URL('/v1/api/bot/stat', baseUrl);
        url.searchParams.append('session_id', session_id);
        const response = await fetch(url.toString());

        if (!response.ok) {
            const j = await response.text()
            alert(j);
            throw new Error(`HTTP ${response.status}: ${j}`);
        }
        return response.json();
    } catch (e) {
        console.error('Ошибка загрузки статистики: ', e);
        return null;
    }
}

async function setDataToStatModal() {
    for (let i = 0; i < bot_sessions.length; i++) {
        const sessionsSelect = document.getElementById('existingLaunches');
        const bot_session = bot_sessions[i];
        const option = document.createElement('option');
        option.value = bot_session.started_at;
        option.textContent = bot_session.started_at;
        sessionsSelect.appendChild(option);
    }
}

async function loadAndRenderStat() {
    const selectElement = document.getElementById('existingLaunches');
    const selectedIndex = selectElement.selectedIndex;
    if (selectedIndex < 0) {
        return;
    }
    const stat = await loadStat(bot_sessions[selectedIndex].id);
    renderStatsTable(stat);
}

async function initStatModal() {
    try {
        const dialog = document.getElementById('dlgStats');
        const openBtn = document.getElementById('openStatBtn');
        const closeBtn = document.getElementById('closeStatBtn');
        const refreshStatsBtn = document.getElementById('refreshStatsBtn');
        if (!dialog || !openBtn || !closeBtn || !refreshStatsBtn) {
            throw new Error('Не найдены элементы модального окна статистики');
        }
        openBtn.addEventListener('click', async () => {
            await loadAndRenderStat();
            dialog.showModal();
        });
        closeBtn.addEventListener('click', () => {
            dialog.close();
        });
        document.getElementById('existingLaunches').addEventListener('change', async function () {
            await loadAndRenderStat();
        });
        refreshStatsBtn.addEventListener('click', async () => {
            await loadAndRenderStat();
        });
        await setDataToStatModal();
    } catch (e) {
        console.error('Ошибка инициализации окна конфига: ', e);
    }
}

// Инициализация модального окна конфигурации
async function initConfigModal() {
    try {
        const dialog = document.getElementById('dlgConfig');
        const openBtn = document.getElementById('openConfigBtn');
        const closeBtn = document.getElementById('closeConfigBtn');
        const updBtn = document.getElementById('updateConfigBtn');

        if (!dialog || !openBtn || !closeBtn || !updBtn) {
            throw new Error('Не найдены элементы модального окна конфига');
        }

        openBtn.addEventListener('click', () => {
            //updateUnsavedStatus(); // TODO
            dialog.showModal();
        });
        closeBtn.addEventListener('click', () => {
            unsavedPairParamsChanges = {}; // Очищаем изменения после успешного сохранения
            dialog.close();
        });

        updBtn.addEventListener('click', async () => {
            await loadConfig();
        });

        // Обработчики событий
        document.getElementById('existingPairs').addEventListener('change', function () {
            showPairConfig(this.value);
        });

        document.getElementById('addPairBtn').addEventListener('click', function () {
            const newPair = document.getElementById('availablePairs').value;
            if (newPair && !botConfig.pair_params[newPair]) {
                botConfig.pair_params[newPair] = botConfig.pair_params["default"];
                unsavedPairParamsChanges[newPair] = botConfig.pair_params["default"];
                updateUI();
            }
        });

        document.getElementById('saveConfigBtn').addEventListener('click', async () => {
            if (Object.keys(unsavedPairParamsChanges).length === 0) {
                alert('Нет изменений для сохранения!');
                return;
            }

            try {
                // Подготовка данных (можно добавить валидацию)
                const dataToSend = {};
                dataToSend[pairParamsKey] = {}
                for (const pair in unsavedPairParamsChanges) {
                    dataToSend[pairParamsKey][pair] = {};
                    for (const param in unsavedPairParamsChanges[pair]) {
                        // Проверка на пустые значения (опционально)
                        if (unsavedPairParamsChanges[pair][param] !== undefined) {
                            dataToSend[pairParamsKey][pair][param] = unsavedPairParamsChanges[pair][param];
                        }
                    }
                }

                // Отправка на сервер
                const response = await fetch('/v1/api/config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend),
                });

                if (response.ok) {
                    alert('Конфигурация сохранена');
                    unsavedPairParamsChanges = {}; // Очищаем изменения после успешного сохранения
                    await loadConfig();
                } else {
                    throw new Error('Ошибка сервера');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Не удалось сохранить конфигурацию');
            }
        });
    } catch (e) {
        console.error('Ошибка инициализации окна конфига: ', e);
    }
}

function updateUI() {
    const existingPairsSelect = document.getElementById('existingPairs');
    existingPairsSelect.innerHTML = '';

    // Заполняем список текущих пар
    Object.keys(botConfig.pair_params || {}).forEach(pair => {
        const option = document.createElement('option');
        option.value = pair;
        option.textContent = pair;
        existingPairsSelect.appendChild(option);
    });

    showMainConfig();

    // Показываем конфигурацию первой пары
    if (existingPairsSelect.options.length > 0) {
        showPairConfig(existingPairsSelect.value);
    }
}

function showMainConfig() {
    const mainContainer = document.getElementById('mainConfigContainer');
    mainContainer.innerHTML = '';
    {
        const key = "headgers_count";
        const value = botConfig.headgers_count;
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'main-config-field';
        const label = document.createElement('label');
        label.textContent = `${key}`;
        label.title = botConfig.hints?.[key] || 'Подсказки нет'; // Добавляем подсказку (если есть)
        label.className = 'main-config-label'
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.value = parseFloat(value);
        input.className = "config-input-value";
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        mainContainer.appendChild(fieldDiv);
    }
    {
        const key = "consumers_trades_count";
        const value = botConfig.consumers_trades_count;
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'main-config-field';
        const label = document.createElement('label');
        label.textContent = `${key}`;
        label.title = botConfig.hints?.[key] || 'Подсказки нет'; // Добавляем подсказку (если есть)
        label.className = 'main-config-label'
        const input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.value = parseFloat(value);
        input.className = "config-input-value";
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        mainContainer.appendChild(fieldDiv);
    }
    {
        const key = "is_demo_trading";
        const value = botConfig.is_demo_trading;
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'main-config-field';
        const label = document.createElement('label');
        label.textContent = `${key}`;
        label.title = botConfig.hints?.[key] || 'Подсказки нет'; // Добавляем подсказку (если есть)
        label.className = 'main-config-label'
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = value.toLowerCase() === 'true';
        input.className = "config-input-checkbox";
        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        mainContainer.appendChild(fieldDiv);
    }
}

function createLabelWithTooltip(key, hint) {
    const label = document.createElement('label');
    label.className = 'label-with-custom-tooltip';
    label.textContent = key;

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip-text';
    tooltip.textContent = hint;

    label.appendChild(tooltip);
    return label;
}

function showPairConfig(pair) {
    // TODO: проверить работу изменений в конфиге
    const pairContainer = document.getElementById('pairConfigContainer');
    pairContainer.innerHTML = '';

    const pairConfig = botConfig.pair_params[pair] || botConfig.pair_params["default"];

    Object.entries(pairConfig).forEach(([pairConfigParamName, pairConfigParamValue]) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'main-config-field';

        // чет на маке не отображается всплывающая дефолтная подсказка. Пришлось делать кастомную
        const hint = botConfig.hints?.[pairConfigParamName] || 'Подсказки нет'
        const label = createLabelWithTooltip(pairConfigParamName, hint)

        const input = document.createElement('input');

        // Если значение булевое — делаем чекбокс, иначе текстовое поле
        if (pairConfigParamValue.toLowerCase() === "true" || pairConfigParamValue.toLowerCase() === "false") {
            input.type = 'checkbox';
            input.checked = pairConfigParamValue.toLowerCase() === 'true';
            input.className = "config-input-checkbox";
        } else {
            input.type = 'number';
            input.step = 'any';
            input.className = "config-input-value";
            input.value = parseFloat(pairConfigParamValue);
        }

        input.dataset.param = pairConfigParamName;

        input.addEventListener('change', (e) => {
            if (!unsavedPairParamsChanges[pair]) {
                unsavedPairParamsChanges[pair] = {};
            }

            let newValue;
            if (e.target.type === 'checkbox') {
                newValue = e.target.checked.toString();
            } else if (e.target.type === 'number') {
                newValue = parseFloat(e.target.value) || 0;
            } else {
                newValue = e.target.value;
            }

            // Проверяем, отличается ли новое значение от оригинального
            const originalValue = botConfig[pairParamsKey][pair][pairConfigParamName];
            let isChanged = false;

            if (originalValue.toString().toLowerCase() === "true" || originalValue.toString().toLowerCase() === "false") {
                isChanged = (newValue !== originalValue.toString().toLowerCase());
            } else if (!isNaN(parseFloat(originalValue))) {
                isChanged = (parseFloat(newValue) !== parseFloat(originalValue));
            } else {
                isChanged = (newValue !== originalValue);
            }

            if (isChanged) {
                unsavedPairParamsChanges[pair][pairConfigParamName] = `${newValue}`;
            } else {
                // Если значение вернулось к оригинальному - удаляем из изменений
                if (unsavedPairParamsChanges[pair] && unsavedPairParamsChanges[pair][pairConfigParamName]) {
                    delete unsavedPairParamsChanges[pair][pairConfigParamName];
                    // Если для этой пары больше нет изменений - удаляем запись
                    if (Object.keys(unsavedPairParamsChanges[pair]).length === 0) {
                        delete unsavedPairParamsChanges[pair];
                    }
                }
            }

            console.log('Изменения:', unsavedPairParamsChanges);
            //updateUnsavedStatus(); // TODO
        });

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        pairContainer.appendChild(fieldDiv);
    });
}

// Функция для отображения статуса изменений
function updateUnsavedStatus() {
    const statusDiv = document.getElementById('unsavedStatus') || document.createElement('div');
    statusDiv.id = 'unsavedStatus';

    if (Object.keys(unsavedPairParamsChanges).length > 0) {
        statusDiv.textContent = 'Есть несохраненные изменения';
        statusDiv.style.color = 'orange';
    } else {
        statusDiv.textContent = 'Несохраненных изменений в конфигурации нет';
        statusDiv.style.color = 'green';
    }

    if (!document.getElementById('unsavedStatus')) {
        statusDiv.style.marginTop = '10px';
        document.getElementById('pairConfigContainer').appendChild(statusDiv);
    }
}

async function initStartBotButton() {
    const startBotBtn = document.getElementById('startBot');
    if (daemonState === 1) {
        startBotBtn.setAttribute('disabled', '');
    }
    startBotBtn.addEventListener('click', async () => {
        if (!getConfirm("запуск бота")) {
            return;
        }

        const url = new URL('/v1/api/bot', baseUrl);
        url.searchParams.append('action', 'start');
        const response = await fetch(url.toString());

        if (!response.ok) {
            const j = await response.text()
            alert(j);
            throw new Error(`HTTP ${response.status}: ${j}`);
        }
        alert('Бот уже запущен');
    });
}

async function initStopBotButton() {
    const stopBotBtn = document.getElementById('stopBot');
    if (daemonState === 0) {
        stopBotBtn.setAttribute('disabled', '');
    }
    stopBotBtn.addEventListener('click', async () => {
        if (!getConfirm("остановку бота")) {
            return;
        }

        const url = new URL('/v1/api/bot', baseUrl);
        url.searchParams.append('action', 'stop');
        const response = await fetch(url.toString());

        if (!response.ok) {
            const j = await response.text()
            alert(j);
            throw new Error(`HTTP ${response.status}: ${j}`);
        }
        alert('Бот уже остановлен');
    });
}

async function initRestartBotButton() {
    const restartBotBtn = document.getElementById('restartBot');
    restartBotBtn.addEventListener('click', async () => {
        if (!getConfirm("перезапуск бота")) {
            return;
        }

        const url = new URL('/v1/api/bot', baseUrl);
        url.searchParams.append('action', 'restart');
        const response = await fetch(url.toString());

        if (!response.ok) {
            const j = await response.text()
            alert(j);
            throw new Error(`HTTP ${response.status}: ${j}`);
        }
        alert('Бот перезапущен');
    });
}

function renderStatsTable(stats) {
    if (!stats) {
        return;
    }

    const tbody = document.querySelector('#statsTable tbody');
    tbody.innerHTML = '';

    if (stats.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3">Статистика по данному запуску отсутствует</td>`;
        tbody.appendChild(row);
    }

    for (let i = 0; i < stats.length; i++) {
        const stat = stats[i];
        const row = document.createElement('tr');
        const updated_data = stat.updated_data;
        const date = new Date(updated_data);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        };
        const localDateString = date.toLocaleString('ru-RU', options); // Пример для русской локали
        row.innerHTML = `
        <td>${stat.pair}</td>
        <td>${stat.hedge_cycle}</td>
        <td>${localDateString}</td>
        `;

        tbody.appendChild(row);
    }
}

async function initLogoutBtn() {
    document.getElementById("logoutBtn").addEventListener("click", async function (e) {
        e.preventDefault();
        const response = await fetch('/v1/api/logout', {
            method: 'POST',
            credentials: 'include' // Включаем передачу куков
        });
        location.reload();
    });
}

function showNotification(message, duration = 3000) {
    const notificationElement = document.querySelector('#notification');

    // Устанавливаем сообщение
    notificationElement.textContent = message;

    // Показываем уведомление
    notificationElement.classList.remove('hidden');

    // Через указанное количество миллисекунд скрываем уведомление
    setTimeout(() => {
        notificationElement.classList.add('hidden');

        // Удаляем класс спустя анимацию (примерно через полсекунды)
        setTimeout(() => {
            notificationElement.textContent = ''; // очищаем текст
        }, 500);
    }, duration);
}

async function loadDaemonState() {
    try {
        console.debug('Получаю статус бота')
        const url = new URL('/v1/api/bot', baseUrl);
        url.searchParams.append('action', 'status');
        const response = await fetch(url.toString());

        if (!response.ok) {
            const j = await response.text()
            alert(j);
            throw new Error(`HTTP ${response.status}: ${j}`);
        }
        const j = await response.json();
        console.log(`${response.ok} ${JSON.stringify(j, null, 2)}`);
        if ('output' in j) {
            daemonState = j.output === 'active' ? 1 : 0;
            if (daemonState === 1) {
                showNotification('Бот запущен');
            } else if (daemonState === 0) {
                showNotification('Бот не запущен');
            }
        } else {
            console.warn('Ключ "output" отсутствует в ответе');
        }
    } catch (e) {
        console.error('Ошибка загрузки состояния службы: ', e);
    }
}

async function initUser() {
    const url = new URL('/v1/api/user', baseUrl);
    const response = await fetch(url.toString());

    if (!response.ok) {
        const j = await response.text()
        alert(j);
        throw new Error(`HTTP ${response.status}: ${j}`);
    }
    const j = await response.json();
    userEmail = j.email;
    role = j.role;
    document.getElementById('userEmailDisplay').innerText = userEmail;
}

async function loadAndRenderJournal() {
    const selectElement = document.getElementById('availableJournals');
    const journalName = selectElement.value;
    if (!journalName) {
        return;
    }
    const journal = await loadJournal(journalName);
    await renderJournal(journal);
}

async function loadJournal(id) {
    try {
        const url = new URL(`/v1/api/journal/${id}`, baseUrl);
        const response = await fetch(url.toString());

        if (!response.ok) {
            const j = await response.text()
            alert(j);
            throw new Error(`HTTP ${response.status}: ${j}`);
        }
        return response.json();
    } catch (e) {
        console.error('Ошибка загрузки статистики: ', e);
        return null;
    }
}

function highlightLogs() {
    const container = document.getElementById('journalPreview');
    if (!container) return;

    // Получаем текущий текст
    const text = container.innerText;

    // Очищаем содержимое
    container.innerHTML = '';

    // Разбиваем на строки
    const lines = text.split('\n');

    let linesWithHighlight = "";

    lines.forEach(line => {
        let htmlLine = line;

        htmlLine = htmlLine.replace('[INFO]', '<span class="journal-log-info">[INFO]</span>');
        htmlLine = htmlLine.replace('[WARN]', '<span class="journal-log-warning">[WARN]</span>');
        htmlLine = htmlLine.replace('[ERROR]', '<span class="journal-log-error">[ERROR]</span>');

        linesWithHighlight += htmlLine + '\n';
    });
    container.innerHTML = linesWithHighlight;
}

async function renderJournal(journal) {
    if (!journal) {
        return;
    }
    const journalPreview = document.getElementById('journalPreview');
    journalPreview.textContent = journal.content;
    highlightLogs();
}

async function loadJournals(filterPair) {
    const url = new URL('/v1/api/journals', baseUrl);
    url.searchParams.append('pair', filterPair);
    const response = await fetch(url.toString());

    if (!response.ok) {
        const j = await response.text()
        alert(j);
        throw new Error(`HTTP ${response.status}: ${j}`);
    }
    return response.json();
}

function makeJournalOption(journal) {
    const option = document.createElement('option');
    option.value = journal;
    if (journal !== 'log.log') {
        const regex = /^([A-Za-z0-9]+)_(\d+)_(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})\.log$/;
        const match = journal.match(regex);
        if (match) {
            const [_, pair, cycleNumber, year, month, day, hour, minute, second] = match;
            const formattedDate = `${day}.${month}.${year} ${hour}:${minute}:${second}`;
            option.textContent = `По ${pair} от ${formattedDate}`;
        } else {
            option.textContent = `Не удалось распарсить имя журнала: ${journal}`;
        }
    } else {
        option.textContent = "Основной журнал";
    }
    return option;
}

async function initJournals() {
    try {
        const dialog = document.getElementById('journalDialog');
        const openBtn = document.getElementById('openJournalBtn');
        const closeBtn = document.getElementById('closeJournalBtn');
        const refreshJournalBtn = document.getElementById('refreshJournalBtn');
        if (!dialog || !openBtn || !closeBtn || !refreshJournalBtn) {
            throw new Error('Не найдены элементы модального окна статистики');
        }
        openBtn.addEventListener('click', async () => {
            await loadAndRenderJournal();
            dialog.showModal();
        });
        closeBtn.addEventListener('click', () => {
            dialog.close();
        });
        const availableJournalsSelect = document.getElementById('availableJournals');
        availableJournalsSelect.addEventListener('change', async function () {
            await loadAndRenderJournal();
        });
        refreshJournalBtn.addEventListener('click', async () => {
            await loadAndRenderJournal();
        });

        const journals = await loadJournals('all');

        journals.forEach(journal => {
            const option = makeJournalOption(journal);
            availableJournalsSelect.appendChild(option);
        });

        // Регулярное выражение для парсинга имени файла
        const filenameRegex = /^([A-Za-z0-9]+)_(\d+)_(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})\.log$/;

        const pairs = new Set();
        const pairFilter = document.getElementById('pairFilter');
        journals.forEach(journal => {
            const match = journal.match(filenameRegex);
            if (match) {
                const [_, pair, cycleNumber, year, month, day, hour, minute, second] = match;
                pairs.add(pair);
            }
        });

        pairs.forEach(pair => {
            const option = document.createElement('option');
            option.value = pair;
            option.textContent = pair;
            pairFilter.appendChild(option);
        });

        pairFilter.addEventListener('change', async function () {
            const selectElement = document.getElementById('pairFilter');
            const journalPair = selectElement.value;
            const journals = await loadJournals(journalPair);

            const availableJournalsSelect = document.getElementById('availableJournals');
            availableJournalsSelect.innerHTML = '';
            journals.forEach(journal => {
                const option = makeJournalOption(journal);
                availableJournalsSelect.appendChild(option);
            });

            await loadAndRenderJournal();
        });

    } catch (e) {
        console.error('Ошибка загрузки журналов: ', e);
    }
}

function getConfirm(action) {
    const msg = `Вы точно уверены, что хотите выполнить ${action}?`;
    return confirm(msg);
}

async function initApiDialog() {
    const openBtn = document.getElementById('openApiBtn');
    const dialog = document.getElementById('dlgApi');
    const closeBtn = document.getElementById('closeApiBtn');
    const exchangeSelect = document.getElementById('exchangeApiSelect');
    const apiFieldsDiv = document.getElementById('apiFields');
    const sendBtn = document.getElementById('sendApiKeysBtn');
    const checkBtn = document.getElementById('checkApiKeysBtn');

    openBtn.addEventListener('click', () => {
        dialog.showModal();
    });

    closeBtn.addEventListener('click', () => {
        dialog.close();
    });

    sendBtn.addEventListener('click', () => {
        const exchange = exchangeSelect.value;
        const apiKey = document.getElementById('apiKey').value.trim();
        const apiSecret = document.getElementById('apiSecretKey').value.trim();

        if (!exchange) {
            alert('Пожалуйста, выберите биржу.');
            return;
        }
        if (!apiKey || !apiSecret) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        alert(`Ключи для ${exchange} отправлены:\nAPI Key: ${apiKey}\nSecret Key: ${apiSecret}`);
    });

    checkBtn.addEventListener('click', () => {
        const exchange = exchangeSelect.value;

        if (!exchange) {
            alert('Пожалуйста, выберите биржу.');
            return;
        }

        const apiKey = document.getElementById('apiKey').value.trim();
        const apiSecret = document.getElementById('apiSecretKey').value.trim();

        if (!apiKey || !apiSecret) {
            alert('Пожалуйста, заполните все поля перед проверкой.');
            return;
        }

        alert(`Проверка ключей для ${exchange}...`);
    });
}

const init = async () => {
    await initUser();
    await loadDaemonState();
    await loadConfig();
    await loadPairs();
    await initJournals();
    await loadSessions();
    await initStartBotButton();
    await initStopBotButton();
    await initRestartBotButton();
    await initConfigModal();
    await initStatModal();
    await initLogoutBtn();
    await initApiDialog();
};

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', init);