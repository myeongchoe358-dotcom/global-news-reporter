require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_RECIPIENT = process.env.EMAIL_RECIPIENT;

// 免费机器翻译（英译中）
async function translateToChinese(text) {
  if (!text) return '';
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

// 1. 获取全球重大热点
async function fetchHotGlobalNews() {
  const query = '(Russia Ukraine OR Iran Israel US OR AI bubble OR global economy OR international trade OR semiconductor OR aerospace OR robotics OR quantum)';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWS_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    return response.data.articles || [];
  } catch (error) {
    console.error('抓取热点新闻失败:', error.message);
    return [];
  }
}

// 2. 构建连贯无断层的 5-8 分钟分镜视频脚本 HTML
async function formatDeepVideoEmail(articles) {
  const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });

  let htmlContent = `
    <div style="font-family: Microsoft YaHei, Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #222; line-height: 1.8;">
      <div style="background: linear-gradient(135deg, #111827, #1e3a8a); color: white; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <h1 style="margin: 0; font-size: 24px;">🎬 全球重大热点 - 5-8分钟深度视频分镜脚本</h1>
        <p style="margin: 8px 0 0 0; opacity: 0.9;"><b>日期：</b>${today} | <b>标准：</b>逻辑连贯 / 完整分镜 / 1500字+逐字稿结构</p>
      </div>
  `;

  for (let index = 0; index < articles.length; index++) {
    const art = articles[index];
    const sourceName = art.source.name || '权威国际媒体';
    
    const cnTitle = await translateToChinese(art.title);
    const cnDesc = await translateToChinese(art.description || '');

    htmlContent += `
      <div style="margin-bottom: 40px; border: 1px solid #d1d5db; border-radius: 10px; overflow: hidden; background: #fff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background: #1e40af; color: white; padding: 15px 20px; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 16px;">📹 深度专题 ${index + 1} [预估时长：5 - 8 分钟]</span>
          <span style="font-size: 12px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px;">来源：${sourceName}</span>
        </div>
        
        <div style="padding: 24px;">
          <h2 style="margin-top: 0; color: #1e293b; font-size: 20px;">${cnTitle}</h2>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;"><b>英文原标题：</b>${art.title}</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <h3 style="margin-top: 0; color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; font-size: 16px;">
              🎬 5-8 分钟连贯分镜脚本（含画面提示与口播逐字稿）
            </h3>

            <!-- 分镜 1 -->
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px stroke #e2e8f0;">
              <p style="margin: 0; color: #2563eb; font-weight: bold;">【分镜 1 | 00:00-00:45】黄金悬念开场（抛出核心矛盾）</p>
              <p style="margin: 4px 0; font-size: 13px; color: #475569;"><b>🎥 建议画面：</b>快节奏剪辑——国际新闻头条、局势地图变动、股市或战场高空俯瞰镜头，配合紧张悬疑音效。</p>
              <p style="margin: 6px 0 0 0; color: #1e293b; background: #fff; padding: 10px; border-radius: 4px; border-left: 3px solid #2563eb;">
                <b>🎙️ 旁白台词：</b>“你敢相信吗？就在最近，全球关注的焦点再次发生巨震。据 ${sourceName} 发出的最新消息，${cnTitle}。这件事刚一曝光，就迅速在国际舆论场引发了轩然大波。很多人可能会觉得这只是一起偶发的普通事件，但如果我们把视角拉远，就会发现这其实是一场酝酿已久的巨大棋局……”
              </p>
            </div>

            <!-- 分镜 2 -->
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px stroke #e2e8f0;">
              <p style="margin: 0; color: #2563eb; font-weight: bold;">【分镜 2 | 00:45-02:30】事件还原与核心细节（上下文衔接）</p>
              <p style="margin: 4px 0; font-size: 13px; color: #475569;"><b>🎥 建议画面：</b>展示 ${sourceName} 现场报道截图、事件发生地的实景画面、关键人物发言特写与历史档案资料。</p>
              <p style="margin: 6px 0 0 0; color: #1e293b; background: #fff; padding: 10px; border-radius: 4px; border-left: 3px solid #2563eb;">
                <b>🎙️ 旁白台词：</b>“顺着这个线索，我们来详细还原一下整件事情的来龙去脉：${cnDesc}。顺着这一脉络来看，事情的发展并非毫无征兆。在此之前，各方在相关领域就已经展开了密集的暗中角力，而这次事件的爆发，彻底把原本隐秘的矛盾推到了台面上……”
              </p>
            </div>

            <!-- 分镜 3 -->
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px stroke #e2e8f0;">
              <p style="margin: 0; color: #2563eb; font-weight: bold;">【分镜 3 | 02:30-05:00】深度剖析：多方博弈与利益纠葛（逻辑递进）</p>
              <p style="margin: 4px 0; font-size: 13px; color: #475569;"><b>🎥 建议画面：</b>动画架构图拆解多方利益链条、地缘政治示意图、相关产业与资本市场的动态K线图变化。</p>
              <p style="margin: 6px 0 0 0; color: #1e293b; background: #fff; padding: 10px; border-radius: 4px; border-left: 3px solid #2563eb;">
                <b>🎙️ 旁白台词：</b>“明白了事件的前因后果，我们再来看最核心的矛盾：为什么多方在这个节点上互不相让？从大国博弈与产业格局的角度来看，这涉及到了供应链安全、技术主导权以及地缘影响力的重新划分。一方希望借此打破现有僵局，而另一方则试图筑高防御壁垒，双方的每一次招式往来，都在牵动着整个产业链的神经……”
              </p>
            </div>

            <!-- 分镜 4 -->
            <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px stroke #e2e8f0;">
              <p style="margin: 0; color: #2563eb; font-weight: bold;">【分镜 4 | 05:00-06:45】连锁反应：对经济、科技与普通人的影响（承接上文）</p>
              <p style="margin: 4px 0; font-size: 13px; color: #475569;"><b>🎥 建议画面：</b>超市货架、能源运输船、科技实验室或普通民众生活场景，配合图表展示通胀、油价或产业趋势变动。</p>
              <p style="margin: 6px 0 0 0; color: #1e293b; background: #fff; padding: 10px; border-radius: 4px; border-left: 3px solid #2563eb;">
                <b>🎙️ 旁白台词：</b>“那么，这场宏大的博弈到底会怎样落到我们每个人的现实生活中？首先，最直观的震荡将表现在资本市场和国际经贸流动上。不管是大宗商品的价格波动，还是前沿科技领域的投资收紧，最终都会通过全球化这根纽带，传递到产业链的每一个末梢，影响到未来的就业与市场预期……”
              </p>
            </div>

            <!-- 分镜 5 -->
            <div style="margin-bottom: 10px;">
              <p style="margin: 0; color: #2563eb; font-weight: bold;">【分镜 5 | 06:45-08:00】趋势展望与升华总结（收尾互动）</p>
              <p style="margin: 4px 0; font-size: 13px; color: #475569;"><b>🎥 建议画面：</b>主持人出镜或具有未来感的大气风光镜头，屏幕出现讨论话题框与关注提示文字。</p>
              <p style="margin: 6px 0 0 0; color: #1e293b; background: #fff; padding: 10px; border-radius: 4px; border-left: 3px solid #2563eb;">
                <b>🎙️ 旁白台词：</b>“综合来看，${cnTitle} 绝对不仅仅是一条简单的国际新闻，它是当前全球格局大调整期的一个缩影。随着后续更多细节的披露，这场博弈大概率还会迎来新的转折。针对这件事，你持什么态度？你觉得接下来的局势会如何发展？欢迎在评论区留下你的看法！关注我，每天带你透视全球最深度的重磅动态。”
              </p>
            </div>

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

// 3. 发送邮件
async function sendEmail(htmlContent) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASSWORD }
  });

  await transporter.sendMail({
    from: `"5-8分钟视频编导" <${EMAIL_USER}>`,
    to: EMAIL_RECIPIENT,
    subject: `【5-8分钟连贯视频脚本】${new Date().toLocaleDateString('zh-CN')} 全球重磅热点特辑`,
    html: htmlContent
  });

  console.log('✅ 5-8 分钟连贯分镜视频脚本已成功发送！');
}

async function main() {
  console.log('🚀 开始检索全球重磅热点...');
  const articles = await fetchHotGlobalNews();
  if (articles.length === 0) return;

  console.log('🌐 正在构建连贯无断层的 5-8 分钟视频分镜脚本...');
  const emailHtml = await formatDeepVideoEmail(articles);
  await sendEmail(emailHtml);
}

main().catch(console.error);
