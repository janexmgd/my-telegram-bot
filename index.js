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
  if (messageText.startsWith('/tiktokdl')) {
    const commandParts = messageText.split(' ');

    if (commandParts.length !== 2) {
      // Pesan harus berisi perintah dan URL TikTok
      ctx.reply('Gunakan perintah seperti ini: /tiktokdl [URL]');
    } else {
      const urlTikTok = commandParts[1];

      try {
        // ctx.reply(`downloading ${urlTikTok}`);
        const res = await scraper(urlTikTok);
        if (res.data.type == 'video') {
          loadingMessage = await ctx.reply(`processing tiktok video`);
          const caption = `<a href="${urlTikTok}">🔗 Tiktok Link</a>`;
          const url = res.data.url;
          // const response = await axios.get(url, { responseType: 'stream' });
          // await ctx.replyWithVideo({ source: response.data });
          ctx.replyWithVideo({ source: url }, { caption: caption });
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
        return;
      } catch (error) {
        ctx.reply(error.message);
        return;
      }
    }
  }
  const isTiktokLink = messageText.match(TiktokLink);
  const isTwitterLink = messageText.match(TwitterLink);
  const isInstaLink = messageText.match(InstaLink);
  const isFacebookLink = messageText.match(FacebookLink);
  if (isTiktokLink) {
    try {
      const urlTikTok = messageText;
      // ctx.reply(`downloading ${urlTikTok}`);
      const res = await scraper(urlTikTok);
      const caption = `
      <a href="${urlTikTok}">Link Tiktok</a>
      Made with Love by janexmgd
      `;
      if (res.data.type == 'video') {
        loadingMessage = await ctx.reply(`processing tiktok video`);
        loadingId = loadingMessage.message_id;
        await ctx.deleteMessage(loadingId);

        const resImg = await axios.get(res.data.url, {
          responseType: 'stream',
        });
        await ctx.replyWithVideo(
          { source: resImg.data },
          { caption: caption, parse_mode: 'HTML' }
        );
      } else {
        loadingMessage = await ctx.reply(`processing tiktok image`);
        loadingId = loadingMessage.message_id;
        await ctx.deleteMessage(loadingId);
        const arrMedia = [];
        for (let index = 0; index < res.data.url.length; index++) {
          loadingMessage = await ctx.reply(
            `processing slideshow ${index} / ${res.data.length}`
          );
          const imgUrl = res.data.url[index];
          const responseImg = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
          });
          arrMedia.push({
            media: responseImg,
            caption: caption,
            parse_mode: 'HTML',
          });
          await ctx.deleteMessage(loadingMessage.id);
        }

        const chunkArrMedia = chunkArray(arrMedia, 3);
        for (const chunk of chunkArrMedia) {
          await ctx.sendMediaGroup(chunk);
        }
      }
      return;
    } catch (error) {
      ctx.reply(error.message);
      return;
    }
  } else if (isTwitterLink) {
    try {
      const urlTwitter = messageText;
      const data = await XTwitterDL(urlTwitter);
      //
      ctx.reply(`processing twitter link`);
      for (let index = 0; index < data.result.media.length; index++) {
        if (data.result.media[index].type == 'video') {
          // ctx.reply('processing video');
          const url = res.data.result.media[index].url;
          const response = await axios.get(url, { responseType: 'stream' });
          await ctx.replyWithVideo({ source: response.data });
        } else {
          // ctx.reply('processing photo');
          const imgUrl = data.result.media[index].url;
          const responseImg = await axios.get(imgUrl, {
            responseType: 'arraybuffer',
          });
          await ctx.replyWithPhoto({ source: responseImg.data });
        }
      }
      ctx.reply('task success');
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
