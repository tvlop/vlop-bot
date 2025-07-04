const fs = require('fs');
const path = require('path');

class ResponseManager {
    constructor() {
        this.responses = {};
        this.loadAllResponses();
    }

    loadAllResponses() {
        const responsesDir = path.join(__dirname, '..', 'responses');
        
        try {
            this.responses.main = JSON.parse(
                fs.readFileSync(path.join(responsesDir, 'main.json'), 'utf8')
            );

            this.responses.buttons = JSON.parse(
                fs.readFileSync(path.join(responsesDir, 'buttons.json'), 'utf8')
            );

            this.responses.content = JSON.parse(
                fs.readFileSync(path.join(responsesDir, 'content.json'), 'utf8')
            );

            console.log('✅ All response files loaded successfully');
        } catch (error) {
            console.error('❌ Error loading response files:', error);
            this.loadDefaultResponses();
        }
    }

    loadDefaultResponses() {
        this.responses = {
            main: {
                greetings: {
                    general: ["Hello! 👋 How can I help you today?"]
                },
                errors: {
                    api_error: "Sorry, something went wrong. Please try again later."
                }
            }
        };
    }

    getGreeting(timeOfDay = 'general') {
        const greetings = this.responses.main?.greetings?.[timeOfDay] || 
                         this.responses.main?.greetings?.general || 
                         ["Hello! 👋"];
        
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    getWelcomeMessage(isNewUser = false) {
        const welcomeKey = isNewUser ? 'new_user' : 'returning_user';
        return this.responses.main?.welcome?.[welcomeKey] || 
               "Welcome to VLOP! 🎉";
    }

    getHelpMessage() {
        const help = this.responses.main?.help?.main_help || "Here's how I can help you:";
        const commands = this.responses.main?.help?.commands || [];
        
        return help + '\n\n' + commands.join('\n');
    }

    getErrorMessage(errorType = 'api_error') {
        return this.responses.main?.errors?.[errorType] || 
               "Sorry, something went wrong. Please try again later.";
    }

    getLoadingMessage(loadingType = 'processing') {
        return this.responses.main?.loading?.[loadingType] || 
               "⚙️ Processing...";
    }

    getSuccessMessage(successType = 'content_found', data = {}) {
        let message = this.responses.main?.success?.[successType] || 
                     "✅ Success!";
        
        Object.keys(data).forEach(key => {
            message = message.replace(`{${key}}`, data[key]);
        });
        
        return message;
    }

    getMainMenuKeyboard() {
        const buttons = this.responses.buttons?.buttons?.main_menu || [];
        const keyboard = [];
        
        for (let i = 0; i < buttons.length; i += 2) {
            const row = [buttons[i].text];
            if (buttons[i + 1]) {
                row.push(buttons[i + 1].text);
            }
            keyboard.push(row);
        }
        
        return {
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true
            }
        };
    }

    getContentTemplate(contentType = 'movie_card', data = {}) {
        let template = this.responses.content?.content_templates?.[contentType] || 
                      "🎬 *{title}*\n\n{overview}";
        
        Object.keys(data).forEach(key => {
            const placeholder = `{${key}}`;
            template = template.replace(new RegExp(placeholder, 'g'), data[key] || 'N/A');
        });
        
        return template;
    }

    getContentInlineKeyboard(mediaId, hasNavigation = false, navigationData = {}) {
        const keyboard = [];
        
        keyboard.push([
            {
                text: '▶️ Watch in Telegram',
                callback_data: `watch_${mediaId}`
            },
            {
                text: '🌐 Watch on Web',
                url: `${process.env.BASE_URL}/watch/${mediaId}`
            }
        ]);

        if (hasNavigation) {
            keyboard.push([
                {
                    text: `⬅️ Previous (${navigationData.prevIndex}/${navigationData.total})`,
                    callback_data: `prev_${navigationData.currentIndex}_${navigationData.cacheKey}`
                },
                {
                    text: `➡️ Next (${navigationData.nextIndex}/${navigationData.total})`,
                    callback_data: `next_${navigationData.currentIndex}_${navigationData.cacheKey}`
                }
            ]);
        }

        return { inline_keyboard: keyboard };
    }

    getStatusMessage(statusType = 'bot_online', data = {}) {
        let message = this.responses.content?.status_messages?.[statusType] || 
                     "🎉 Bot is running!";
        
        Object.keys(data).forEach(key => {
            message = message.replace(`{${key}}`, data[key]);
        });
        
        return message;
    }

    getPositiveFeedback() {
        const feedback = this.responses.content?.user_feedback?.positive || 
                        ["Great! Hope you enjoy! 🎬"];
        
        return feedback[Math.floor(Math.random() * feedback.length)];
    }

    getMovieQuote() {
        const quotes = this.responses.content?.easter_eggs?.movie_quotes || 
                      ["\"Great movies await!\" - VLOP Bot 🎬"];
        
        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    getFunFact() {
        const facts = this.responses.content?.easter_eggs?.fun_facts || 
                     ["🎬 Movies are awesome!"];
        
        return facts[Math.floor(Math.random() * facts.length)];
    }

    getMenuText(menuType = 'main_menu', userName = 'there') {
        let text = this.responses.buttons?.menu_texts?.[menuType] || 
                  "What would you like to do?";
        
        text = text.replace('{name}', userName);
        return text;
    }

    getPromptMessage(promptType = 'search_prompt') {
        return this.responses.main?.prompts?.[promptType] || 
               "What are you looking for?";
    }

    getUnknownMessage() {
        return this.responses.main?.unknown_message || 
               "I'm here to help you find great content! Use the menu below.";
    }

    reloadResponses() {
        console.log('🔄 Reloading response files...');
        this.loadAllResponses();
    }
}

module.exports = new ResponseManager();