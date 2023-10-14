// DENNY
import express from 'express';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import axios from 'axios';
import client from './src/app/client.js';
import scraper from './src/helper/scraper.js';
import XTwitterDL from './src/helper/tiktokDl.js';
dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const TiktokLink =
  /(https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+|https:\/\/vt\.tiktok\.com\/[\w.-]+)/g;
const TwitterLink = /https:\/\/(www\.)?[^/]+\/[^/]+\/status\/\d+\?s=\d+/g;

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
        ctx.reply(`downloading ${urlTikTok}`);
        const res = await scraper(urlTikTok);
        if (res.data.type == 'video') {
          ctx.reply('processing video');
          const url = res.data.url;
          const response = await axios.get(url, { responseType: 'stream' });
          await ctx.replyWithVideo({ source: response.data });
        } else {
          ctx.reply(
            `processing ${res.data.url.length} image from slideshow type`
          );
          for (let index = 0; index < res.data.url.length; index++) {
            const imgUrl = res.data.url[index];
            const responseImg = await axios.get(imgUrl, {
              responseType: 'arraybuffer',
            });
            await ctx.replyWithPhoto({ source: responseImg.data });
          }
        }
        ctx.reply('task succeed');
      } catch (error) {
        ctx.reply(error.message);
      }
    }
  }
  const isTiktokLink = messageText.match(TiktokLink);
  const isTwitterLink = messageText.match(TwitterLink);
  if (isTiktokLink) {
    try {
      const urlTikTok = messageText;
      ctx.reply(`downloading ${urlTikTok}`);
      const res = await scraper(urlTikTok);
      if (res.data.type == 'video') {
        ctx.reply('processing video');
        const url = res.data.url;
        const response = await axios.get(url, { responseType: 'stream' });
        await ctx.replyWithVideo({ source: response.data });
      } else {
        ctx.reply(
          `processing ${res.data.url.length} image from slideshow type`
        );
        for (let index = 0; index < res.data.url.length; index++) {
          const imgUrl = res.data.url[index];
          const responseImg = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
          });
          await ctx.replyWithPhoto({ source: responseImg.data });
        }
      }
      ctx.reply('task succeed');
    } catch (error) {
      ctx.reply(error.message);
    }
  } else if (isTwitterLink) {
    try {
      const urlTwitter = messageText;
      ctx.reply(`downloading ${urlTwitter}`);
      const data = await XTwitterDL(urlTwitter);
      //
      ctx.reply('processing');
      for (let index = 0; index < data.result.media.length; index++) {
        if (res.data.result.media[index].type == 'video') {
          ctx.reply('processing video');
          const url = res.data.result.media[index].url;
          const response = await axios.get(url, { responseType: 'stream' });
          await ctx.replyWithVideo({ source: response.data });
        } else {
          const imgUrl = res.data.result.media[index].url;
          const responseImg = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
          });
          await ctx.replyWithPhoto({ source: responseImg.data });
        }
      }
    } catch (error) {
      ctx.reply(error.message);
    }
  } else {
    ctx.reply('Pinggg!!!!!!');
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
const PORT = process.env.PORT;

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
  try {
    await setupWebhook();
    bot.launch();
    console.log(`bot tele and Webhook RUN at PORT ${PORT}`);
    if (process.env.TELEGRAM_TOKEN == undefined || SERVER_URL == undefined) {
      throw new Error('failed no environment');
    }
  } catch (error) {
    console.log(error);
  }
});
