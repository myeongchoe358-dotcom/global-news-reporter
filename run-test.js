const TestRunner = require('./test-runner');

// 直接执行测试
async function main() {
  const apiKey = '9c78bf1e115d4740aa643abe933';
  const emailUser = 'myeongchoe358@gmail.com';
  const emailPassword = '4d169';

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         🚀 GLOBAL NEWS REPORTER - PRODUCTION TEST 🚀          ║');
  console.log('║                                                                ║');
  console.log('║  This test will:                                               ║');
  console.log('║  ✓ Fetch real news from NewsAPI                               ║');
  console.log('║  ✓ Rank articles by importance                                ║');
  console.log('║  ✓ Generate bilingual report (中英双语)                       ║');
  console.log('║  ✓ Send test email to myeongchoe358@gmail.com                 ║');
  console.log('║  ✓ Save report files to output/                               ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    const tester = new TestRunner(apiKey, emailUser, emailPassword);
    const result = await tester.run();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    if (result.success) {
      console.log('║                   ✅ TEST COMPLETED SUCCESSFULLY ✅             ║');
      console.log('║                                                                ║');
      console.log('║  📧 Email Status: SENT                                        ║');
      console.log('║  📨 Recipient: myeongchoe358@gmail.com                        ║');
      console.log('║  📊 Articles: ' + result.articlesCount + ' articles processed                           ║');
      console.log('║  📁 Output: ./output/ directory                               ║');
      console.log('║                                                                ║');
      console.log('║  ⏰ System is ready for daily automation                       ║');
      console.log('║  📅 Will run every day at 12:00 PM (Beijing Time)            ║');
      console.log('║                                                                ║');
    } else {
      console.log('║                    ❌ TEST FAILED ❌                         ║');
      console.log('║                                                                ║');
      console.log('║  Error: ' + result.error?.substring(0, 50) + '                     ║');
      console.log('║                                                                ║');
    }
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

main();
