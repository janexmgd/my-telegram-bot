import { TwitterDL } from 'twitter-downloader';

const XTwitterDL = async (url) => {
  try {
    const data = await TwitterDL(url);
    return data;
  } catch (error) {
    return error;
  }
};

export default XTwitterDL;
