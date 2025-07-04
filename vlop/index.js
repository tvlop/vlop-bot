const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const express = require('express');
const tmdb = require('./tmdb');
const responseManager = require('./utils/responseManager');
require('dotenv').config();

const BOT_VERSION = '0.01';

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

function log(level, message, data = null) {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const logEntry = {
        timestamp,
        level,
        message,
        data: data || null,
        version: BOT_VERSION
    };
    
    const colors = {
        error: '\x1b[31m',   
        warn: '\x1b[33m',    
        info: '\x1b[36m',   
        success: '\x1b[32m', 
        reset: '\x1b[0m'     
    };
    
    const color = colors[level] || colors.info;
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${colors.reset}`);
    if (data) {
        console.log(`${color}Data:${colors.reset}`, data);
    }
    
    const logFileName = `bot-${moment().format('YYYY-MM-DD')}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
        fs.appendFileSync(logFilePath, logLine);
    } catch (error) {
        console.error('Failed to write to log file:', error);
    }
}

log('info', 'Starting VLOP Telegram Bot...', { version: BOT_VERSION });

log('info', 'Environment check started');
log('info', 'TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set');
log('info', 'TMDB_API_KEY:', process.env.TMDB_API_KEY ? 'Set' : 'Not set');
log('info', 'BASE_URL:', process.env.BASE_URL || 'Not set');

if (!process.env.TELEGRAM_BOT_TOKEN) {
    log('error', 'TELEGRAM_BOT_TOKEN is required but not found in environment variables');
    log('error', 'Please check your .env file and ensure it contains: TELEGRAM_BOT_TOKEN=your_bot_token_here');
    process.exit(1);
}

if (!process.env.TMDB_API_KEY) {
    log('error', 'TMDB_API_KEY is required but not found in environment variables');
    process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || `https://vlop.fun`;

log('info', 'Bot mode:', isProduction ? 'Production (Webhook)' : 'Development (Polling)');

let bot;
if (isProduction) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    log('info', 'Bot created in webhook mode');
} else {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    log('info', 'Bot created in polling mode');
}

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: `VLOP Bot running fine on version ${BOT_VERSION}`,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mode: isProduction ? 'webhook' : 'polling'
    });
});

app.get('/', (req, res) => {
    res.status(200).json({
        name: 'VLOP Telegram Bot',
        version: BOT_VERSION,
        status: 'running',
        message: `🎉 VLOP Bot running fine on version ${BOT_VERSION} 🎉`,
        mode: isProduction ? 'webhook' : 'polling'
    });
});

if (isProduction) {
    app.post('/webhook', (req, res) => {
        try {
            log('info', 'Webhook received', { body: req.body, headers: req.headers });
            bot.processUpdate(req.body);
            res.sendStatus(200);
        } catch (error) {
            log('error', 'Webhook processing error:', error);
            res.sendStatus(500);
        }
    });
    
    app.get('/webhook', (req, res) => {
        res.status(200).json({
            status: 'webhook endpoint active',
            message: 'VLOP Bot webhook is ready to receive updates',
            timestamp: new Date().toISOString()
        });
    });
}

app.listen(PORT, async () => {
    log('success', `Health check server running on port ${PORT}`);
    
    if (isProduction) {
        try {
            await bot.deleteWebHook();
            log('info', 'Existing webhook deleted');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await bot.setWebHook(WEBHOOK_URL);
            log('success', `Webhook set to: ${WEBHOOK_URL}`);
            
            const webhookInfo = await bot.getWebHookInfo();
            log('info', 'Webhook info:', webhookInfo);
            
            if (webhookInfo.url !== WEBHOOK_URL) {
                log('error', 'Webhook URL mismatch!', { expected: WEBHOOK_URL, actual: webhookInfo.url });
            }
        } catch (error) {
            log('error', 'Failed to set webhook:', error);
        }
    }
});

