import express from 'express';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import axios from 'axios';
import client from './src/app/client.js';
import scraper from './src/helper/scraper.js';
dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

const SERVER_URL = process.env.SERVER_URL;
// Telegram API Configuration
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const URI = `/webhook/${process.env.TELEGRAM_TOKEN}`;
const webhookURL = `${SERVER_URL}${URI}`;

// middleware untuk nangkap ttdl
bot.use(async (ctx, next) => {
  const messageText = ctx.message.text;

  if (messageText.startsWith('/tiktokdl')) {
    const commandParts = messageText.split(' ');

    if (commandParts.length !== 2) {
      // Pesan harus berisi perintah dan URL TikTok
      ctx.reply('Gunakan perintah seperti ini: /tiktokdl [URL]');
    } else {
      const urlTikTok = commandParts[1];

      try {
        ctx.reply('please waiting');
        const p = await scraper(urlTikTok);
        const videoUrl = p.data.url;
        const response = await axios.get(videoUrl, { responseType: 'stream' });
        await ctx.replyWithVideo({ source: response.data });
        ctx.reply('success download video');
      } catch (error) {
        console.error('Gagal mengunduh video:', error);
      }
    }
  }
  return;
});
const setupWebhook = async () => {
  try {
    const { data } = await client({
      url: `${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`,
      method: 'GET',
    });
    console.log(data);
  } catch (error) {
    return error;
  }
};
const server = express();
server.use(express.json());
const PORT = 9642;

server.get('/', (req, res) => {
  res.json({
    body: req.body,
    query: req.query,
    cookies: req.cookies,
  });
});
server.post(URI, async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    console.log('PING !!!!!!');
    res.status(200).send('ok');
  } catch (error) {
    console.log(error);
  }
});
server.listen(PORT, '0.0.0.0', async () => {
  await setupWebhook();
  bot.launch();
  console.log(`bot tele and Webhook RUN at PORT ${PORT}`);
});
