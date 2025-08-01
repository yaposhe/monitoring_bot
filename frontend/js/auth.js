// Функция для показа/скрытия индикатора загрузки
function setLoading(isLoading, formElement) {
  const submitButton = formElement.querySelector('button[type="submit"]');

  if (isLoading) {
    submitButton.disabled = true;
    submitButton.innerHTML = 'Отправка...';
  } else {
    submitButton.disabled = false;
    submitButton.innerHTML = submitButton.dataset.originalText || 'Отправить';
  }
}

function showLogin(e) {
  if (e) { // Проверка наличия события
    e.preventDefault(); // Отменяет действие по умолчанию (если событие было)
  }
  document.getElementById("loginEmail").value = document.getElementById("regEmail").value;
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}

function showRegister(e) {
  if (e) { // Проверка наличия события
    e.preventDefault(); // Отменяет действие по умолчанию (если событие было)
  }
  document.getElementById("regEmail").value = document.getElementById("loginEmail").value;
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}

// Переключение между формами
document.getElementById("showLogin").addEventListener("click", showLogin);
document.getElementById("showRegister").addEventListener("click", showRegister);

// Обработка формы регистрации
document.getElementById("register").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = this;
  // Сохраняем оригинальный текст кнопки
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.dataset.originalText = submitButton.textContent;

  // Включаем индикацию загрузки
  setLoading(true, form);

  // регистрация
  const email = document.getElementById("regEmail").value;
  const regPassword = document.getElementById("regPassword");
  const regPasswordRepeat = document.getElementById("regPasswordRepeat");
  const password = regPassword.value;
  const passwordRepeat = regPasswordRepeat.value;

  if (password != passwordRepeat) {
    alert(`Введенные пароли не совпадают`);
    regPassword.value = "";
    regPasswordRepeat.value = "";
    setLoading(false, form);
    return;
  }

  const response = await fetch('/v1/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });
  const j = await response.json();
  setLoading(false, form);
  if (!response.ok) {
    const details = j.details;
    alert(`Ошибка регистрации: ${details}`)
    console.log(`${response.ok} ${JSON.stringify(j, null, 2)}`);
    if (details === "Пользователь с таким email уже существует") {
      document.getElementById("loginEmail").value = email;
      showLogin();
    }
    return;
  }

  // переход на главную
  window.location.assign('/');
});

// Обработка формы авторизации
document.getElementById("login").addEventListener("submit", async function (e) {
  e.preventDefault();
  const form = this;
  setLoading(true, form);
  
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const response = await fetch('/v1/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });
  const j = await response.json();
  setLoading(false, form);
  if (!response.ok) {
    const details = j.details;
    alert(`Ошибка входа: ${details}`)
    console.log(`${response.ok} ${JSON.stringify(j, null, 2)}`);
    return;
  }

  // переход на главную
  window.location.assign('/');
});