# Push Notifications App

## Overview
This project implements a push notification system that allows users to receive urgent updates in real-time. The application consists of a client-side component that handles the display of notifications and a server-side component that manages subscriptions and sends notifications.

## Project Structure
```
push-notifications-app
├── src
│   ├── client
│   │   ├── index.ts          # Entry point for the client-side application
│   │   ├── serviceWorker.ts   # Service worker implementation for handling push notifications
│   │   └── notifications.ts    # Functions for requesting notification permissions and displaying notifications
│   ├── server
│   │   ├── index.ts          # Entry point for the server-side application
│   │   └── pushController.ts  # Class for managing push notification subscriptions and sending notifications
│   └── types
│       └── index.ts          # Interfaces for push notification data and user subscription information
├── package.json               # npm configuration file
├── tsconfig.json              # TypeScript configuration file
└── README.md                  # Project documentation
```

## Features
- **Real-time Notifications**: Users receive immediate updates when events occur (e.g., "Computer #12 freed up NOW!").
- **Service Worker**: Utilizes a service worker to manage background notifications.
- **User Subscription**: Users can subscribe to notifications and manage their preferences.

## Getting Started
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd push-notifications-app
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm run start
   ```
5. Open the client application in your browser.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License.