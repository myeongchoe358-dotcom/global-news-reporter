require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT;

// 1. 获取全球重大新闻
async function fetchTopNews() {
  const query = 'politics OR economy OR military OR AI OR technology OR aerospace OR science';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWS_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    return response.data.articles || [];
  } catch (error) {
    console.error('获取新闻失败:', error.message);
    return [];
  }
}

// 2. 生成适合 3-5 分钟视频口播的 HTML 邮件简报
function formatNewsEmail(articles) {
  const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });

  let htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333; line-height: 1.6;">
      <h1 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">
        🎬 全球时政与科技日报（视频口播版）
      </h1>
      <p style="color: #666; font-size: 14px;"><b>发送时间：</b>${today} | <b>预估口播时长：</b>3 - 5 分钟</p>
      
      <div style="background-color: #e8f0fe; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
        <h3 style="margin-top: 0; color: #1967d2;">📌 视频开场白示例 (Video Intro Script)</h3>
        <p style="margin-bottom: 0;"><i>“大家好，欢迎来到今天的全球重大新闻解读！今天我们将用 3 到 5 分钟的时间，快速盘点全球在政治、经济、军事、人工智能以及前沿科技领域的 10 大核心动态。让我们直接看第一条新闻——”</i></p>
      </div>

      <h2>📰 10 大重点新闻口播拆解</h2>
  `;

  articles.forEach((art, index) => {
    const sourceName = art.source.name || '权威媒体';
    const title = art.title;
    const desc = art.description || '暂无详细描述';

    htmlContent += `
      <div style="margin-bottom: 25px; padding: 15px; border-left: 4px solid #1a73e8; background: #f8f9fa; border-radius: 0 8px 8px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="background-color: #1a73e8; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            新闻 ${index + 1}
          </span>
          <span style="font-size: 12px; color: #777;">来源: ${sourceName}</span>
        </div>

        <h3 style="margin: 8px 0; color: #202124;">${title}</h3>

        <div style="margin-top: 10px; font-size: 14px; color: #444;">
          <p style="margin: 4px 0;"><b>【英文提要】</b> ${desc}</p>
          <p style="margin: 4px 0; color: #0d652d;"><b>【中文摘要/视频口播点】</b> ${desc}（此条新闻反映了当前 ${sourceName} 关注的核心焦点，适合在视频第 ${Math.floor(index * 25 + 15)} 秒处播报）。</p>
        </div>

        <div style="margin-top: 8px; font-size: 12px;">
          <a href="${art.url}" target="_blank" style="color: #1a73e8; text-decoration: none;">🔗 阅读英文原文链接</a>
        </div>
      </div>
    `;
  });

  htmlContent += `
      <div style="background-color: #f1f3f4; padding: 15px; border-radius: 8px; margin-top: 30px;">
        <h3 style="margin-top: 0; color: #3c4043;">🎬 视频结束语 (Video Outro Script)</h3>
        <p style="margin-bottom: 0;"><i>“以上就是今天全球新闻的全部重点内容。关注我们，每天 3 分钟，带你掌握全球前沿脉搏！我们明天见。”</i></p>
      </div>
    </div>
  `;

  return htmlContent;
}

// 3. 发送邮件
async function sendEmail(htmlContent) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"全球新闻记者" <${EMAIL_USER}>`,
    to: EMAIL_RECIPIENT,
    subject: `【全球新闻视频日报】${new Date().toLocaleDateString('zh-CN')} - TOP 10 提炼版`,
    html: htmlContent,
  });

  console.log('✅ 视频口播版新闻简报已成功发送！');
}

async function main() {
  console.log('🚀 抓取最新全球新闻中...');
  const articles = await fetchTopNews();
  if (articles.length === 0) return;
  
  console.log('📧 正在生成视频口播格式并发送邮件...');
  const emailHtml = formatNewsEmail(articles);
  await sendEmail(emailHtml);
}

main().catch(console.error);
