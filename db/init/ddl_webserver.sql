-- Таблица users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,       -- автоинкрементный идентификатор
    email TEXT NOT NULL UNIQUE,                 -- уникальное текстовое поле e-mail
    password TEXT NOT NULL,                    -- текстовое поле для хранения пароля
    role TEXT NOT NULL DEFAULT 'user',         -- поле для хранения роли пользователя (по умолчанию 'user')
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- дата-время создания записи
    updated_at DATETIME                        -- дата-время последнего обновления записи
);

-- Триггер для установки initial value для updated_at при вставке
CREATE TRIGGER IF NOT EXISTS init_updated_at
AFTER INSERT ON users
BEGIN
    UPDATE users
    SET updated_at = NEW.created_at
    WHERE id = NEW.id;
END;

-- Триггер для автоматического обновления поля updated_at при обновлении записи
CREATE TRIGGER IF NOT EXISTS update_updated_at
AFTER UPDATE OF email, password ON users
BEGIN
    UPDATE users
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Индекс для обеспечения уникального сочетания email+password
CREATE UNIQUE INDEX IF NOT EXISTS unique_email_password ON users(email, password);