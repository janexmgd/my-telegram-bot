// DENNY
import express from 'express';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
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
  const caption = ` Made with ♡ by janexmgd `;
  if (messageText.startsWith('/check_authList')) {
    try {
      const r = await axios.get(`https://app-auth-one.vercel.app/auth`);
      const list = JSON.stringify(r.data.data);
      if (r.data.data.length == 0) {
        ctx.reply('no user registered');
      } else {
        ctx.reply(`Found ${r.data.data.length} user`);
        ctx.reply(list);
      }
    } catch (error) {
      ctx.reply(error);
      ctx.reply(error.message);
    }
  }
  if (messageText.startsWith('/create_auth')) {
    const commandParts = messageText.split(' ');
    if (commandParts.length !== 2) {
      ctx.reply('Gunakan perintah seperti ini: /tiktokdl [machine_id]');
    } else {
      const machine_id = commandParts[1];
      try {
        const r = await axios.post(
          `https://app-auth-one.vercel.app/auth/create`,
          {
            machine_id: machine_id,
          }
        );
        if (r.data) {
          const { id, token, machine_id } = r.data.data;
          const message = `id : ${id}\nmachine_id : ${machine_id}\ntoken : ${token}`;
          ctx.reply(message);
        }
      } catch (error) {
        ctx.reply(error);
        ctx.reply(error.message);
      }
    }
  }
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
  let typeLink;
  if (isTiktokLink) {
    try {
      await ctx.reply('mememek');
      const url = messageText;
      // const res = await scraper(urlTikTok);
      const pattern = /https:\/\/www\.tiktok\.com\/@[^/]+\/video\/(\d+)/;
      let urlData;
      loadingMessage = await ctx.reply(`processing tiktok video`);
      if (url.match(pattern)) {
        // console.log('pong');
        urlData = url;
      } else {
        try {
          const res = await client({
            url: url,
            method: 'GET',
          });
          const redirectMatch = res.request.res.responseUrl.match(pattern);
          if (redirectMatch) {
            // console.log(redirectMatch);
            console.log(urlData);
            urlData = redirectMatch[0];
          }
        } catch (error) {
          const match = error.request._currentUrl.match(pattern);
          if (match) {
            console.log(urlData);
            urlData = match[0];
          }
          throw new Error('PARSE must be a boolean!');
        }
      }
      const { data } = await axios.post(
        `https://api.cobalt.tools/api/json`,
        {
          url: urlData,
        },
        {
          headers: {
            accept: 'application/json',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            origin: 'https://cobalt.tools',
            pragma: 'no-cache',
            priority: 'u=1, i',
            referer: 'https://cobalt.tools/',
            'sec-ch-ua':
              '"Not/A)Brand";v="8", "Chromium";v="126", "Brave";v="126"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'sec-gpc': '1',
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          },
        }
      );

      loadingId = loadingMessage.message_id;
      await ctx.deleteMessage(loadingId);
      const VideoUrl = data.url;
      console.log(data);
      await bot.telegram.sendVideo(chatId, VideoUrl, {
        parse_mode: 'HTML',
      });
      return;
      if (res.data.type == 'video') {
        loadingMessage = await ctx.reply(`processing tiktok video`);
        loadingId = loadingMessage.message_id;
        await ctx.deleteMessage(loadingId);
        const VideoUrl = res.data.url;
        await bot.telegram.sendVideo(chatId, VideoUrl, {
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
      typeLink = 'Tiktok';
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
          const videoUrl = data.result.media[index].url;
          arrMedia.push({
            media: { url: videoUrl },
            type: 'video',
            parse_mode: 'HTML',
          });
        } else {
          const imgUrl = data.result.media[index].url;
          arrMedia.push({
            media: { url: imgUrl },
            type: 'photo',
            parse_mode: 'HTML',
          });
        }
      }
      await ctx.deleteMessage(loadingId);
      typeLink = 'Twitter';
      const chunkArrMedia = chunkArray(arrMedia, 10);
      for (const chunk of chunkArrMedia) {
        await bot.telegram.sendMediaGroup(chatId, chunk);
      }
    } catch (error) {
      ctx.reply('fail error');
      return;
    }
  } else if (isInstaLink) {
    const urlInsta = messageText;
    const res = await instaDL(urlInsta);
    const data = res.data;
    const loadingMessage = await ctx.reply('processing instagram link');
    const loadingId = loadingMessage.message_id;
    const arrMedia = [];
    for (let index = 0; index < data.mediaUrl.length; index++) {
      const currentIndex = data.mediaUrl[index];
      let urlMedia = currentIndex.url;
      if (currentIndex.type == 'image') {
        arrMedia.push({
          media: { url: urlMedia },
          type: 'photo',
          parse_mode: 'HTML',
        });
      } else {
        arrMedia.push({
          media: { url: urlMedia },
          type: 'video',
          parse_mode: 'HTML',
        });
      }
      console.log(currentIndex);
    }
    typeLink = 'Instagram';
    await ctx.deleteMessage(loadingId);
    const chunkArrMedia = chunkArray(arrMedia, 10);
    for (const chunk of chunkArrMedia) {
      await bot.telegram.sendMediaGroup(chatId, chunk);
    }
  } else if (isFacebookLink) {
    try {
      const urlFacebook = messageText;
      ctx.reply('processing facebook link');
      const data = await FbDL(urlFacebook);
      let url;
      // console.log(`ini hd: ${data.hd}`);
      // console.log(`ini sd: ${data.sd}`);
      if (data?.quality?.hd) {
        url = data.quality.hd;
        // const res = await axios.get(url, {
        //   responseType: 'stream',
        // });
        // await ctx.replyWithVideo({ source: res.data });
        ctx.reply(`
        hd link : ${url}
        `);
        return;
      } else if (data?.quality?.sd) {
        url = data.quality.sd;
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
    ctx.reply(`${caption}`);
    return;
  }
  ctx.reply(`Success get media from ${typeLink}\n${caption}`);
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
