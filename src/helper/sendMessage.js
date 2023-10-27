export const sendPhoto = async (ctx, url, caption, loadingId) => {
  try {
    const chatId = ctx.chat.id;
    await ctx.telegram.editMessageMedia(chatId, loadingId, {
      type: 'photo',
      media: { url: url },
      caption: {
        caption,
      },
    });
  } catch (error) {
    console.log('error sending photo' + error);
    ctx.reply('error sending photo' + error);
  }
};
export const sendVideo = async (ctx, url, caption, loadingId) => {
  try {
    const chatId = ctx.chat.id;
    await ctx.telegram.editMessageMedia(chatId, loadingId, {
      type: 'video',
      media: { url: url },
      caption: {
        caption,
      },
    });
  } catch (error) {
    console.log('error sending video' + error);
    ctx.reply('error sending video' + error);
  }
};
export const sendMediaGroup = async (ctx, mediaGroup, loadingId) => {
  try {
    const chatId = ctx.chat.id;
    await ctx.telegram.editMessageMedia(chatId, loadingId, mediaGroup);
  } catch (error) {
    console.log('error sending mediagroup' + error);
    ctx.reply('error sending mediagroup' + error);
  }
};
