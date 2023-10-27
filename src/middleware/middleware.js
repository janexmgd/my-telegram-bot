import axios from 'axios';
import urlModule from 'url';
import scraper from '../helper/scraper';
import XTwitterDL from '../helper/twitterDL';
import instaDL from '../helper/instaDL';
import FbDL from '../helper/facebookDL';
import { processTikTokCommand } from '../command/start.tiktokdl';

const TiktokLink =
  /(https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+|https:\/\/vt\.tiktok\.com\/[\w.-]+)/g;
const TwitterLink = /https:\/\/(www\.)?[^/]+\/[^/]+\/status\/\d+\?[^/]+/g;
const InstaLink =
  /^https:\/\/www\.instagram\.com\/(?:p|reel)\/[A-Za-z0-9_-]+\/\?(?:[^=&]+=[^&]+&)*[^=&]+=[^&]+/;
const FacebookLink =
  /https:\/\/fb\.watch\/[^\s]+|https:\/\/www\.facebook\.com\/[^\s]+/g;

export default async (ctx, next) => {
  const messageText = ctx.message.text;
  const loadingMesssage = await ctx.reply('LOADING');
  const loadingId = loadingMesssage.message_id;

  if (messageText.startsWith('/tiktokdl')) {
    await processTikTokCommand(ctx, loadingId);
    ctx.reply('task success');
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
};
