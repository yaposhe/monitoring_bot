-- Вставка первого пользователя
INSERT INTO users (email, password)
VALUES ('alice@example.com', 'strongpassword123');

-- Вставка второго пользователя
INSERT INTO users (email, password)
VALUES ('bob@example.org', 'anotherpassword456');

-- Изменение пароля у первого пользователя
UPDATE users
SET password = 'newpassword789'
WHERE email = 'alice@example.com';

-- Просмотр всех пользователей
SELECT * FROM users;