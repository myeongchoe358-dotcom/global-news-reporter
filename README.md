# 全球重大时政新闻日报系统
Global Major News Daily Report System

## 功能描述
自动搜集全球重大时政新闻，每天中午12点发送至指定邮箱。
- 📰 每天20条重大新闻
- 🌍 多个类别覆盖（政治、经济、军事、科技、AI、机器人、航空航天、基础科学、社会学等）
- 📊 按重要度自动排序
- 🌐 中英双语格式
- 🎥 优化用于5-8分钟视频内容制作
- ⏰ 每天中午12点自动发送

## 系统架构

```
┌─────────────────────────────────────────┐
│   GitHub Actions (Daily at 12:00 UTC)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  news-fetcher.js                        │
│  - 调用多个新闻API                      │
│  - 过滤关键词和类别                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  news-ranker.js                         │
│  - 根据关键词权重评分                   │
│  - 按重要度排序TOP 10                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  news-formatter.js                      │
│  - 生成中英双语格式                     │
│  - 优化视频内容长度                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  email-sender.js                        │
│  - 发送至指定邮箱                       │
└─────────────────────────────────────────┘
```

## 快速开始

### 1. 环境配置

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```
# 新闻API
NEWS_API_KEY=your_newsapi_key
GOOGLE_NEWS_API_KEY=your_google_news_key

# 邮件配置
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_RECIPIENT=myeongchoe358@gmail.com

# 系统配置
NEWS_COUNT=10
TIMEZONE=Asia/Shanghai
```

### 3. 本地测试

```bash
npm run test
npm run fetch-news
npm run format-news
npm run send-email
```

### 4. 部署至 GitHub Actions

工作流已配置在 `.github/workflows/daily-news.yml`，将自动：
- ⏰ 每天 UTC 4:00 运行（对应北京时间中午12:00）
- 📨 自动获取、格式化并发送新闻

## 文件结构

```
global-news-reporter/
├── .github/workflows/
│   └── daily-news.yml          # GitHub Actions 工作流
├── src/
│   ├── news-fetcher.js         # 新闻采集模块
│   ├── news-ranker.js          # 新闻排序模块
│   ├── news-formatter.js       # 新闻格式化模块
│   ├── email-sender.js         # 邮件发送模块
│   ├── config.js               # 配置文件
│   └── categories.js           # 类别和关键词配置
├── templates/
│   ├── email-template.html     # HTML邮件模板
│   └── email-template.txt      # 文本邮件模板
├── tests/
│   ├── test-fetcher.js
│   ├── test-ranker.js
│   └── test-formatter.js
├── logs/
│   └── .gitkeep
├── package.json
├── .env.example
└── README.md
```

## 新闻类别

系统监测以下类别的新闻：
- 🏛️ **政治** (Politics)
- 💰 **经济** (Economics)
- ⚔️ **军事** (Military)
- 💻 **科技** (Technology)
- 🤖 **AI与机器学习** (AI & Machine Learning)
- 🦾 **机器人** (Robotics)
- 🚀 **航空航天** (Aerospace)
- 🔬 **基础科学** (Basic Science)
- 👥 **社会学** (Sociology)

## 新闻排序算法

系统基于以下因素计算新闻重要度：
1. **关键词权重** (35%) - 涉及的关键领导人、机构
2. **新闻源权重** (25%) - BBC、Reuters、AP等权威媒体
3. **发布时间** (20%) - 最新新闻优先
4. **参与国家/地区数** (15%) - 国际影响力
5. **相关报道数** (5%) - 被多家媒体报道

## 邮件格式示例

```
【全球重大时政新闻日报】
Global Major News Daily Report

2026年7月26日 | July 26, 2026

═══════════════════════════════════════════

🏛️ NO.1 - 政治 | Politics
标题：中国与美国就贸易协议达成初步共识
Title: China and US Reach Preliminary Consensus on Trade Agreement

内容提要：
两国代表在北京进行为期三天的谈判后，就知识产权保护和市场准入问题达成了初步共识...
Summary:
After three days of negotiations in Beijing, representatives of both countries reached preliminary consensus on intellectual property protection and market access...

信息源：新华社、BBC、路透社
Sources: Xinhua News Agency, BBC, Reuters

─────────────────────────────────────────

🚀 NO.2 - 航空航天 | Aerospace
[类似格式...]

═══════════════════════════════════════════
```

## 视频内容优化

每条新闻的摘要设计为5-8分钟视频内容：
- ✅ 内容完整：无字数上限限制，优先保证新闻起因、背景、影响与前景的完整表达
- ✅ 结构清晰：问题→背景→影响→前景
- ✅ 易于配图：分镜标注明确，方便后续视频剪辑与画面匹配
- ✅ 吸引眼球：突出最新动态和转折点

## 故障排查

### 邮件未发送
- 检查 `.env` 配置是否正确
- 对于 Gmail：需要使用 [应用专用密码](https://myaccount.google.com/apppasswords)
- 检查日志：`tail -f logs/daily-news.log`

### 新闻数量不足
- 检查 NEWS_API_KEY 是否有效
- 增加搜索关键词的数量
- 查看 GitHub Actions 运行日志

### 发送时间不准确
- 确认 TIMEZONE 设置正确
- GitHub Actions 服务器使用 UTC 时区
- 北京时间 12:00 = UTC 04:00

## API 获取

### NewsAPI (newsapi.org)
- 免费额度：每天 100 请求
- 覆盖 150+ 国家的新闻源

### Google News API（备选）
- 需要 Google Cloud 账户
- 更新频率高

## 许可证

MIT License

## 支持

如有问题，请提交 Issue 或联系：myeongchoe358@gmail.com
