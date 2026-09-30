// ======================
// 数据结构：
// users: { "alice": "123456" }
// conversations: {
//   "alice": [
//     { id: "conv1", title: "如何学习...", messages: [...] },
//     { id: "conv2", title: "你好", messages: [...] }
//   ]
// }
// currentUser: "alice"
// currentConversationId: "conv1"
// ======================

const authContainer = document.getElementById('authContainer');
const chatApp = document.getElementById('chatApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const authMessage = document.getElementById('authMessage');
const logoutBtn = document.getElementById('logoutBtn');
const currentUserEl = document.getElementById('currentUser');

const newChatBtn = document.getElementById('newChatBtn');
const historyList = document.getElementById('historyList');
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

let currentUser = null;
let currentConversationId = null;

// 初始化
function init() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        const convId = localStorage.getItem(`currentConv_${currentUser}`);
        currentConversationId = convId || createNewConversation(); // 自动创建或恢复
        showChatApp();
        renderHistory(); // ✅ 正确渲染历史（不是 loadConversations）
    } else {
        showAuth();
    }

    // 绑定通用事件
    newChatBtn.addEventListener('click', createNewConversation);
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function showAuth() {
    authContainer.classList.remove('hidden');
    chatApp.classList.add('hidden');
    document.title = 'AI 助手 - 登录';
}

function showChatApp() {
    authContainer.classList.add('hidden');
    chatApp.classList.remove('hidden');
    document.title = `AI 助手 - ${currentUser}`;
    currentUserEl.textContent = currentUser;

    // 动态绑定删除按钮（确保元素存在）
    const deleteBtn = document.getElementById('deleteCurrentChatBtn');
    if (deleteBtn) {
        deleteBtn.onclick = deleteCurrentConversation;
    }
}

// 用户管理
function saveUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
}

function validateUser(username, password) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    return users[username] === password;
}

// 对话管理
function getConversations() {
    const all = JSON.parse(localStorage.getItem('conversations') || '{}');
    return all[currentUser] || [];
}

function saveConversations(convs) {
    const all = JSON.parse(localStorage.getItem('conversations') || '{}');
    all[currentUser] = convs;
    localStorage.setItem('conversations', JSON.stringify(all));
}

function createNewConversation() {
    const convId = 'conv_' + Date.now();
    const newConv = {
        id: convId,
        title: '新对话',
        messages: [{ role: 'bot', text: '您好！我是您的 AI 助手，请问有什么我可以帮您的吗？' }]
    };
    const convs = getConversations();
    convs.unshift(newConv);
    saveConversations(convs);
    currentConversationId = convId;
    localStorage.setItem(`currentConv_${currentUser}`, convId);
    renderHistory();
    loadConversation(convId);
    return convId;
}

function loadConversation(convId) {
    const convs = getConversations();
    const conv = convs.find(c => c.id === convId);
    if (!conv) {
        createNewConversation();
        return;
    }

    currentConversationId = convId;
    localStorage.setItem(`currentConv_${currentUser}`, convId);

    chatContainer.innerHTML = '';
    conv.messages.forEach(msg => appendMessageToDOM(msg.text, msg.role, false));

    // 更新标题（取第一条用户消息）
    const firstUserMsg = conv.messages.find(m => m.role === 'user');
    if (firstUserMsg && conv.title === '新对话') {
        conv.title = firstUserMsg.text.length > 20 ? firstUserMsg.text.substring(0, 20) + '...' : firstUserMsg.text;
        saveConversations(convs);
    }

    // ✅ 关键：同步高亮状态
    renderHistory();
}

function addMessageToConversation(text, role) {
    const convs = getConversations();
    const conv = convs.find(c => c.id === currentConversationId);
    if (conv) {
        conv.messages.push({ text, role });
        saveConversations(convs);
        renderHistory(); // 可能更新标题
    }
}

function renderHistory() {
    const convs = getConversations().slice(0, 10);
    historyList.innerHTML = '';
    convs.forEach(conv => {
        const btn = document.createElement('button');
        btn.className = 'history-item';
        if (conv.id === currentConversationId) {
            btn.classList.add('active');
        }
        btn.innerHTML = `<span>${conv.title}</span>`;
        btn.onclick = () => loadConversation(conv.id);
        historyList.appendChild(btn);
    });

    // 控制删除按钮状态
    const deleteBtn = document.getElementById('deleteCurrentChatBtn');
    if (deleteBtn) {
        deleteBtn.disabled = convs.length <= 1;
    }
}

function deleteCurrentConversation() {
    console.log("✅ 删除按钮被点击了！currentUser:", currentUser, "convId:", currentConversationId);

    if (!currentUser || !currentConversationId) return;

    const convs = getConversations();
    if (convs.length <= 1) {
        alert('至少需要保留一个对话！');
        return;
    }

    if (!confirm('确定要删除当前对话吗？此操作不可恢复。')) {
        return;
    }

    // 删除当前对话
    const newConvs = convs.filter(conv => conv.id !== currentConversationId);
    saveConversations(newConvs);

    // 跳转到第一个对话
    const nextConvId = newConvs[0].id;
    currentConversationId = nextConvId;
    localStorage.setItem(`currentConv_${currentUser}`, nextConvId);

    // 加载新对话（内部会 renderHistory）
    loadConversation(nextConvId);
}

// 表单事件
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    if (username.length < 3 || password.length < 6) {
        showError('用户名至少3位，密码至少6位');
        return;
    }
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        showError('用户名已存在');
        return;
    }
    saveUser(username, password);
    clearForms();
    showSuccess('注册成功！');
    setTimeout(() => showLoginLink.click(), 800);
});

// script.js 修改 loginForm 提交逻辑
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();
        if (res.ok) {
            currentUser = username;
            localStorage.setItem('currentUser', username);
            // ... 剩余的初始化逻辑
            showChatApp();
            renderHistory();
        } else {
            showError(data.error || '登录失败');
        }
    } catch (err) {
        showError('无法连接到服务器');
    }
});

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    clearMessage();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    clearMessage();
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    currentConversationId = null;
    localStorage.removeItem('currentUser');
    // 注意：不清除 conversations，保留数据
    showAuth();
    chatContainer.innerHTML = '';
});

// script.js 修改 sendMessage 函数
async function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text || !currentUser) return; // 确保用户已登录

    appendMessage(text, "user");
    input.value = "";

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: currentUser, // ✅ 新增：传递当前用户名
                messages: [
                    { role: "user", content: text }
                ]
            })
        });

        const data = await res.json();
        appendMessage(data.reply, "bot");

    } catch (err) {
        appendMessage("❌ AI 服务异常", "bot");
    }
}



function appendMessage(text, role) {
    appendMessageToDOM(text, role, true);
    addMessageToConversation(text, role);
}

function appendMessageToDOM(text, role, scrollToBottom = true) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = `
    <div class="avatar ${role}">${role === 'user' ? '👤' : '<img src="assets/ai.png">'}</div>
    <div class="text">${text.replace(/\n/g, '<br>')}</div>
  `;
    chatContainer.appendChild(msgDiv);
    if (scrollToBottom) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// 工具函数
function showError(msg) {
    authMessage.textContent = msg;
    authMessage.style.color = '#e53e3e';
}

function showSuccess(msg) {
    authMessage.textContent = msg;
    authMessage.style.color = '#38a169';
}

function clearMessage() {
    authMessage.textContent = '';
}

function clearForms() {
    ['registerUsername', 'registerPassword', 'loginUsername', 'loginPassword'].forEach(id => {
        document.getElementById(id).value = '';
    });
}


// 启动
init();

