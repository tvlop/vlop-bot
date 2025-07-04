
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🤖 VLOP Telegram Bot - Render Deployment');
console.log('==========================================');

const requiredFiles = [
  'package.json',
  'index.js',
  'tmdb.js',
  'render.yaml',
  'Dockerfile'
];

console.log('📋 Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
    process.exit(1);
  }
}

console.log('\n🔧 Checking environment variables...');
const envFile = '.env';
if (fs.existsSync(envFile)) {
  console.log('✅ .env file found');
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  const requiredEnvVars = [
    'TELEGRAM_BOT_TOKEN',
    'TMDB_API_KEY',
    'BASE_URL'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar} - Configured`);
    } else {
      console.log(`⚠️  ${envVar} - Not found in .env file`);
    }
  }
} else {
  console.log('⚠️  .env file not found - make sure to set environment variables in Render');
}

console.log('\n🔧 Installing dependencies...');
try {
  execSync('npm install --production', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!');
} catch (error) {
  console.error('❌ Dependency installation failed:', error.message);
  process.exit(1);
}

console.log('\n📝 Deployment Instructions for VLOP Telegram Bot:');
console.log('=================================================');
console.log('1. Go to your Render dashboard: https://dashboard.render.com');
console.log('2. Create a new Web Service');
console.log('3. Connect your GitHub repository: tvlop/vlop-bot');
console.log('4. Set the following configuration:');
console.log('   - Service Type: Web Service');
console.log('   - Environment: Node');
console.log('   - Root Directory: /');
console.log('   - Build Command: npm install --production');
console.log('   - Start Command: npm run start:render');
console.log('   - Auto-Deploy: Yes');
console.log('\n5. Add these environment variables in Render dashboard:');
console.log('   - TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here');
console.log('   - TMDB_API_KEY=your_tmdb_api_key_here');
console.log('   - BASE_URL=vlop.fun');
console.log('   - NODE_ENV=production');

console.log('\n🤖 Bot Features:');
console.log('- Search movies and TV shows');
console.log('- Get trending content');
console.log('- View popular content');
console.log('- Navigate through results');
console.log('- Watch content via web app');
console.log('- Comprehensive logging system');

console.log('\n🔍 Bot will display:');
console.log('🎉 VLOP Bot running fine on version 0.01 🎉');

console.log('\n✨ Bot ready for deployment!');
console.log('Your bot will be accessible via Telegram after deployment.');
