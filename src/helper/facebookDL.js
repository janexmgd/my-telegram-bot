import axios from 'axios';

const FbDL = async (url) => {
  try {
    const options = {
      method: 'GET',
      url: 'https://fb-video-reels.p.rapidapi.com/api/getSocialVideo',
      params: {
        url: url,
        filename: 'Test video',
      },
      headers: {
        'X-RapidAPI-Key': '7cb05360f8mshca6918f8ea33103p1c4264jsn97b178de78f8',
        'X-RapidAPI-Host': 'fb-video-reels.p.rapidapi.com',
      },
    };
    const res = await axios.request(options);
    // console.log(res.data.links);
    return res.data.links;
  } catch (error) {
    return error;
  }
};
// FbDL(
//   'https://www.facebook.com/rage.gohan/videos/274319698384702?idorvanity=1540015142914341'
// );
// FbDL('https://fb.watch/nIIfs7usT0/?mibextid=Nif5oz');
export default FbDL;
