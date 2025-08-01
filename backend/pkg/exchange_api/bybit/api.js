/**
 * Получение списка USDT-пар с bybit
 * @param {boolean} sorted 
 * @param {import("../../logger/logger.js").Logger} logger
 * @returns {string[]}
 */
export async function loadAvailablePairs(sorted, logger=console) {
    let pairs = [];
    try {
        const url = new URL('https://api.bybit.com/v5/market/tickers');
        url.searchParams.append('category', 'linear');

        const response = await fetch(url.toString());

        if (!response.ok) {
            const text = await response.text()
            throw new Error(`HTTP error! status: ${response.status} text: ${text}`);
        }

        const data = await response.json();
        const list = data.result.list
        for (let i = 0; i < list.length; i++) {
            let pair_info = list[i]
            let symbol = pair_info.symbol
            if (symbol.endsWith('USDT')) {
                pairs.push(symbol)
            }
        }
        if (sorted) {
            pairs = pairs.sort();
        }
        logger.debug(`Загружены пары: ${pairs}`);
    } catch (error) {
        logger.error(error);
    }
    return pairs;
}