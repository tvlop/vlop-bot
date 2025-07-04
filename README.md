# Vlop Telegram Bot

Stream movies and shows right from Telegram with Vlop Bot. It's fast, clean. Run it in your chat.

---

## How It Works

Deploy the bot, hook up your Telegram token, and you're set. Users type or tap  the bot searches TMDB and returns with data and stream links from [vlop.fun](https://vlop.fun).

### Commands

- `/start` – Intro and welcome
- `/menu` – Pops up the main menu
- `/search` – Search anything, titles, actors, whatever
- `/trending` – What’s hot right now
- `/popular` – What everyone’s binging
- `/help` – Get command help and bot info

The bot’s fast, interactive, and doesn’t need users to type much — it’s just buttons, chill vibes, and straight-to-the-content flow.

---

##  Self-Hosting Instructions

If you’re not using the buttons and wanna run it yourself:

```bash
git clone https://github.com/tvlop/vlop-bot.git
cd vlop-bot
npm install
cp .env.example .env
# Throw your bot token, TMDB key, and URLs in the .env
npm start
```

You can also run it in dev mode:
```bash
npm run dev
```

---

##  One-Click Deploy

Wanna skip the boring setup? Click one of these:

###  Cloudflare Workers
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/tvlop/vlop-bot)

### Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/web/new?repo=https://github.com/tvlop/vlop-bot&env=TELEGRAM_BOT_TOKEN,TMDB_API_KEY,BASE_URL,WEBHOOK_URL)

### ▲ Vercel
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tvlop/vlop-bot&env=TELEGRAM_BOT_TOKEN,TMDB_API_KEY,BASE_URL,WEBHOOK_URL)

### zeabur

[![Deployed on Zeabur](https://zeabur.com/deployed-on-zeabur-dark.svg)](https://zeabur.com/referral?referralCode=vlopfun&utm_source=mohameodo&utm_campaign=oss)
---

##  env Vars You Gotta Fill

- `TELEGRAM_BOT_TOKEN`: From @BotFather
- `TMDB_API_KEY`: From TMDB dashboard
- `BASE_URL`: Your live URL (e.g. https://vlop.fun)
- `WEBHOOK_URL`: Telegram needs this to push updates

---

## 🤝 Credits

- Movie/TV data by [TMDB](https://www.themoviedb.org/documentation/api)
- Bot magic via [Telegram Bot API](https://core.telegram.org/bots/api)
