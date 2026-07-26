const NewsFetcher = require('./news-fetcher');
const NewsRanker = require('./news-ranker');
const NewsFormatter = require('./news-formatter');
const EmailSender = require('./email-sender');
const logger = require('./logger');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

class Pipeline {
  constructor() {
    this.fetcher = new NewsFetcher();
    this.ranker = new NewsRanker();
    this.formatter = new NewsFormatter();
    this.emailSender = new EmailSender();
  }

  /**
   * 保存新闻到JSON文件
   */
  saveNewsToFile(articles, type = 'json') {
    try {
      const outputDir = path.join(__dirname, '../output');
      
      // 确保output目录存在
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const timestamp = moment().tz('Asia/Shanghai').format('YYYY-MM-DD');
      
      if (type === 'json') {
        const filename = path.join(outputDir, `news-${timestamp}.json`);
        const data = this.formatter.generateJSON(articles);
        fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
        logger.info(`News saved to JSON: ${filename}`);
        return filename;
      } else if (type === 'html') {
        const filename = path.join(outputDir, `news-${timestamp}.html`);
        const html = this.formatter.generateHTML(articles);
        fs.writeFileSync(filename, html, 'utf8');
        logger.info(`News saved to HTML: ${filename}`);
        return filename;
      } else if (type === 'txt') {
        const filename = path.join(outputDir, `news-${timestamp}.txt`);
        const text = this.formatter.generatePlainText(articles);
        fs.writeFileSync(filename, text, 'utf8');
        logger.info(`News saved to TXT: ${filename}`);
        return filename;
      }
    } catch (error) {
      logger.error('Error saving news to file', error);
    }
  }

  /**
   * 执行完整的处理流程
   */
  async execute(sendEmail = true) {
    const startTime = Date.now();
    
    try {
      logger.info('═'.repeat(60));
      logger.info('Starting Global News Reporter Pipeline');
      logger.info('═'.repeat(60));

      // 第1步：获取新闻
      logger.info('\n📥 Step 1: Fetching news articles...');
      const allNews = await this.fetcher.getAllNews();
      logger.info(`✓ Fetched ${allNews.length} articles`);

      if (allNews.length === 0) {
        logger.warn('No articles fetched. Skipping pipeline.');
        return {
          success: false,
          message: 'No articles fetched',
          duration: Date.now() - startTime
        };
      }

      // 第2步：排序新闻
      logger.info('\n📊 Step 2: Ranking and selecting top news...');
      const topNews = this.ranker.rankWithDiversity(allNews, 10);
      logger.info(`✓ Ranked and selected ${topNews.length} articles`);

      // 第3步：格式化新闻
      logger.info('\n🎨 Step 3: Formatting news for multiple formats...');
      const plainText = this.formatter.generatePlainText(topNews);
      const htmlContent = this.formatter.generateHTML(topNews);
      const jsonData = this.formatter.generateJSON(topNews);
      logger.info('✓ Formatted news in all formats');

      // 第4步：保存到文件
      logger.info('\n💾 Step 4: Saving news to files...');
      this.saveNewsToFile(topNews, 'json');
      this.saveNewsToFile(topNews, 'html');
      this.saveNewsToFile(topNews, 'txt');
      logger.info('✓ Saved to output files');

      // 第5步：发送邮件
      let emailResult = null;
      if (sendEmail) {
        logger.info('\n📧 Step 5: Sending email...');
        try {
          emailResult = await this.emailSender.sendNewsReport(plainText, htmlContent);
          logger.info(`✓ Email sent successfully to ${this.emailSender.emailConfig.recipient}`);
        } catch (error) {
          logger.error('Failed to send email', error);
          emailResult = {
            success: false,
            error: error.message
          };
        }
      }

      const duration = Date.now() - startTime;
      logger.info('\n' + '═'.repeat(60));
      logger.info(`✓ Pipeline completed successfully in ${duration}ms`);
      logger.info('═'.repeat(60));

      return {
        success: true,
        articlesCount: topNews.length,
        emailSent: sendEmail,
        emailResult: emailResult,
        duration: duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Pipeline execution failed', error);
      
      const duration = Date.now() - startTime;
      return {
        success: false,
        error: error.message,
        duration: duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 执行但不发送邮件（用于测试）
   */
  async executeWithoutEmail() {
    logger.info('Running pipeline without email (test mode)');
    return this.execute(false);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const pipeline = new Pipeline();

  // 检查命令行参数
  const args = process.argv.slice(2);
  const skipEmail = args.includes('--no-email') || args.includes('--test');

  (async () => {
    try {
      const result = await pipeline.execute(!skipEmail);
      
      console.log('\n' + '═'.repeat(60));
      console.log('Pipeline Result:');
      console.log('═'.repeat(60));
      console.log(JSON.stringify(result, null, 2));

      process.exit(result.success ? 0 : 1);
    } catch (err) {
      console.error('Fatal error:', err);
      process.exit(1);
    }
  })();
}

module.exports = Pipeline;
