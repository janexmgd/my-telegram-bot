import IgDL from '@sasmeee/igdl';
// import IgDL from 'instagram-url-direct';
const instaDL = async () => {
  try {
    // const url =
    //   'https://www.instagram.com/p/CybJZkLLWur/?utm_source=ig_web_copy_link';
    const data = await IgDL(url);
    return data;
  } catch (error) {
    return error;
  }
};
// instaDL();
export default instaDL;
