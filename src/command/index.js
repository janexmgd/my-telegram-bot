// it command below
import scraper from '../helper/scraper.js';
import axios from 'axios';
import bot from '../app/bot.js';
const command = async (reqBody) => {
  try {
    // middleware untuk nangkap ttdl
    // bot.handleUpdate(reqBody);
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
            const response = await axios.get(videoUrl, {
              responseType: 'stream',
            });
            await ctx.replyWithVideo({ source: response.data });
            ctx.reply('success download video');
          } catch (error) {
            console.error('Gagal mengunduh video:', error);
          }
        }
      }
      return;
    });
    bot.handleUpdate(reqBody);
  } catch (error) {
    return error;
  }
};
export default command;