app.get('/webhook-info', async (req, res) => {
    try {
        const webhookInfo = await bot.getWebHookInfo();
        res.status(200).json(webhookInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/reset-webhook', async (req, res) => {
    try {
        await bot.deleteWebHook();
        log('info', 'Webhook deleted manually');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await bot.setWebHook(WEBHOOK_URL);
        log('success', 'Webhook reset successfully');
        
        const webhookInfo = await bot.getWebHookInfo();
        res.status(200).json({ 
            message: 'Webhook reset successfully', 
            webhookInfo 
        });
    } catch (error) {
        log('error', 'Failed to reset webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

process.on('uncaughtException', (error) => {
    log('error', 'Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    log('error', 'Unhandled Rejection at:', { promise, reason });
});

if (!isProduction) {
    bot.on('polling_error', (error) => {
        if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 409) {
            log('warn', 'Another bot instance is running. Stopping this instance to avoid conflicts.');
            bot.stopPolling();
            process.exit(0);
        } else {
            log('error', 'Polling error:', error);
        }
    });
}

bot.on('error', (error) => {
    log('error', 'Bot error:', error);
});

bot.getMe().then((botInfo) => {
    log('success', `Bot connected successfully as @${botInfo.username}`, {
        botId: botInfo.id,
        botName: botInfo.first_name,
        username: botInfo.username
    });
    log('success', `VLOP Bot running fine on version ${BOT_VERSION}`);
    console.log(`\n🎉 VLOP Bot running fine on version ${BOT_VERSION} 🎉\n`);
}).catch((error) => {
    log('error', 'Failed to connect bot:', error);
    process.exit(1);
});

const escapeMarkdown = (text) => {
    if (!text) return '';
    const str = String(text);
    
    let escaped = str.replace(/\\/g, '\\\\');
    
    escaped = escaped
        .replace(/\./g, '\\.')
        .replace(/_/g, '\\_')
        .replace(/\*/g, '\\*')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/~/g, '\\~')
        .replace(/`/g, '\\`')
        .replace(/>/g, '\\>')
        .replace(/#/g, '\\#')
        .replace(/\+/g, '\\+')
        .replace(/-/g, '\\-')
        .replace(/=/g, '\\=')
        .replace(/\|/g, '\\|')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/!/g, '\\!');
    
    return escaped;
};

const sendSafeMessage = async (chatId, text, options = {}) => {
    try {
        const escapedText = escapeMarkdown(text);
        return await bot.sendMessage(chatId, escapedText, {
            parse_mode: 'MarkdownV2',
            ...options
        });
    } catch (error) {
        console.error('Error sending formatted message, sending as plain text:', error);
        return await bot.sendMessage(chatId, text);
    }
};

const buildSafeCaption = (title, overview, releaseDate, genres, rating, index, total) => {
    try {
        const safeTitle = escapeMarkdown(title);
        const safeOverview = escapeMarkdown(overview);
        const safeDate = escapeMarkdown(releaseDate);
        const safeGenres = escapeMarkdown(genres);
        const safeRating = escapeMarkdown(rating.toString());
        const safeIndex = escapeMarkdown((index + 1).toString());
        const safeTotal = escapeMarkdown(total.toString());

        const captionText = `🎬 *${safeTitle}*

📝 *Overview:*
${safeOverview}

📅 *Release Date:* ${safeDate}
🏷️ *Genres:* ${safeGenres}
⭐ *Rating:* ${safeRating}/10

🔍 Result ${safeIndex} of ${safeTotal}`;

        return captionText;
    } catch (error) {
        console.error('Error building caption:', error);
        const plainText = `🎬 ${title}

📝 Overview:
${overview}

📅 Release Date: ${releaseDate}
🏷️ Genres: ${genres}
⭐ Rating: ${rating}/10

🔍 Result ${index + 1} of ${total}`;
        
        return plainText;
    }
};

bot.setMyCommands([
    { command: '/start', description: 'Start the bot' },
    { command: '/menu', description: 'Show main menu' },
    { command: '/search', description: 'Search for movies and shows' },
    { command: '/trending', description: 'Show trending content' },
    { command: '/popular', description: 'Show popular content' },
    { command: '/help', description: 'Show help information' }
]);

const userStates = new Map();
const activeMessages = new Map();
const cachedResults = new Map(); 

function getTimeBasedGreeting() {
    const hour = moment().hour();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

function isGreeting(text) {
    const greetings = ['hi', 'hello', 'hey', 'howdy', 'hola', 'greetings', 'how are you', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => text.toLowerCase().includes(greeting));
}

const mainMenuKeyboard = responseManager.getMainMenuKeyboard();

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;
    
    log('info', 'User started bot', { chatId, userName, userId: msg.from.id });
    
    userStates.set(chatId, { step: 'welcome' });
    
    const welcomeMessage = responseManager.getWelcomeMessage(true);
    
    await bot.sendMessage(chatId, welcomeMessage, mainMenuKeyboard);
    log('success', 'Welcome message sent', { chatId, userName });
});

bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name;
    
    log('info', 'User requested menu', { chatId, userName });
    
    const menuMessage = responseManager.getMenuText('main_menu', userName);
    
    await bot.sendMessage(chatId, menuMessage, mainMenuKeyboard);
});

bot.onText(/🎬 Search Movies\/Shows|\/search/, async (msg) => {
    const chatId = msg.chat.id;
    log('info', 'User initiated search', { chatId, userName: msg.from.first_name });
    
    const promptMessage = responseManager.getPromptMessage('search_prompt');
    await bot.sendMessage(chatId, promptMessage);
    userStates.set(chatId, { step: 'awaiting_search' });
});

bot.onText(/❓ Help|\/help/, async (msg) => {
    const chatId = msg.chat.id;
    log('info', 'User requested help', { chatId, userName: msg.from.first_name });
    
    const helpMessage = responseManager.getHelpMessage();
    
    await bot.sendMessage(chatId, helpMessage, mainMenuKeyboard);
});

bot.onText(/🔥 Trending|\/trending/, async (msg) => {
    const chatId = msg.chat.id;
    log('info', 'User requested trending content', { chatId, userName: msg.from.first_name });
    
    const loadingMessage = responseManager.getLoadingMessage('fetching_trending');
    await bot.sendMessage(chatId, loadingMessage);
    try {
        const trending = await tmdb.getTrending();
        await handleSearchResults(chatId, trending);
        log('success', 'Trending content delivered', { chatId, resultsCount: trending.length });
    } catch (error) {
        log('error', 'Error getting trending content', error);
        const errorMessage = responseManager.getErrorMessage('api_error');
        await bot.sendMessage(chatId, errorMessage);
    }
});

bot.onText(/⭐ Popular|\/popular/, async (msg) => {
    const chatId = msg.chat.id;
    log('info', 'User requested popular content', { chatId, userName: msg.from.first_name });
    
    const loadingMessage = responseManager.getLoadingMessage('fetching_popular');
    await bot.sendMessage(chatId, loadingMessage);
    try {
        const popular = await tmdb.getPopular();
        await handleSearchResults(chatId, popular);
        log('success', 'Popular content delivered', { chatId, resultsCount: popular.length });
    } catch (error) {
        log('error', 'Error getting popular content', error);
        const errorMessage = responseManager.getErrorMessage('api_error');
        await bot.sendMessage(chatId, errorMessage);
    }
});

async function handleSearchResults(chatId, results, index = 0) {
    log('info', 'Handling search results', { chatId, resultsCount: results.length, currentIndex: index });
    
    if (!results || results.length === 0) {
        log('warn', 'No search results found', { chatId });
        return sendSafeMessage(chatId, 'Sorry, I couldn\'t find any matches. Please try another search.');
    }

    const previousMessage = activeMessages.get(chatId);
    if (previousMessage) {
        try {
            await bot.deleteMessage(chatId, previousMessage);
        } catch (error) {
            log('warn', 'Error deleting previous message', { chatId, error: error.message });
        }
    }

    const result = results[index];
    
    try {
        const details = await tmdb.getContentDetails(result.id, result.type);
        log('success', 'Content details fetched', { chatId, contentId: result.id, title: details.title });

        const cacheKey = `${chatId}_${Date.now()}`;
        cachedResults.set(cacheKey, results);
        
        const userCacheKeys = Array.from(cachedResults.keys()).filter(key => key.startsWith(`${chatId}_`));
        if (userCacheKeys.length > 10) {
            userCacheKeys.slice(0, -10).forEach(key => cachedResults.delete(key));
        }

        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: '▶️ Watch in Telegram',
                        callback_data: `watch_${details.mediaId}`
                    },
                    {
                        text: '🌐 Watch on Web',
                        url: `${process.env.BASE_URL}/watch/${details.mediaId}`
                    }
                ]
            ]
        };

        if (results.length > 1) {
            keyboard.inline_keyboard.push([
                {
                    text: `⬅️ Previous (${index === 0 ? results.length : index}/${results.length})`,
                    callback_data: `prev_${index}_${cacheKey}`
                },
                {
                    text: `➡️ Next (${(index + 2 > results.length ? 1 : index + 2)}/${results.length})`,
                    callback_data: `next_${index}_${cacheKey}`
                }
            ]);
        }

        const caption = buildSafeCaption(
            details.title,
            details.overview || 'No overview available',
            details.release_date || details.first_air_date || 'TBA',
            details.genres?.join(', ') || 'N/A',
            (details.vote_average?.toFixed(1) || 'N/A'),
            index,
            results.length
        );

        const message = await bot.sendPhoto(chatId, 
            details.poster_path ? 
                `https://image.tmdb.org/t/p/w500${details.poster_path}` : 
                'https://vlop.fun/placeholder.jpg',
            {
                caption: caption,
                parse_mode: 'MarkdownV2',
                reply_markup: keyboard
            }
        );

        activeMessages.set(chatId, message.message_id);
        
        userStates.set(chatId, {
            ...userStates.get(chatId),
            currentResults: results,
            currentIndex: index,
            cacheKey: cacheKey
        });

        log('success', 'Search result sent successfully', { chatId, title: details.title, messageId: message.message_id });
    } catch (error) {
        log('error', 'Error sending search result', { chatId, error: error.message });
        await bot.sendMessage(chatId, 'Sorry, I couldn\'t display this result. Please try again.');
    }
}

