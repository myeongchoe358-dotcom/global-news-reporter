require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');
const moment = require('moment-timezone');
const NewsRanker = require('./news-ranker');
const NewsFormatter = require('./news-formatter');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor(apiKey, emailUser, emailPassword) {
    this.apiKey = apiKey;
    this.emailUser = emailUser;
    this.emailPassword = emailPassword;
    this.ranker = new NewsRanker();
    this.formatter = new NewsFormatter();
  }

  /**
   * 从 NewsAPI 获取真实新闻
   */
  async fetchRealNews() {
    try {
      logger.info('📡 Fetching real news from NewsAPI...');
      
      const keywords = [
        'politics',
        'artificial intelligence',
        'space exploration',
        'economy trade',
        'climate change',
        'military conflict',
        'scientific discovery',
        'robotics'
      ];

      let allArticles = [];
      const seen = new Set();

      for (const keyword of keywords) {
        try {
          const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
              q: keyword,
              sortBy: 'publishedAt',
              language: 'en',
              pageSize: 30,
              apiKey: this.apiKey
            },
            timeout: 10000
          });

          if (response.data.articles) {
            response.data.articles.forEach(article => {
              const id = `${article.title}-${article.source.id}`;
              if (!seen.has(id) && article.title && article.description) {
                allArticles.push(article);
                seen.add(id);
              }
            });
            logger.info(`  ✓ Got ${response.data.articles.length} articles for "${keyword}"`);
          }

          // 避免 API 限制
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.warn(`  ⚠ Error fetching "${keyword}": ${error.message}`);
        }
      }

      logger.info(`✓ Total real articles fetched: ${allArticles.length}`);
      
      // 标准化文章
      return allArticles.map((article, index) => ({
        id: `${Date.now()}-${index}`,
        title: article.title || '',
        titleEn: article.title || '',
        description: article.description || '',
        descriptionEn: article.description || '',
        url: article.url || '',
        image: article.urlToImage || '',
        source: {
          id: article.source?.id || 'unknown',
          name: article.source?.name || 'Unknown'
        },
        publishedAt: article.publishedAt || new Date().toISOString(),
        category: this.categorizeNews(article.title + ' ' + article.description),
        categoryEn: this.categorizeNewsEn(article.title + ' ' + article.description),
        categoryKey: this.categorizeNewsKey(article.title + ' ' + article.description),
        content: article.content || '',
        author: article.author || ''
      }));
    } catch (error) {
      logger.error('Error fetching real news', error);
      return [];
    }
  }

  /**
   * 分类新闻
   */
  categorizeNews(text) {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('ai') || textLower.includes('artificial') || textLower.includes('algorithm')) 
      return 'AI与机器学习';
    if (textLower.includes('space') || textLower.includes('mars') || textLower.includes('rocket'))
      return '航空航天';
    if (textLower.includes('robot') || textLower.includes('automation'))
      return '机器人';
    if (textLower.includes('climate') || textLower.includes('environment') || textLower.includes('energy'))
      return '基础科学';
    if (textLower.includes('war') || textLower.includes('military') || textLower.includes('conflict'))
      return '军事';
    if (textLower.includes('trade') || textLower.includes('economy') || textLower.includes('market'))
      return '经济';
    if (textLower.includes('president') || textLower.includes('government') || textLower.includes('election'))
      return '政治';
    if (textLower.includes('tech') || textLower.includes('software') || textLower.includes('computer'))
      return '科技';
    return '社会学';
  }

  categorizeNewsEn(text) {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('ai') || textLower.includes('artificial') || textLower.includes('algorithm')) 
      return 'AI & Machine Learning';
    if (textLower.includes('space') || textLower.includes('mars') || textLower.includes('rocket'))
      return 'Aerospace';
    if (textLower.includes('robot') || textLower.includes('automation'))
      return 'Robotics';
    if (textLower.includes('climate') || textLower.includes('environment') || textLower.includes('energy'))
      return 'Basic Science';
    if (textLower.includes('war') || textLower.includes('military') || textLower.includes('conflict'))
      return 'Military';
    if (textLower.includes('trade') || textLower.includes('economy') || textLower.includes('market'))
      return 'Economics';
    if (textLower.includes('president') || textLower.includes('government') || textLower.includes('election'))
      return 'Politics';
    if (textLower.includes('tech') || textLower.includes('software') || textLower.includes('computer'))
      return 'Technology';
    return 'Sociology';
  }

  categorizeNewsKey(text) {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('ai') || textLower.includes('artificial') || textLower.includes('algorithm')) 
      return 'ai';
    if (textLower.includes('space') || textLower.includes('mars') || textLower.includes('rocket'))
      return 'aerospace';
    if (textLower.includes('robot') || textLower.includes('automation'))
      return 'robotics';
    if (textLower.includes('climate') || textLower.includes('environment') || textLower.includes('energy'))
      return 'science';
    if (textLower.includes('war') || textLower.includes('military') || textLower.includes('conflict'))
      return 'military';
    if (textLower.includes('trade') || textLower.includes('economy') || textLower.includes('market'))
      return 'economics';
    if (textLower.includes('president') || textLower.includes('government') || textLower.includes('election'))
      return 'politics';
    if (textLower.includes('tech') || textLower.includes('software') || textLower.includes('computer'))
      return 'technology';
    return 'sociology';
  }

  /**
   * 保存文件
   */
  saveFile(filename, content) {
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, content, 'utf8');
    return filepath;
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(htmlContent, plainTextContent) {
    try {
      logger.info('📧 Sending test email...');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.emailUser,
          pass: this.emailPassword
        }
      });

      const currentDate = moment().tz('Asia/Shanghai').format('YYYY年M月D日');
      const subject = `【全球重大时政新闻日报】${currentDate} [测试版本]`;

      const mailOptions = {
        from: `全球新闻日报系统 <${this.emailUser}>`,
        to: 'myeongchoe358@gmail.com',
        subject: subject,
        text: plainTextContent,
        html: htmlContent,
        replyTo: this.emailUser
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`✓ Email sent successfully! Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Error sending email', error);
      throw error;
    }
  }

  /**
   * 运行完整测试
   */
  async run() {
    try {
      logger.info('═'.repeat(70));
      logger.info('🚀 GLOBAL NEWS REPORTER - PRODUCTION TEST');
      logger.info('═'.repeat(70));

      // 第1步：获取真实新闻
      logger.info('\n📥 Step 1: Fetching real news from NewsAPI...');
      const allNews = await this.fetchRealNews();

      if (allNews.length === 0) {
        logger.error('No articles fetched!');
        return { success: false, message: 'No articles fetched' };
      }

      // 第2步：排序
      logger.info('\n📊 Step 2: Ranking articles by importance...');
      const topNews = this.ranker.rankWithDiversity(allNews, 10);
      logger.info(`✓ Selected and ranked top ${topNews.length} articles`);

      // 显示前10条
      console.log('\n' + '─'.repeat(70));
      console.log('📰 TOP 10 NEWS');
      console.log('─'.repeat(70));
      topNews.forEach((article, index) => {
        const emoji = this.formatter.getCategoryEmoji(article.categoryKey);
        console.log(`\n${index + 1}. ${emoji} [${article.category}] (Score: ${article.importanceScore?.toFixed(0) || 0})`);
        console.log(`   Title: ${article.title.substring(0, 60)}...`);
        console.log(`   Source: ${article.source.name}`);
      });

      // 第3步：生成格式
      logger.info('\n🎨 Step 3: Formatting reports...');
      const plainText = this.formatter.generatePlainText(topNews);
      const htmlContent = this.formatter.generateHTML(topNews);
      logger.info('✓ Generated all formats');

      // 第4步：保存文件
      logger.info('\n💾 Step 4: Saving reports...');
      const timestamp = moment().tz('Asia/Shanghai').format('YYYY-MM-DD-HHmmss');
      
      const txtFile = this.saveFile(`test-news-${timestamp}.txt`, plainText);
      logger.info(`✓ Saved text report: ${path.basename(txtFile)}`);

      const htmlFile = this.saveFile(`test-news-${timestamp}.html`, htmlContent);
      logger.info(`✓ Saved HTML report: ${path.basename(htmlFile)}`);

      // 第5步：发送邮件
      logger.info('\n📧 Step 5: Sending test email to myeongchoe358@gmail.com...');
      const emailSent = await this.sendTestEmail(htmlContent, plainText);

      // 显示纯文本预览
      logger.info('\n📄 Text Report Preview (first 1500 chars):');
      console.log('\n' + '═'.repeat(70));
      console.log(plainText.substring(0, 1500));
      console.log('\n... [report truncated for display] ...\n');

      logger.info('═'.repeat(70));
      logger.info('✅ TEST COMPLETED SUCCESSFULLY!');
      logger.info('═'.repeat(70));

      console.log('\n✨ Summary:');
      console.log(`  ✓ Articles Processed: ${allNews.length}`);
      console.log(`  ✓ Top Articles Selected: ${topNews.length}`);
      console.log(`  ✓ Email Sent: Yes`);
      console.log(`  ✓ Recipient: myeongchoe358@gmail.com`);
      console.log(`  ✓ Output Files: ${path.join(__dirname, '../output')}`);
      console.log('');

      return { success: true, articlesCount: topNews.length, emailSent };
    } catch (error) {
      logger.error('Test failed', error);
      console.error('❌ Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// 运行测试
if (require.main === module) {
  const apiKey = '9c78bf1e115d4740aa643abe933';
  const emailUser = 'myeongchoe358@gmail.com';
  const emailPassword = '4d169';

  const tester = new TestRunner(apiKey, emailUser, emailPassword);
  tester.run().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = TestRunner;
