import facebookDL from '@xaviabot/fb-downloader';

const FbDL = async (url) => {
  try {
    const data = await facebookDL(url);
    return data;
  } catch (error) {
    return error;
  }
};
// FbDL(
//   'https://www.facebook.com/rage.gohan/videos/274319698384702?idorvanity=1540015142914341'
// );
// FbDL('https://fb.watch/nIIfs7usT0/?mibextid=Nif5oz');
export default FbDL;
