# JI AI Agent - Frontend

> AI 恋爱大师 & AI 超级智能体 React 前端应用

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| TailwindCSS | 3.x | 样式框架 |
| Zustand | 5.x | 状态管理 |
| React Query | 5.x | 服务端状态 |
| React Router | 6.x | 路由管理 |
| Axios | 1.x | HTTP 客户端 |
| @tanstack/react-virtual | 3.x | 虚拟滚动 |
| react-markdown | 9.x | Markdown 渲染 |
| react-syntax-highlighter | 15.x | 代码高亮 |

## 快速开始

### 前置条件

- Node.js >= 18
- npm >= 9
- 后端服务运行在 `http://localhost:8080`

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
# 访问 http://localhost:3000
```

### 生产构建

```bash
npm run build
npm run preview
```

## 项目结构

```
src/
├── components/          # 通用 UI 组件
│   ├── AppCard.tsx      # 首页应用卡片
│   ├── ChatInput.tsx    # 自动扩展高度输入框
│   ├── ChatMessage.tsx  # 消息气泡（支持流式光标）
│   ├── ChatRoom.tsx     # 聊天室容器（虚拟滚动）
│   ├── CodeBlock.tsx    # 代码高亮块（含复制按钮）
│   ├── LoadingAnimation.tsx  # 加载动画
│   ├── Markdown.tsx     # Markdown 渲染
│   ├── Sidebar.tsx      # 会话列表侧边栏
│   ├── ThemeToggle.tsx  # 主题切换按钮
│   ├── ToolCallPanel.tsx # 工具调用可视化面板
│   └── TopBar.tsx       # 顶部导航栏
├── hooks/               # 自定义 React Hooks
│   ├── useChat.ts       # 核心聊天逻辑（SSE + 状态管理）
│   ├── useLocalStorage.ts
│   ├── useSSE.ts        # SSE 连接生命周期管理
│   ├── useSessions.ts   # 会话 CRUD
│   └── useTheme.ts      # 深色/浅色/系统主题
├── pages/               # 页面组件（懒加载）
│   ├── HomePage.tsx     # 首页
│   ├── LoveAppPage.tsx  # 恋爱大师
│   ├── ManusAppPage.tsx # 超级智能体
│   └── NotFoundPage.tsx # 404
├── router/index.tsx     # 路由配置
├── services/            # API 服务
│   ├── api.ts           # Axios 实例 + 拦截器
│   ├── loveAppService.ts
│   └── manusService.ts
├── stores/              # Zustand 状态
│   ├── appStore.ts      # 主题、侧边栏
│   ├── chatStore.ts     # 消息流、加载状态
│   └── sessionStore.ts  # 会话列表（持久化）
├── types/               # TypeScript 类型定义
│   ├── api.ts
│   ├── index.ts
│   └── sse.ts
└── utils/               # 工具函数
    ├── format.ts        # 时间、文本格式化
    ├── markdown.ts      # Markdown 工具
    ├── sse.ts           # SSEManager 类
    ├── storage.ts       # localStorage 工具
    ├── uuid.ts          # UUID 生成
    └── validate.ts      # 输入验证
```

## API 接口

### AI 恋爱大师

```
GET /api/ai/love_app/chat/sse?message={message}&sessionId={sessionId}
Response: text/event-stream (纯文本逐字流)
```

### AI 超级智能体

```
GET /api/ai/manus/chat?message={message}
Response: text/event-stream (JSON 事件流)

事件类型:
  {"type": "thinking", "content": "..."}
  {"type": "tool_call", "toolName": "...", "status": "running", "args": {...}}
  {"type": "tool_result", "toolName": "...", "result": "..."}
  {"type": "final_response", "content": "..."}
  {"type": "error", "error": "..."}
```

## 核心功能

- **SSE 实时流式输出**：逐字显示 AI 回复，支持停止生成
- **多会话管理**：创建/切换/删除/重命名会话，localStorage 持久化
- **虚拟滚动**：1000+ 消息无卡顿（@tanstack/react-virtual）
- **Markdown 渲染**：表格、代码块、引用、GFM 语法全支持
- **代码高亮**：支持 100+ 语言，深色/浅色主题，一键复制
- **工具调用面板**：Manus 智能体工具调用状态实时可视化
- **深色模式**：light/dark/system 三档切换，localStorage 持久化
- **响应式设计**：移动端/平板/桌面端自适应
- **错误处理**：SSE 自动重连（最多 3 次），toast 错误提示
- **键盘快捷键**：Enter 发送，Shift+Enter 换行，Escape 清空

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE_URL` | `http://localhost:8080` | 后端地址（生产环境） |
| `VITE_APP_TITLE` | `JI AI Agent` | 应用标题 |

> 开发环境 API 请求通过 Vite proxy 转发到 `http://localhost:8080`，无需修改。
