require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT;

// 免 Key 免费机器翻译函数 (英译中)
async function translateToChinese(text) {
  if (!text) return '暂无描述';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
    const res = await axios.get(url);
    if (res.data && res.data[0]) {
      return res.data[0].map(item => item[0]).join('');
    }
    return text;
  } catch (err) {
    return text;
  }
}

// 1. 全面检索全球重大热点（时事政治、国际经贸、军事博弈、AI泡沫、前沿科技）
async function fetchHotGlobalNews() {
  // 涵盖用户要求的全方位领域
  const query = '(Russia Ukraine OR Iran Israel US OR AI bubble OR global economy OR international trade OR politics OR semiconductor OR aerospace OR robotics OR quantum)';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWS_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    return response.data.articles || [];
  } catch (error) {
    console.error('抓取热点新闻失败:', error.message);
    return [];
  }
}

// 2. 自动构建 3-5 分钟深度视频口播文案 HTML
async function formatDeepVideoEmail(articles) {
  const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });

  let htmlContent = `
    <div style="font-family: Microsoft YaHei, Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #222; line-height: 1.8;">
      <div style="background: linear-gradient(135deg, #1a73e8, #0d47a1); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <h1 style="margin: 0; font-size: 24px;">🌐 全球重大热点 - 3-5分钟视频口播深度日报</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;"><b>日期：</b>${today} | <b>核心覆盖：</b>时事政治 / 国际经贸 / 俄乌美伊 / AI与前沿科技</p>
      </div>
  `;

  for (let index = 0; index < articles.length; index++) {
    const art = articles[index];
    const sourceName = art.source.name || '权威国际媒体';
    
    // 免费翻译标题和内容
    const cnTitle = await translateToChinese(art.title);
    const cnDesc = await translateToChinese(art.description || '');

    htmlContent += `
      <div style="margin-bottom: 30px; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        <div style="background: #e8f0fe; padding: 12px 20px; font-weight: bold; color: #1967d2; display: flex; justify-content: space-between;">
          <span>📌 重大热点 ${index + 1} [预估视频时长：3 - 5 分钟]</span>
          <span>信息源：${sourceName}</span>
        </div>
        
        <div style="padding: 20px;">
          <h3 style="margin-top: 0; color: #1a73e8;">${cnTitle}</h3>
          <p style="color: #666; font-size: 13px; margin-bottom: 15px;"><b>英文原标题：</b>${art.title}</p>
          
          <!-- 3-5 分钟视频脚本区域 -->
          <div style="background: #f8f9fa; padding: 18px; border-left: 4px solid #1a73e8; border-radius: 4px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #155724;">🎬 3-5 分钟视频口播文案与结构拆解：</h4>
            
            <p style="margin: 6px 0;"><b>【00:00-00:30 黄金开场引子】</b><br/>
            <i>“大家好！今天我们来深度拆解一则影响全球格局的重磅新闻：${cnTitle}。据 ${sourceName} 最新消息，这一事件的最新进展正在引发多方连锁反应……”</i></p>

            <p style="margin: 6px 0;"><b>【00:30-02:30 事件核心脉络与前因后果】</b><br/>
            <i>“事件的具体经过是这样的：${cnDesc}。如果结合近期政治、经贸或前沿科技的发展背景来看，这一现象绝非偶然，其背后凸显了当前相关行业与地缘博弈的深刻矛盾……”</i></p>

            <p style="margin: 6px 0;"><b>【02:30-04:00 利益博弈、经济与科技影响分析】</b><br/>
            <i>“从深层次来看，这一事件不仅会直接冲击相关的经贸与科技产业链，还可能对资本市场、国际关系产生深远震荡。无论是对于行业投资者还是关注国际趋势的普通人来说，后续趋势都极其关键……”</i></p>

            <p style="margin: 6px 0;"><b>【04:00-05:00 总结展望与评论区互动】</b><br/>
            <i>“针对这一重大动态，你认为未来的发展走向会如何？欢迎在评论区留下你的看法！关注我，每天带你用 3-5 分钟透视全球最前沿的重磅热点。”</i></p>
          </div>

          <p style="font-size: 12px; margin-top: 10px;">
            <a href="${art.url}" target="_blank" style="color: #1a73e8; text-decoration: none;">🔗 点击阅读英文原文链接</a>
          </p>
        </div>
      </div>
    `;
  }

  htmlContent += `</div>`;
  return htmlContent;
}

// 3. 发送邮件
async function sendEmail(htmlContent) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD }
  });

  await transporter.sendMail({
    from: `"全球新闻视频编导" <${EMAIL_USER}>`,
    to: EMAIL_RECIPIENT,
    subject: `【全球重大热点日报】${new Date().toLocaleDateString('zh-CN')} 3-5分钟视频深度文案`,
    html: htmlContent
  });

  console.log('✅ 全球重大热点中文视频脚本已成功发往邮箱！');
}

async function main() {
  console.log('🚀 正在检索全球重大热点（时政/经贸/俄乌美伊/AI/前沿科技）...');
  const articles = await fetchHotGlobalNews();
  if (articles.length === 0) return;

  console.log('🌐 正在进行中文翻译与 3-5 分钟口播文案构建...');
  const emailHtml = await formatDeepVideoEmail(articles);
  await sendEmail(emailHtml);
}

main().catch(console.error);
