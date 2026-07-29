require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT;

// 1. 抓取全球重大新闻
async function fetchTopNews() {
  const categories = ['politics', 'economy', 'military', 'technology', 'science'];
  const query = 'AI OR robot OR aerospace OR science OR military OR economy OR politics';
  
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWS_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    return response.data.articles || [];
  } catch (error) {
    console.error('获取新闻失败:', error.message);
    return [];
  }
}

// 2. 格式化新闻为 HTML 中英文报告
function formatNewsEmail(articles) {
  let htmlContent = `
    <h2 style="color: #1a73e8;">🌐 全球重大新闻每日简报 (Global Daily News)</h2>
    <p><b>发送时间：</b>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
    <hr/>
  `;

  articles.forEach((art, index) => {
    htmlContent += `
      <div style="margin-bottom: 20px; padding: 10px; border-left: 4px solid #1a73e8; background: #f8f9fa;">
        <h3>${index + 1}. [${art.source.name || 'General'}] ${art.title}</h3>
        <p><b>【内容提要】</b> ${art.description || '暂无详细摘要'}</p>
        <p><b>【信息源】</b> <a href="${art.url}" target="_blank">${art.source.name} 详情链接</a></p>
      </div>
    `;
  });

  return htmlContent;
}

// 3. 发送邮件
async function sendEmail(htmlContent) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD, // Gmail 专用应用密码
    },
  });

  await transporter.sendMail({
    from: `"全球新闻日报" <${EMAIL_USER}>`,
    to: EMAIL_RECIPIENT,
    subject: `【全球新闻简报】${new Date().toLocaleDateString('zh-CN')} - TOP 10`,
    html: htmlContent,
  });

  console.log('✅ 新闻简报已成功发送至邮箱！');
}

// 主运行逻辑
async function main() {
  console.log('🚀 开始获取最新新闻...');
  const articles = await fetchTopNews();
  if (articles.length === 0) {
    console.log('⚠️ 未获取到新闻，流程结束。');
    return;
  }
  
  console.log('📧 正在生成 HTML 简报并发送邮件...');
  const emailHtml = formatNewsEmail(articles);
  await sendEmail(emailHtml);
}

main().catch(console.error);
