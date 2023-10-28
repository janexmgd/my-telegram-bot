import client from '../app/client.js';
// import IgDL from 'instagram-url-direct';
const instaDL = async (url) => {
  try {
    const res = await client({
      url: 'https://sosmed-wrapper.vercel.app/igdl',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        url: url,
      },
    });
    const data = res.data;
    console.log(data);
    return data;
  } catch (error) {
    return error;
  }
};
// instaDL('https://www.instagram.com/p/Cy64VE5LzNN/?igshid=NTc4MTIwNjQ2YQ==');
export default instaDL;
