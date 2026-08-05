/**
 * 全球新闻自动报导流水线 (Pipeline Orchestrator)
 */
class Pipeline {
  constructor(config = {}) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
    
    // 1. 清洗 apiBase
    let rawBase = (config.apiBase || process.env.LLM_API_BASE || 'https://api.deepseek.com/v1').trim();
    const urlMatch = rawBase.match(/https?:\/\/[^\s\]\)]+/);
    if (urlMatch) {
      rawBase = urlMatch[0];
    }

    this.apiBase = rawBase.replace(/\/+$/, '');
    this.model = config.model || process.env.LLM_MODEL || 'deepseek-chat';
  }

  /**
   * 构建硬核事实驱动的视频脚本 Prompt
   */
  buildStoryboardPrompt(newsArticle) {
    const sourceName = newsArticle.source?.name || newsArticle.source || '权威国际媒体';

    return `
你是一名资深国际新闻主编与 AI 视频导演。请严格根据以下【新闻原文】，撰写一份专为 5-8 分钟深度解说视频设计的分镜脚本。

【核心撰写规则（违反将导致脚本废弃）】：

1. **必须完全还原原文的“硬核事实与关键数据”（严禁泛泛而谈）**：
   - 原文中的**具体数据**（如：40,218艘船只、7.675亿总吨、伊斯坦布尔海峡19,277艘、恰纳卡莱海峡20,941艘、各类货船具体数量等）、**具体地名**和**具体地缘冲突因果**（如：美伊/以色列冲突导致霍尔木兹海峡中断、俄乌黑海无人机袭击等），**必须完整融入旁白中，一个都不能漏**！

2. **黄金破题与新闻事实（分镜1必须包含完整因果链）**：
   - 必须以“据 ${sourceName} 报道…”开头。
   - 必须在前 30 秒内明确说明：**为什么通行量暴增**（因为霍尔木兹海峡受阻与俄乌黑海局势），以及**具体的通行数据与总吨位**，让观众一眼看清事件全貌。

3. **旁白必须极其丰满，拒绝车轱辘套话**：
   - 旁白是口播核心，每段必须有足够的信息密度。结合原文中的数据、船只类型（散货船、集装箱船、牲畜船等）和地缘起因展开深度剖析。

4. **画面 Prompt 必须与旁白细节高度绑定**：
   - 画面描述、即梦 Prompt 和 ComfyUI Prompt 必须出现旁白中提及的具体元素（如：霍尔木兹海峡受阻、恰纳卡莱海峡、巨型集装箱船与牲畜运输船等）。

--------------------------------------------------
请严格按照以下格式输出脚本：

【标题】：[结合新闻硬核事实的深度标题]

【分镜1 | 黄金破题与核心事实】（预计时长：40-60秒，旁白约 200-250 字）
🎙️ **旁白口播**：[据 ${sourceName} 报道... 必须详细引述：上半年通行总数 40,218 艘、7.675 亿总吨，伊斯坦布尔与恰纳卡莱海峡具体数据，并直接指出因美伊冲突导致霍尔木兹海峡受阻、俄乌黑海无人机袭击这一核心诱因！]
🎥 **画面描述**：[匹配霍尔木兹海峡封锁、土耳其海峡船只拥堵的具体场景]
🎬 **即梦/剪映 Prompt**：[中文自然语言，描述镜头调度]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜2 | 深度背景与结构剖析】（预计时长：60-90秒，旁白约 300-400 字）
🎙️ **旁白口播**：[剖析通行船只的具体结构（普通货船13127艘、散货船7777艘、集装箱船5188艘，以及牲畜船、水泥船等细节），以及伊斯坦布尔海峡与达达尼尔/恰纳卡莱海峡的分流背景]
🎥 **画面描述**：[展示不同船种特写与海峡航道示意图]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜3 | 地缘博弈与连锁反应】（预计时长：60-90秒，旁白约 300-400 字）
🎙️ **旁白口播**：[深入分析中东霍尔木兹海峡危机与黑海俄乌冲突双重挤压下，土耳其海峡作为全球超级航道枢纽的战略博弈与能源安全影响]
🎥 **画面描述**：[美伊冲突、黑海无人机画面与海峡巡逻]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜4 | 总结展望与未来影响】（预计时长：40-60秒，旁白约 200-250 字）
🎙️ **旁白口播**：[总结全球贸易供应链重构下，土耳其海峡的战略风险与后续走向预测]
🎥 **画面描述**：[航运枢纽全景与全球贸易网联结]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

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

  async generateScript(newsArticle) {
    const prompt = this.buildStoryboardPrompt(newsArticle);
    const requestUrl = this.getRequestUrl();

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.5, // 降低随机性，让 AI 严格按原文数据生成，避免幻觉和偷懒
          max_tokens: 4000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetails = data.error?.message || data.message || JSON.stringify(data);
        throw new Error(`[API Error ${response.status}]: ${errorDetails}`);
      }

      const rawScript = data.choices?.[0]?.message?.content || '';
      if (!rawScript) {
        throw new Error('API 返回的数据中未获取到有效文本内容');
      }

      return this.formatOutput(rawScript);
    } catch (error) {
      console.error('大模型 API 调用失败:', error.message);
      throw error;
    }
  }

  formatOutput(rawScript) {
    if (!rawScript) return '';
    return rawScript.trim();
  }
}

module.exports = Pipeline;
