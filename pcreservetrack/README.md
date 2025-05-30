# PCReserveTrack

PCReserveTrack is a web application that allows users to receive real-time push notifications for computer availability. This application utilizes service workers and the web-push library to manage notifications effectively.

## Features

- User-friendly interface for managing computer reservations.
- Real-time push notifications when computers become available.
- Service worker implementation for handling notifications even when the app is not open.

## Project Structure

```
pcreservetrack
├── src
│   ├── App.tsx                     # Main entry point of the application
│   ├── components
│   │   └── NotificationPermission.tsx # Component for managing notification permissions
│   ├── services
│   │   └── NotificationService.ts   # Service for handling notifications
│   ├── service-worker.ts            # Service worker for push notifications
│   └── server
│       ├── services
│       │   ├── ComputerService.ts   # Logic related to computer availability
│       │   └── PushNotificationService.ts # Service for sending push notifications
│       └── index.ts                 # Entry point for server-side logic
├── package.json                     # NPM configuration file
├── tsconfig.json                    # TypeScript configuration file
├── .env                              # Environment variables
└── README.md                        # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd pcreservetrack
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Generate VAPID keys for push notifications:
   ```
   npx web-push generate-vapid-keys
   ```

4. Add the generated VAPID keys to the `.env` file:
   ```
   VAPID_PUBLIC_KEY=your_generated_public_key
   VAPID_PRIVATE_KEY=your_generated_private_key
   ```

5. Start the application:
   ```
   npm start
   ```

## Usage

- Upon loading the application, users will be prompted to enable push notifications.
- Users will receive notifications when computers become available for reservation.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.