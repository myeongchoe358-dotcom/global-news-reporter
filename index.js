require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');
const Pipeline = require('./src/pipeline'); // 引入 Pipeline 类

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT;

// 1. 获取全球重大热点
async function fetchHotGlobalNews() {
  const query = '(Russia Ukraine OR Iran Israel US OR AI bubble OR global economy OR international trade OR semiconductor OR aerospace OR robotics OR quantum)';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${NEWS_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    return response.data.articles || [];
  } catch (error) {
    console.error('抓取热点新闻失败:', error.response?.data?.message || error.message);
    return [];
  }
}

// 2. Markdown 格式脚本转化为邮件 HTML
function convertScriptToHtml(rawScript) {
  if (!rawScript) return '<p>脚本生成失败</p>';
  return rawScript
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/```/g, '');
}

// 3. 构建邮件内容
async function formatDeepVideoEmail(articles) {
  const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
  const pipeline = new Pipeline({
    apiKey: process.env.LLM_API_KEYZHIPUAI || process.env.LLM_API_KEY,
    apiBase: '[https://open.bigmodel.cn/api/paas/v4](https://open.bigmodel.cn/api/paas/v4)',
    model: 'glm-4-flash'
  });

  let htmlContent = `
  <div style="font-family: Microsoft YaHei, Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #222; line-height: 1.8;">
    <div style="background: linear-gradient(135deg, #111827, #1e3a8a); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
      <h1 style="margin: 0; font-size: 24px;">🎬 AI 实时生成 - 5-8分钟深度视频分镜脚本</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;"><b>日期：</b>${today} | <b>标准：</b>闭环逻辑 / 完整事实 / 双语提示词（即梦+ComfyUI）</p>
    </div>
  `;

  for (let index = 0; index < articles.length; index++) {
    const art = articles[index];
    const sourceName = art.source?.name || '权威国际媒体';
    console.log(`[${index + 1}/${articles.length}] 正在调用 LLM API 生成脚本: ${art.title}`);
    
    let generatedScript = '';
    try {
      generatedScript = await pipeline.generateScript({
        title: art.title,
        content: art.description || art.content || ''
      });
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message;
      console.error(`新闻 ${index + 1} 脚本生成失败:`, errMsg);
      generatedScript = `⚠️ AI 生成失败，请检查 API Key 额度或网络：${errMsg}`;
    }

    const formattedScriptHtml = convertScriptToHtml(generatedScript);

    htmlContent += `
    <div style="margin-bottom: 40px; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; background: #fff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: #1e40af; color: white; padding: 15px 20px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 16px;">📹 深度专题 ${index + 1} [AI 导演定制分镜]</span>
        <span style="font-size: 12px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">来源：${sourceName}</span>
      </div>
      <div style="padding: 24px;">
        <h2 style="margin-top: 0; color: #1e293b; font-size: 20px;">${art.title}</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px;">
          ${formattedScriptHtml}
        </div>
        <p style="font-size: 12px; margin-top: 15px; text-align: right;">
          <a href="${art.url}" target="_blank" style="color: #2563eb; text-decoration: none;">🔗 查阅 ${sourceName} 原始新闻出处 →</a>
        </p>
      </div>
    </div>
    `;
  }

  htmlContent += `</div>`;
  return htmlContent;
}

// 4. 发送邮件
async function sendEmail(htmlContent) {
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: `"AI 视频导演" <${EMAIL_USER}>`,
    to: EMAIL_RECIPIENT,
    subject: `【AI 深度闭环脚本】${new Date().toLocaleDateString('zh-CN')} 全球热点特辑`,
    html: htmlContent
  });

  console.log('✅ AI 实时生成的闭环分镜脚本已成功发送至邮箱！');
}

async function main() {
  console.log('🚀 开始抓取热点新闻...');
  const articles = await fetchHotGlobalNews();
  if (articles.length === 0) {
    console.log('⚠️ 未抓取到热点新闻，任务结束。');
    return;
  }
  
  console.log('🤖 正在调用大模型生成动态脚本并组织邮件...');
  const emailHtml = await formatDeepVideoEmail(articles);
  await sendEmail(emailHtml);
}

main().catch(console.error);
