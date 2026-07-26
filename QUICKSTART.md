# 全球新闻日报系统 - 快速开始指南

## 📋 前置条件

- Node.js 18+ 
- npm 或 yarn
- NewsAPI API Key（免费在 https://newsapi.org 注册）
- Gmail 账户（用于发送邮件）

## 🚀 安装步骤

### 第1步：克隆仓库

```bash
git clone https://github.com/myeongchoe358-dotcom/global-news-reporter.git
cd global-news-reporter
```

### 第2步：安装依赖

```bash
npm install
```

### 第3步：配置环境变量

#### 3.1 获取 NewsAPI Key
1. 访问 https://newsapi.org
2. 注册免费账户
3. 复制你的 API Key

#### 3.2 配置 Gmail
对于 Gmail，你需要使用 **应用专用密码** 而不是常规密码：

1. 进入 Google 账户设置：https://myaccount.google.com/
2. 左侧菜单 → 安全
3. 启用 **两步验证**（如果尚未启用）
4. 在安全设置中找到 **应用专用密码**
5. 选择"邮件"和"Windows 计算机"
6. 生成密码并复制

#### 3.3 创建 .env 文件

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 新闻API
NEWS_API_KEY=your_newsapi_key_here

# 邮件配置
EMAIL_USER=myeongchoe358@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_RECIPIENT=myeongchoe358@gmail.com

# 系统配置
NEWS_COUNT=10
TIMEZONE=Asia/Shanghai
```

### 第4步：本地测试

#### 测试新闻获取
```bash
npm run fetch-news
```

#### 测试新闻格式化
```bash
npm run format-news
```

#### 测试完整流程（不发送邮件）
```bash
npm run run-pipeline -- --no-email
```

#### 测试邮件发送
```bash
node src/email-sender.js
```

#### 运行完整流程（包括发送邮件）
```bash
npm run run-pipeline
```

## 🔄 部署到 GitHub Actions

### 步骤1：推送代码到 GitHub

```bash
git add .
git commit -m "Initial commit: Global News Reporter System"
git push origin main
```

### 步骤2：配置 GitHub Secrets

1. 进入你的 GitHub 仓库
2. Settings → Secrets and variables → Actions
3. 添加以下 Secrets：

| Secret Name | 值 |
|---|---|
| `NEWS_API_KEY` | 你的 NewsAPI Key |
| `EMAIL_USER` | myeongchoe358@gmail.com |
| `EMAIL_PASSWORD` | Gmail 应用专用密码 |
| `EMAIL_RECIPIENT` | myeongchoe358@gmail.com |

### 步骤3：启用 Actions

1. 进入仓库的 Actions 标签页
2. 点击 "I understand my workflows, go ahead and enable them"
3. 选择 "Daily Global News Reporter" 工作流

### 步骤4：测试工作流

1. 进入 Actions 页面
2. 选择 "Daily Global News Reporter" 工作流
3. 点击 "Run workflow" 按钮
4. 选择 main 分支
5. 点击 "Run workflow"

## 📅 日程设置

工作流被设置为：
- ⏰ **每天 UTC 04:00** 自动运行（北京时间 **中午 12:00**）
- 🖱️ 也可以手动在 Actions 页面触发

如需修改时间，编辑 `.github/workflows/daily-news.yml`：

```yaml
schedule:
  - cron: '0 4 * * *'  # 改为你想要的时间
```

Cron 格式说明：
```
┌────────────── 分钟 (0-59)
│ ┌──────────── 小时 (0-23)
│ │ ┌────────── 日 (1-31)
│ │ │ ┌──────── 月 (1-12)
│ │ │ │ ┌────── 周几 (0-6, 0=Sunday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

## 📧 验证邮件接收

1. 第一次运行后，检查你的邮箱
2. 可能需要检查垃圾邮件文件夹
3. 如未收到，检查 GitHub Actions 的运行日志

## 🐛 故障排查

### 问题1：邮件未发送

**症状**：工作流成功但没有收到邮件

**解决方案**：
- 确认 `.env` 中的邮箱地址正确
- 检查 Gmail 应用专用密码是否正确
- 查看 GitHub Actions 日志中的错误信息
- 确认 Gmail 账户已启用两步验证

### 问题2：新闻数量不足

**症状**：只收到少于10条新闻

**解决方案**：
- 检查 NEWS_API_KEY 是否有效
- 确认 API 配额没有用尽（NewsAPI 免费额度：100/天）
- 检查网络连接
- 查看详细日志：`npm run fetch-news`

### 问题3：工作流超时

**症状**：GitHub Actions 工作流超时

**解决方案**：
- 减少搜索关键词数量
- 减少新闻数量（NEWS_COUNT）
- 检查网络连接
- 增加超时时间（在 workflow 文件中）

### 问题4：API 错误

**症状**：看到 401 或 403 错误

**解决方案**：
- 检查 API Key 是否正确
- 确认 API Key 有效且未过期
- 检查 API 配额

## 📊 查看输出

### 查看报告文件

工作流运行后，可以在 Actions 页面下载：
- `news-report-*.json` - JSON 格式报告
- `news-report-*.html` - HTML 格式报告
- `news-report-*.txt` - 纯文本格式报告
- `execution-logs-*.log` - 执行日志

### 查看邮件中的报告

邮件包含：
- 🏛️ 10条排序后的新闻
- 📝 中英双语摘要
- 🔗 原始链接
- 📊 重要度评分

## 🎥 视频内容优化

每条新闻优化后的摘要包含：
- **关键要点** - 便于视频脚本编写
- **字数控制** - 3-5分钟视频时长
- **结构清晰** - 问题→背景→影响→前景

## 🔒 安全提示

1. **永远不要提交 `.env` 文件** - 已在 `.gitignore` 中
2. **使用 GitHub Secrets** 存储敏感信息
3. **定期更换 Gmail 应用密码**
4. **定期检查 API Key 使用情况**

## 📚 更多资源

- [NewsAPI 文档](https://newsapi.org/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cron 表达式生成器](https://crontab.guru/)
- [Google App Passwords](https://support.google.com/accounts/answer/185833)

## 📞 支持

如有问题，请：
1. 检查 GitHub Actions 日志
2. 查看 `logs/` 目录中的详细日志
3. 提交 Issue 到仓库

## 📝 许可证

MIT License

---

**祝你使用愉快！** 📰✨
