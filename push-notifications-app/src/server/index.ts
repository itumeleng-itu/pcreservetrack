import express from 'express';
import bodyParser from 'body-parser';
import { PushController } from './pushController';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const pushController = new PushController();

app.post('/subscribe', pushController.subscribeUser);
app.post('/send-notification', pushController.sendNotification);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});