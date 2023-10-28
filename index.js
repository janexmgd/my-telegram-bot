// DENNY
import express from 'express';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import axios from 'axios';
import urlModule from 'url';
import client from './src/app/client.js';
import scraper from './src/helper/scraper.js';
import XTwitterDL from './src/helper/twitterDL.js';
import instaDL from './src/helper/instaDL.js';
import FbDL from './src/helper/facebookDL.js';
import chunkArray from './src/helper/chunkArr.js';
dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const TiktokLink =
  /(https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+|https:\/\/vt\.tiktok\.com\/[\w.-]+)/g;
const TwitterLink = /https:\/\/(www\.)?[^/]+\/[^/]+\/status\/\d+\?[^/]+/g;
const InstaLink =
  /^https:\/\/www\.instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+\/\?(?:[^=&]+=[^&]+&)*[^=&]+=[^&]+/;
const FacebookLink =
  /https:\/\/fb\.watch\/[^\s]+|https:\/\/www\.facebook\.com\/[^\s]+/g;
const SERVER_URL = process.env.SERVER_URL;
// Telegram API Configuration
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const URI = `/webhook/${process.env.TELEGRAM_TOKEN}`;
const webhookURL = `${SERVER_URL}${URI}`;

// middleware untuk nangkap ttdl
bot.use(async (ctx, next) => {
  const messageText = ctx.message.text;
  let loadingMessage;
  let loadingId;
  const chatId = ctx.chat.id;
  const caption = `####Made with Love by janexmgd#####`;
  if (messageText.startsWith('/tiktokdl')) {
    const commandParts = messageText.split(' ');

    if (commandParts.length !== 2) {
      // Pesan harus berisi perintah dan URL TikTok
      ctx.reply('Gunakan perintah seperti ini: /tiktokdl [URL]');
    } else {
      const urlTikTok = commandParts[1];
      const res = await scraper(urlTikTok);
      const caption = `####Made with Love by janexmgd#####`;
      if (res.data.type == 'video') {
        loadingMessage = await ctx.reply(`processing tiktok video`);
        loadingId = loadingMessage.message_id;
        await ctx.deleteMessage(loadingId);
        const VideoUrl = res.data.url;
        await bot.telegram.sendVideo(chatId, VideoUrl, {
          caption: caption,
          parse_mode: 'HTML',
        });
      } else {
        loadingMessage = await ctx.reply(`processing tiktok image`);
        loadingId = loadingMessage.message_id;
        await ctx.deleteMessage(loadingId);
        const arrMedia = [];
        let slideshowmsg = await ctx.reply(`processing tiktok slideshow`);
        let slideshowmsgId = slideshowmsg.message_id;
        for (let index = 0; index < res.data.url.length; index++) {
          const imgUrl = res.data.url[index];
          arrMedia.push({
            media: { url: imgUrl },
            type: 'photo',
            caption: caption,
            parse_mode: 'HTML',
          });
        }
        await ctx.deleteMessage(slideshowmsgId);

        const chunkArrMedia = chunkArray(arrMedia, 10);
        for (const chunk of chunkArrMedia) {
          await bot.telegram.sendMediaGroup(chatId, chunk, {
            caption: caption,
            parse_mode: 'HTML',
          });
        }
      }
      return;
    }
  }
  const isTiktokLink = messageText.match(TiktokLink);
  const isTwitterLink = messageText.match(TwitterLink);
  const isInstaLink = messageText.match(InstaLink);
  const isFacebookLink = messageText.match(FacebookLink);
  if (isTiktokLink) {
    try {
      const urlTikTok = messageText;
      const res = await scraper(urlTikTok);

      if (res.data.type == 'video') {
        loadingMessage = await ctx.reply(`processing tiktok video`);
        loadingId = loadingMessage.message_id;
        await ctx.deleteMessage(loadingId);
        const VideoUrl = res.data.url;
        await bot.telegram.sendVideo(chatId, VideoUrl, {
          caption: caption,
          parse_mode: 'HTML',
        });
      } else {
        loadingMessage = await ctx.reply(`processing tiktok image`);
        loadingId = loadingMessage.message_id;

        const arrMedia = [];
        for (let index = 0; index < res.data.url.length; index++) {
          const imgUrl = res.data.url[index];
          arrMedia.push({
            media: { url: imgUrl },
            type: 'photo',
            parse_mode: 'HTML',
          });
        }

        await ctx.deleteMessage(loadingId);

        const chunkArrMedia = chunkArray(arrMedia, 10);
        for (const chunk of chunkArrMedia) {
          await bot.telegram.sendMediaGroup(chatId, chunk);
        }
      }
      return;
    } catch (error) {
      ctx.reply(error);
      ctx.reply(error.message);
      return;
    }
  } else if (isTwitterLink) {
    try {
      const urlTwitter = messageText;
      const data = await XTwitterDL(urlTwitter);
      //
      const loadingMessage = await ctx.reply(`processing twitter link`);
      const loadingId = loadingMessage.message_id;
      const arrMedia = [];
      for (let index = 0; index < data.result.media.length; index++) {
        if (data.result.media[index].type == 'video') {
          // ctx.reply('processing video');
          // const url = res.data.result.media[index].url;
          // const response = await axios.get(url, { responseType: 'stream' });
          // await ctx.replyWithVideo({ source: response.data });
          const videoUrl = res.data.result.media[index].url;
          arrMedia.push({
            media: { url: videoUrl },
            type: 'video',
            parse_mode: 'HTML',
          });
        } else {
          // ctx.reply('processing photo');
          const imgUrl = data.result.media[index].url;
          // const responseImg = await axios.get(imgUrl, {
          //   responseType: 'arraybuffer',
          // });
          // await ctx.replyWithPhoto({ source: responseImg.data });
          arrMedia.push({
            media: { url: imgUrl },
            type: 'photo',
            parse_mode: 'HTML',
          });
        }
      }
      await ctx.deleteMessage(loadingId);

      const chunkArrMedia = chunkArray(arrMedia, 10);
      for (const chunk of chunkArrMedia) {
        await bot.telegram.sendMediaGroup(chatId, chunk);
      }
      return;
    } catch (error) {
      ctx.reply(error.message);
      return;
    }
  } else if (isInstaLink) {
    const urlInsta = messageText;
    const data = await instaDL(urlInsta);
    ctx.reply('processing instagram link');
    for (let index = 0; index < data.length; index++) {
      let urlMedia = data[index].download_link;
      console.log(urlMedia);
      const parsedUrl = urlModule.parse(urlMedia);
      const pathnameSegments = parsedUrl.pathname.split('/');
      const filenameQuery = pathnameSegments[pathnameSegments.length - 1]; // Mengambil bagian terakhir dari path sebagai nama file
      // Menghapus query string dari nama file
      const filename = filenameQuery.split('?')[0];
      const extensionMatch = filename.match(/\.(\w+)$/);
      if (extensionMatch) {
        const extension = extensionMatch[1];
        console.log(extension);
        if (extension == 'jpg') {
          const responseImg = await axios.get(urlMedia, {
            responseType: 'arraybuffer',
          });
          await ctx.replyWithPhoto({ source: responseImg.data });
        } else {
          const responseVideo = await axios.get(urlMedia, {
            responseType: 'stream',
          });
          await ctx.replyWithVideo({ source: responseVideo.data });
        }
      } else {
        // for reel ig
        const responseVideo = await axios.get(urlMedia, {
          responseType: 'stream',
        });
        await ctx.replyWithVideo({ source: responseVideo.data });
      }
    }
    ctx.reply(data);
  } else if (isFacebookLink) {
    try {
      const urlFacebook = messageText;
      ctx.reply('processing facebook link');
      const data = await FbDL(urlFacebook);
      let url;
      // console.log(`ini hd: ${data.hd}`);
      // console.log(`ini sd: ${data.sd}`);
      if (data?.hd) {
        url = data.hd;
        // const res = await axios.get(url, {
        //   responseType: 'stream',
        // });
        // await ctx.replyWithVideo({ source: res.data });
        ctx.reply(`
        hd link : ${url}
        `);
        return;
      } else if (data?.sd) {
        url = data.sd;
        // const res = await axios.get(url, {
        //   responseType: 'stream',
        // });
        // await ctx.replyWithVideo({ source: res.data });
        ctx.reply(`
        sd link : ${url}
        `);
        return;
      } else {
        ctx.reply('cannot get sd and hd video link');
      }
    } catch (error) {
      console.log(error);
      ctx.reply(error);
      return;
    }
  } else {
    ctx.reply('Pinggg!!!!!!');
    return;
  }
  ctx.reply(caption);
  ctx.reply('TASK SUCCESS');
  return;
});
const setupWebhook = async () => {
  try {
    // console.log(url);
    const url = `${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`;
    console.log(url);
    const { data } = await client({
      url: url,
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
    console.log(req.body);
    await bot.handleUpdate(req.body);
    console.log('PING !!!!!!');
    console.log(req.body);
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
