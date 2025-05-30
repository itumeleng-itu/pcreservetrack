import express from 'express';
import bodyParser from 'body-parser';
import { PushNotificationService } from './services/PushNotificationService';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

PushNotificationService.initialize();

app.post('/api/push-subscriptions', async (req, res) => {
  const subscription = req.body;

  // Save the subscription to your database
  // Implement your database logic here

  res.status(201).json(subscription);
});

// Additional routes can be added here

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});