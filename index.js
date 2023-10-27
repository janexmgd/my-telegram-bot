import express from 'express';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import client from './src/app/client.js';
import middleware from './src/middleware/middleware.js';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const SERVER_URL = process.env.SERVER_URL;
// Telegram API Configuration
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}`;
const URI = `/webhook/${process.env.TELEGRAM_TOKEN}`;
const webhookURL = `${SERVER_URL}${URI}`;

// middleware untuk nangkap ttdl
bot.use(middleware);
const setupWebhook = async () => {
  try {
    // console.log(url);
    const url = `${TELEGRAM_API}/setWebhook?url=${webhookURL}&drop_pending_updates=true`;
    console.log(url);
    const { data } = await client({
      url: url,
      method: 'GET',
    });
    console.log(data);
  } catch (error) {
    return error;
  }
};
const server = express();
server.use(express.json());
const PORT = process.env.PORT;

server.get('/', (req, res) => {
  res.json({
    body: req.body,
    query: req.query,
    cookies: req.cookies,
  });
});
server.post(URI, async (req, res) => {
  try {
    console.log(req.body);
    await bot.handleUpdate(req.body);
    console.log('PING !!!!!!');
    console.log(req.body);
    res.status(200).send('ok');
  } catch (error) {
    console.log(error);
  }
});
server.listen(PORT, '0.0.0.0', async () => {
  try {
    await setupWebhook();
    bot.launch();
    console.log(`bot tele and Webhook RUN at PORT ${PORT}`);
    if (process.env.TELEGRAM_TOKEN == undefined || SERVER_URL == undefined) {
      throw new Error('failed no environment');
    }
  } catch (error) {
    console.log(error);
  }
});