bot.on('callback_query', async (query) => {
    const [action, ...params] = query.data.split('_');
    const chatId = query.message.chat.id;
    
    log('info', 'Callback query received', { chatId, action, userName: query.from.first_name });

    if (action === 'prev' || action === 'next') {
        try {
            const currentIndex = parseInt(params[0]);
            const cacheKey = params[1];
            
            log('info', 'Navigation request', { chatId, action, currentIndex, cacheKey });
            
            const results = cachedResults.get(cacheKey);
            if (!results) {
                throw new Error('Results not found in cache');
            }
            
            let newIndex;
            if (action === 'next') {
                newIndex = (currentIndex + 1) % results.length;
            } else {
                newIndex = (currentIndex - 1 + results.length) % results.length;
            }

            const detailedResults = await Promise.all(
                results.map(async item => {
                    try {
                        return await tmdb.getContentDetails(item.id, item.type);
                    } catch (error) {
                        log('error', `Error fetching details for ${item.type} ${item.id}`, error);
                        return null;
                    }
                })
            );

            const validResults = detailedResults.filter(Boolean);

            if (validResults.length > 0) {
                await handleSearchResults(chatId, validResults, newIndex);
                await bot.answerCallbackQuery(query.id);
                log('success', 'Navigation completed', { chatId, newIndex });
            } else {
                throw new Error('No valid results found');
            }
        } catch (error) {
            log('error', 'Navigation error', { chatId, error: error.message });
            await bot.answerCallbackQuery(query.id, { 
                text: 'Sorry, something went wrong while navigating results. Please try a new search.',
                show_alert: true
            });
        }
    } else if (action === 'watch') {
        const mediaId = params[0];
        const watchUrl = `${process.env.BASE_URL}/watch/${mediaId}`;
        
        log('info', 'Watch request', { chatId, mediaId, userName: query.from.first_name });
        
        const webAppUrl = encodeURIComponent(watchUrl);
        await bot.answerCallbackQuery(query.id, {
            url: `https://t.me/vlopfunbot/app?startapp=${webAppUrl}`
        });
        
        log('success', 'Watch URL provided', { chatId, mediaId });
    }
});

