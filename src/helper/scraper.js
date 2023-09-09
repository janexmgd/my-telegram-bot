import client from '../app/client.js';
const scraper = async (url) => {
  try {
    const res = await client({
      url: 'https://tiktok-post-dl-backend.vercel.app/tiktokdl/single',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        url: url,
      },
    });
    const data = res.data;
    return data;
  } catch (error) {
    return error;
  }
};
export default scraper;
