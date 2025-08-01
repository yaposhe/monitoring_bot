export class IDbConnector {
    constructor() {
        if (new.target === IDbConnector) {
            throw new Error('Нельзя создавать экземпляры абстрактного класса IDbConnector.');
        }
    }

    open() {
        throw new Error('Метод open должен быть реализован в подклассе!');
    }

    close() {
        throw new Error('Метод close должен быть реализован в подклассе!');
    }
}