bot.on('message', async (msg) => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text;
    const userName = msg.from.first_name;
    const userState = userStates.get(chatId);

    if (text.startsWith('/') || 
        text === '🎬 Search Movies/Shows' || 
        text === '🔥 Trending' ||
        text === '⭐ Popular' ||
        text === '❓ Help') return;

    log('info', 'Message received', { chatId, userName, messageLength: text.length });

    if (userState && userState.step === 'awaiting_search') {
        log('info', 'Processing search query', { chatId, query: text });
        await bot.sendMessage(chatId, '🔍 Searching...');
        try {
            const results = await tmdb.searchContent(text);
            if (results.length > 0) {
                await handleSearchResults(chatId, results);
                log('success', 'Search completed', { chatId, query: text, resultsCount: results.length });
            } else {
                await bot.sendMessage(chatId, 'No results found. Please try a different search term.');
                log('warn', 'No search results', { chatId, query: text });
            }
        } catch (error) {
            log('error', 'Search error', { chatId, query: text, error: error.message });
            await bot.sendMessage(chatId, 'Sorry, something went wrong with the search. Please try again.');
        }
        return;
    }

    if (isGreeting(text)) {
        log('info', 'Greeting detected', { chatId, userName });
        const greeting = getTimeBasedGreeting();
        const responses = [
            `${greeting}, ${userName}! 👋 How can I help you today?`,
            `Hey ${userName}! Looking for something to watch?`,
            `Hello ${userName}! Need help finding a movie or show?`
        ];
        const response = responses[Math.floor(Math.random() * responses.length)];
        await bot.sendMessage(chatId, response, mainMenuKeyboard);
        return;
    }

    log('info', 'Unknown message handled', { chatId, userName });
    const helpMessage = `I'm here to help you find great movies and shows to watch! 🎬\n\nYou can:\n- Search for content\n- See what's trending\n- Find popular shows\n\nJust use the menu below:`;
    await bot.sendMessage(chatId, helpMessage, mainMenuKeyboard);
});

function cleanupLogs() {
    try {
        const files = fs.readdirSync(logsDir);
        const now = moment();
        
        files.forEach(file => {
            if (file.endsWith('.log')) {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                const fileAge = now.diff(moment(stats.mtime), 'days');
                
                if (fileAge > 30) {
                    fs.unlinkSync(filePath);
                    log('info', 'Old log file deleted', { fileName: file, age: fileAge });
                }
            }
        });
    } catch (error) {
        log('error', 'Error during log cleanup', error);
    }
}

setInterval(cleanupLogs, 24 * 60 * 60 * 1000); 

process.on('SIGINT', () => {
    log('info', 'Received SIGINT, shutting down gracefully...');
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('info', 'Received SIGTERM, shutting down gracefully...');
    bot.stopPolling();
    process.exit(0);
});

log('success', 'All systems initialized successfully');
log('info', 'Bot is ready to receive messages');
