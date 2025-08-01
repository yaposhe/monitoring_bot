import assert from 'node:assert';
import { describe, it } from 'node:test';
import { loadAvailablePairs } from './api.js';

describe('loadAvailablePairs (real API test)', () => {
    it('should return sorted USDT pairs when sorted=true', async () => {
        const pairs = await loadAvailablePairs(true);

        assert(Array.isArray(pairs), 'Результат должен быть массивом');
        assert(pairs.length > 0, 'Хотя бы одна пара должна присутствовать');
        assert.deepStrictEqual(
            pairs,
            [...pairs].sort(),
            'Пары должны быть отфильтрованы по алфавиту'
        );
    });
});