import axios from 'axios';
import { sendPhoto, sendVideo } from '../helper/sendMessage';

export async function processTikTokCommand(ctx, loadingId) {
  const messageText = ctx.message.text;
  const commandParts = messageText.split(' ');

  if (commandParts.length !== 2) {
    ctx.reply('Use command like: /tiktokdl [URL]');
  }

  const urlTikTok = commandParts[1];

  try {
    const res = await scraper(urlTikTok);
    if (res.data.type === 'video') {
      const caption = `<a href="${urlTikTok}">🔗 Tiktok Link</a>`;
      await sendVideo(ctx, res.data.url, caption, loadingId);
      return 'Video telah diproses.';
    } else {
      const mediaUrls = [];
      const caption = `<a href="${urlTikTok}">🔗 Tiktok Link</a>`;
      for (let index = 0; index < res.data.url.length; index++) {
        const imgUrl = res.data.url[index];
        mediaUrls.push({ media: imgUrl, caption: caption, parse_mode: 'HTML' });
      }
      const chunkedMediaUrls = chunkArray(mediaUrls, 10);

      for (const chunk of chunkedMediaUrls) {
        await ctx.replyWithMediaGroup(chunk);
      }
      return 'Task succeed';
    }
  } catch (error) {
    return 'Terjadi kesalahan saat memproses: ' + error.message;
  }
}
