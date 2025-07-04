#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const pkg = require('../package.json');

program
    .version(pkg.version)
    .description('Vlop Telegram Bot CLI');

program
    .command('start')
    .description('Start the Vlop Telegram bot')
    .action(() => {
        console.log('Starting Vlop Telegram bot...');
        require('./index.js');
    });

program
    .command('vlop start')
    .description('Start the Vlop Telegram bot (alternative command)')
    .action(() => {
        console.log('Starting Vlop Telegram bot...');
        require('./index.js');
    });

program
    .command('init')
    .description('Initialize bot configuration')
    .action(() => {
        const envPath = path.join(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) {
            const envContent = 
`TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TMDB_API_KEY=your_tmdb_api_key_here
BASE_URL=https://vlop.fun`;
            
            fs.writeFileSync(envPath, envContent);
            console.log('Created .env file. Please update it with your API keys.');
        } else {
            console.log('.env file already exists.');
        }
    });

program.parse(process.argv);