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
   * 构建丰满口播字数驱动的视频脚本 Prompt
   */
  buildStoryboardPrompt(newsArticle) {
    const sourceName = newsArticle.source?.name || newsArticle.source || '权威国际媒体';

    return `
你是一名资深国际新闻主编与 AI 视频导演。请根据以下【新闻原文】，撰写一份专为 5-8 分钟深度解说视频设计的分镜脚本。

【核心撰写规则（必须严格执行）】：

1. **旁白口播字数绝对下限（违者重新生成）**：
   - 正常口播语速约为每分钟 250-280 字。为了支撑 5-8 分钟的深度视频，**每个分镜的旁白必须展开详细论述，绝对不能三言两语概括！**
   - 【分镜1】旁白：**必须在 200 字至 280 字之间**。
   - 【分镜2】旁白：**必须在 300 字至 400 字之间**。
   - 【分镜3】旁白：**必须在 300 字至 400 字之间**。
   - 【分镜4】旁白：**必须在 200 字至 280 字之间**。

2. **如何展开旁白以达到丰富字数**：
   - **分镜1**：引述出处 + 完整事实 + 数据对比 + 引入核心矛盾悬念。
   - **分镜2**：列举原文中所有数据（各类船只数量、总吨位、不同海峡数据） + 解释为什么这些数据重要 + 剖析航运结构的深层含义。
   - **分镜3**：展开分析地缘冲突（如美伊冲突导致霍尔木兹封锁、黑海无人机袭击）对供应链、油价、保险成本、绕航成本的连锁反应。
   - **分镜4**：评估远期影响 + 展望国际多方博弈与战略格局走向。

3. **画面 Prompt 与旁白匹配**：
   - 随着旁白内容的丰富，画面描述、即梦 Prompt 和 ComfyUI Prompt 也需要描述更多细分镜头与画面演变。

--------------------------------------------------
请严格按照以下格式输出脚本：

【标题】：[深度新闻视频标题]

【分镜1 | 黄金破题与核心事实】（预计时长：45秒 | 要求旁白字数：200-280字）
🎙️ **旁白口播**：[据 ${sourceName} 报道... 请在此处写满 200-280 字，交代完整起因与数据，抛出核心悬念]
🎥 **画面描述**：[匹配的细分画面场景]
🎬 **即梦/剪映 Prompt**：[中文自然语言 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜2 | 深度背景与数据结构】（预计时长：75秒 | 要求旁白字数：300-400字）
🎙️ **旁白口播**：[请在此处写满 300-400 字！详细展开原文所有的硬核数据：40218艘总数、伊斯坦布尔19277艘、恰纳卡莱20941艘，13127艘普通货船、7777艘散货船、5188艘集装箱船、牲畜船、水泥船以及7.675亿总吨等，并深入剖析这些结构数据的航运含义]
🎥 **画面描述**：[匹配画面]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜3 | 地缘博弈与连锁影响】（预计时长：75秒 | 要求旁白字数：300-400字）
🎙️ **旁白口播**：[请在此处写满 300-400 字！深入分析霍尔木兹海峡受阻、黑海无人机袭击如何倒逼全球船只向土耳其海峡集中，由此引发的运费飙升、保险成本上涨以及大国博弈]
🎥 **画面描述**：[匹配画面]
🎬 **即梦/剪映 Prompt**：[中文 Prompt]
⚙️ **ComfyUI Prompt**：[英文 Tag 组]

【分镜4 | 总结展望与未来格局】（预计时长：45秒 | 要求旁白字数：200-280字）
🎙️ **旁白口播**：[请在此处写满 200-280 字！总结土耳其海峡作为地缘咽喉的战略风险，对全球供应链重构的影响]
🎥 **画面描述**：[匹配画面]
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
          temperature: 0.6,
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
