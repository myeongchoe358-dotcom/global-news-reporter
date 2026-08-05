const https = require('https');
const { URL } = require('url');

/**
 * 全球新闻自动报导流水线 (Pipeline Orchestrator)
 */
class Pipeline {
  constructor(config = {}) {
    this.config = config;
    // 智谱 API Key
    this.apiKey = config.apiKey || process.env.ZHIPU_API_KEY || process.env.LLM_API_KEY;
    
    // 智谱 OpenAI 兼容端点与默认模型
    let rawBase = (config.apiBase || process.env.LLM_API_BASE || 'https://open.bigmodel.cn/api/paas/v4').trim();
    const urlMatch = rawBase.match(/https?:\/\/[^\s\]\)]+/);
    if (urlMatch) {
      rawBase = urlMatch[0];
    }

    this.apiBase = rawBase.replace(/\/+$/, '');
    // 智谱推荐通用模型，如 glm-4 或 glm-4-flash
    this.model = config.model || process.env.LLM_MODEL || 'glm-4';
  }

  /**
   * 构建结构化区块强约束 Prompt（通用版：适配任意新闻类别）
   */
  buildStoryboardPrompt(newsArticle) {
    const sourceName = newsArticle.source?.name || newsArticle.source || '权威国际媒体';

    return `
你是一名顶级纪录片总导演与国际新闻首席解说员。请根据以下【新闻原文】，撰写一份专为 5-8 分钟深度视频设计的导演级分镜脚本。

【绝对硬性指令（违反将视作失败生成）】：
1. **字数必须写满，严禁概括抽象！**
   - 旁白是口播核心，正常语速为每分钟 260 字左右。
   - 【分镜1旁白】：**必须不少于 220 字**。
   - 【分镜2旁白】：**必须不少于 350 字**。
   - 【分镜3旁白】：**必须不少于 350 字**。
   - 【分镜4旁白】：**必须不少于 220 字**。

2. **必须采用【结构化子段落】来扩充旁白内容**：
   为了达到指定字数与深度，你必须在每个分镜的旁白中逐一展开以下子区块，**全方位复述新闻细节与深度推演**：
   - **分镜1**：【权威新闻直接引用（逐字引述新闻关键原句与首要数据）】 + 【核心悬念与破题】
   - **分镜2**：【新闻原文中的全套硬核数据与具体细节展开】 + 【结构与背景细节剖析】 + 【行业/供应链推演】
   - **分镜3**：【新闻中的冲突/诱因复述】 + 【利益博弈分析】 + 【成本、风险与连锁反应推演】
   - **分镜4**：【新闻事件核心结论】 + 【远期战略格局展望】

--------------------------------------------------
请严格按照以下格式输出脚本：

【标题】：[结合新闻细节的深度视频标题]

【分镜1 | 黄金破题与新闻事实】（预计时长：50秒 | 旁白要求：至少220字）
🎙️ **旁白口播**：
据 ${sourceName} 报道，[此处写满 220 字以上。必须原汁原味引述新闻核心原句，详细列出新闻中的首要数据与事实，揭示事件发生的直接背景，并提出核心悬念，绝对不能只写三两句话！]
🎥 **画面描述**：[匹配的细分场景描述]
🎬 **即梦/剪映 Prompt**：[中文自然语言 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Prompt]

【分镜2 | 深度背景与数据全景】（预计时长：80秒 | 旁白要求：至少350字）
🎙️ **旁白口播**：[此处写满 350 字以上！必须把新闻原文中的所有细节数据、具体名称、统计结果一字不漏地展开，并逐一解释这些数据对行业、市场或全球经济的深远影响。]
🎥 **画面描述**：[匹配画面描述]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Prompt]

【分镜3 | 地缘博弈与连锁剧变】（预计时长：80秒 | 旁白要求：至少350字）
🎙️ **旁白口播**：[此处写满 350 字以上！深入复述新闻中的核心冲突背景与关键利益方，详细推演事件发展逻辑以及由此带来的连锁剧烈影响。]
🎥 **画面描述**：[匹配画面描述]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Prompt]

【分镜4 | 总结展望与未来格局】（预计时长：50秒 | 旁白要求：至少220字）
🎙️ **旁白口播**：[此处写满 220 字以上！结合新闻事件的特殊性，全面总结本次事件的决定性意义，并展望远期格局走向。]
🎥 **画面描述**：[匹配画面描述]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Prompt]

--------------------------------------------------
【新闻原文】：
新闻来源: ${sourceName}
新闻标题: ${newsArticle.title || ''}
新闻内容: ${newsArticle.content || newsArticle.description || newsArticle.body || ''}
`;
  }

  getRequestUrl() {
    return `${this.apiBase}/chat/completions`;
  }

  /**
   * 使用原生 https 模块做 HTTP POST 请求（兼容全版本 Node.js，带 120 秒超时机制）
   */
  httpPost(urlString, headers, bodyData, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(urlString);
      const postData = JSON.stringify(bodyData);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(responseBody);
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data });
          } catch (e) {
            reject(new Error(`响应数据解析失败: ${responseBody}`));
          }
        });
      });

      req.setTimeout(timeoutMs, () => {
        req.destroy();
        reject(new Error(`请求超时（限制 ${timeoutMs / 1000} 秒）`));
      });

      req.on('error', (err) => reject(err));
      req.write(postData);
      req.end();
    });
  }

  async generateScript(newsArticle) {
    const prompt = this.buildStoryboardPrompt(newsArticle);
    const requestUrl = this.getRequestUrl();

    try {
      const response = await this.httpPost(
        requestUrl,
        {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        {
          model: this.model,
          messages: [
            { 
              role: 'system', 
              content: '你是一名严肃的国际新闻解说主编。你的原则是：拒绝任何形式的苍白概括，必须提供信息密度极高、字数饱满、逻辑闭环的口播台词。对于字数不够的要求，你必须通过增加新闻细节复述和逻辑推演来补齐。' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 4000
        }
      );

      if (!response.ok) {
        const errorDetails = response.data.error?.message || response.data.message || JSON.stringify(response.data);
        throw new Error(`[API Error ${response.status}]: ${errorDetails}`);
      }

      const rawScript = response.data.choices?.[0]?.message?.content || '';
      if (!rawScript) {
        throw new Error('API 返回的数据中未获取到有效文本内容');
      }

      return this.formatOutput(rawScript);
    } catch (error) {
      console.error('智谱 API 调用失败:', error.message);
      throw error;
    }
  }

  formatOutput(rawScript) {
    if (!rawScript) return '';
    return rawScript.trim();
  }
}

module.exports = Pipeline;
