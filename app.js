const STORAGE_KEY = "onelink_state_v1";

const defaultState = {
  theme: "light",
  activeChatId: "chat-1",
  auth: {
    email: "",
    isLoggedIn: false,
    pendingCode: "",
    pendingEmail: "",
    codeExpiresAt: 0,
  },
  chats: [
    {
      id: "chat-1",
      name: "OneLink Команда",
      messages: [
        { author: "system", text: "Добро пожаловать в OneLink!", ts: Date.now() - 3600000 },
        { author: "me", text: "Интерфейс выглядит отлично 🚀", ts: Date.now() - 2400000 },
      ],
    },
    {
      id: "chat-2",
      name: "Семья",
      messages: [{ author: "system", text: "Не забудьте созвон в 20:00", ts: Date.now() - 1800000 }],
    },
  ],
};

const elements = {
  chatList: document.getElementById("chatList"),
  contactSearch: document.getElementById("contactSearch"),
  newChatBtn: document.getElementById("newChatBtn"),
  activeChatName: document.getElementById("activeChatName"),
  activeChatStatus: document.getElementById("activeChatStatus"),
  messageFeed: document.getElementById("messageFeed"),
  messageForm: document.getElementById("messageForm"),
  messageInput: document.getElementById("messageInput"),
  themeToggle: document.getElementById("themeToggle"),
  chatItemTemplate: document.getElementById("chatItemTemplate"),
  messageTemplate: document.getElementById("messageTemplate"),
  authOverlay: document.getElementById("authOverlay"),
  emailForm: document.getElementById("emailForm"),
  emailInput: document.getElementById("emailInput"),
  codeForm: document.getElementById("codeForm"),
  codeInput: document.getElementById("codeInput"),
  authStatus: document.getElementById("authStatus"),
  profileEmail: document.getElementById("profileEmail"),
  logoutBtn: document.getElementById("logoutBtn"),
};

const loadState = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed ? { ...defaultState, ...parsed } : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
};

let state = loadState();

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const formatTime = (ts) =>
  new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const getActiveChat = () => state.chats.find((chat) => chat.id === state.activeChatId);

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const renderAuth = () => {
  elements.profileEmail.textContent = state.auth.isLoggedIn ? state.auth.email : "Гость";
  elements.authOverlay.classList.toggle("hidden", state.auth.isLoggedIn);
  elements.codeForm.classList.toggle("hidden", !state.auth.pendingCode);

  if (!state.auth.pendingCode) {
    elements.authStatus.textContent = "";
  }
};

const renderChatList = () => {
  const query = elements.contactSearch.value.trim().toLowerCase();
  elements.chatList.innerHTML = "";

  state.chats
    .filter((chat) => chat.name.toLowerCase().includes(query))
    .forEach((chat) => {
      const fragment = elements.chatItemTemplate.content.cloneNode(true);
      const item = fragment.querySelector(".chat-item");
      const button = fragment.querySelector("button");
      fragment.querySelector(".chat-name").textContent = chat.name;

      const last = chat.messages[chat.messages.length - 1];
      fragment.querySelector(".chat-preview").textContent =
        last?.text?.slice(0, 40) || "Нажмите, чтобы начать диалог";

      if (chat.id === state.activeChatId) {
        item.classList.add("active");
      }

      button.addEventListener("click", () => {
        state.activeChatId = chat.id;
        saveState();
        render();
      });

      elements.chatList.appendChild(fragment);
    });
};

const renderMessages = () => {
  const chat = getActiveChat();
  elements.messageFeed.innerHTML = "";

  if (!chat) {
    elements.activeChatName.textContent = "Выберите чат";
    elements.activeChatStatus.textContent = "Создайте новый чат для старта";
    return;
  }

  elements.activeChatName.textContent = chat.name;
  elements.activeChatStatus.textContent = `${chat.messages.length} сообщений`;

  chat.messages.forEach((msg) => {
    const fragment = elements.messageTemplate.content.cloneNode(true);
    const message = fragment.querySelector(".message");
    fragment.querySelector(".message-text").textContent = msg.text;
    fragment.querySelector(".message-time").textContent = formatTime(msg.ts);
    if (msg.author === "me") message.classList.add("me");
    elements.messageFeed.appendChild(fragment);
  });

  elements.messageFeed.scrollTop = elements.messageFeed.scrollHeight;
};

const renderTheme = () => {
  const isDark = state.theme === "dark";
  document.body.classList.toggle("dark", isDark);
  elements.themeToggle.textContent = isDark ? "☀️ Тема" : "🌙 Тема";
};

const render = () => {
  renderTheme();
  renderAuth();
  renderChatList();
  renderMessages();
};

elements.emailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = elements.emailInput.value.trim().toLowerCase();
  if (!email) return;

  const code = generateCode();
  state.auth.pendingCode = code;
  state.auth.pendingEmail = email;
  state.auth.codeExpiresAt = Date.now() + 5 * 60 * 1000;

  elements.authStatus.textContent = `Код отправлен на ${email}. Демо-код: ${code}`;
  saveState();
  renderAuth();
});

elements.codeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = elements.codeInput.value.trim();

  if (Date.now() > state.auth.codeExpiresAt) {
    elements.authStatus.textContent = "Код истёк. Запросите новый.";
    state.auth.pendingCode = "";
    saveState();
    renderAuth();
    return;
  }

  if (code !== state.auth.pendingCode) {
    elements.authStatus.textContent = "Неверный код. Проверьте письмо и повторите.";
    return;
  }

  state.auth.email = state.auth.pendingEmail;
  state.auth.isLoggedIn = true;
  state.auth.pendingCode = "";
  state.auth.pendingEmail = "";
  state.auth.codeExpiresAt = 0;

  elements.emailInput.value = "";
  elements.codeInput.value = "";
  saveState();
  render();
});

elements.logoutBtn.addEventListener("click", () => {
  state.auth.isLoggedIn = false;
  state.auth.email = "";
  state.auth.pendingCode = "";
  state.auth.pendingEmail = "";
  state.auth.codeExpiresAt = 0;
  elements.codeInput.value = "";
  elements.emailInput.value = "";
  saveState();
  render();
});

elements.contactSearch.addEventListener("input", renderChatList);

elements.newChatBtn.addEventListener("click", () => {
  if (!state.auth.isLoggedIn) {
    elements.authStatus.textContent = "Сначала войдите по электронной почте.";
    renderAuth();
    return;
  }

  const name = prompt("Название нового чата:");
  if (!name || !name.trim()) return;

  const newChat = {
    id: `chat-${Date.now()}`,
    name: name.trim(),
    messages: [{ author: "system", text: "Чат создан в OneLink", ts: Date.now() }],
  };

  state.chats.unshift(newChat);
  state.activeChatId = newChat.id;
  saveState();
  render();
});

elements.messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.auth.isLoggedIn) {
    elements.authStatus.textContent = "Для отправки сообщений подтвердите email.";
    renderAuth();
    return;
  }

  const text = elements.messageInput.value.trim();
  if (!text) return;

  const chat = getActiveChat();
  if (!chat) return;

  chat.messages.push({ author: "me", text, ts: Date.now() });
  elements.messageInput.value = "";
  saveState();
  render();

  setTimeout(() => {
    chat.messages.push({
      author: "system",
      text: "OneLink Bot: Получили сообщение, скоро ответим!",
      ts: Date.now(),
    });
    saveState();
    render();
  }, 700);
});

elements.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState();
  renderTheme();
});

render();
