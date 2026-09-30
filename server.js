import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import mysql from 'mysql2/promise'; // 确保已运行 npm install mysql2

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // 托管 public 文件夹下的 admin.html 等

// 1. 数据库连接池配置
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS,     // 这里的密码在 .env 文件中设置
    database: process.env.DB_NAME || 'chihaya_ai',
    charset: 'utf8mb4',               // 强制使用 utf8mb4 编码修复乱码
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ================= 管理员 API 接口 =================

// 接口 A: 获取所有用户列表
app.get("/api/admin/users", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, username, role, created_at FROM users");
        res.json(rows);
    } catch (err) {
        console.error("查询用户失败:", err);
        res.status(500).json({ error: "数据库查询失败" });
    }
});

app.get("/api/admin/messages", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM messages ORDER BY created_at DESC"
        );
        res.json(rows);
    } catch (err) {
        console.error("获取记录失败:", err);
        res.status(500).json({ error: "无法获取聊天记录" });
    }
});
// 接口 B: 创建新用户 (你问的那段代码)
app.post("/api/admin/create-user", async (req, res) => {
    const { username, password, role } = req.body;
    try {
        // 使用参数化查询防止 SQL 注入和编码问题
        await pool.query(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            [username, password, role || 'user']
        );
        res.json({ success: true });
    } catch (err) {
        console.error("创建用户失败:", err);
        res.status(400).json({ error: "操作失败，可能是用户名已存在" });
    }
});

// 接口 C: 删除用户
app.delete("/api/admin/users/:id", async (req, res) => {
    try {
        const userId = req.params.id;
        await pool.query("DELETE FROM users WHERE id = ?", [userId]);
        res.json({ success: true });
    } catch (err) {
        console.error("删除用户失败:", err);
        res.status(500).json({ error: "删除失败" });
    }
});

// server.js 增加登录接口
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE username = ? AND password = ?",
            [username, password]
        );
        if (rows.length > 0) {
            res.json({ success: true, user: rows[0] });
        } else {
            res.status(401).json({ error: "用户名或密码错误" });
        }
    } catch (err) {
        res.status(500).json({ error: "服务器错误" });
    }
});
// ================= AI 聊天接口 =================

// server.js 修改后的聊天接口
app.post("/api/chat", async (req, res) => {
    const { messages, username } = req.body; // 注意：前端现在需要传 username
    const userMessage = messages[messages.length - 1].content;

    try {
        // 1. 保存用户问的问题到数据库
        await pool.query(
            "INSERT INTO messages (username, role, content) VALUES (?, 'user', ?)",
            [username, userMessage]
        );

        // 2. 调用 AI
        const response = await axios.post(
            `${process.env.AI_BASE_URL}/chat/completions`,
            {
                model: process.env.AI_MODEL,
                messages: messages,
                temperature: 0.7
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.AI_API_KEY}`
                },
                timeout: 30000
            }
        );

        const reply = response.data.choices?.[0]?.message?.content || "AI 无回复";

        // 3. 保存 AI 的回答到数据库
        await pool.query(
            "INSERT INTO messages (username, role, content) VALUES (?, 'bot', ?)",
            [username, reply]
        );

        res.json({ reply });

    } catch (err) {
        console.error("🔥 聊天记录保存或 AI 调用失败", err);
        res.status(500).json({ error: "AI 服务异常" });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    🚀 服务器已启动: http://localhost:${PORT}
    ⚙️ 管理后台地址: http://localhost:${PORT}/admin.html
    -------------------------------------------
    `);
});