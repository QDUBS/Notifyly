# Notifyly Notification System

## 📌 Project Overview

This project serves as a central, event-driven backend service designed to handle all messaging for the Notifyly platform, supporting various business domains like commerce, billing, and community.
Its primary goal is to decouple notification logic from individual microservices, allowing them to simply emit events while this service manages when, how, and through which channel users receive notifications.

### Key Features:

- **Event-Driven Architecture**: Consumes events from other services e.g., order.created, invoice.paid, via a simulated message broker (direct HTTP POST).
- **User Preference Management**: Allows users to define their preferred notification channels (email, SMS, in-app) globally and per notification type.
- **Multi-Channel Delivery**: Supports sending notifications via Email, SMS, and In-App channels.
- **Asynchronous Processing**: Utilizes BullMQ (powered by Redis) for reliable, asynchronous processing of notification jobs, preventing blocking of the main API thread.
- **Delivery Status Tracking**: Records the status of each notification attempt in a PostgreSQL database, providing visibility into delivery success or failure.
- **Retry Mechanisms**: Leverages BullMQ's built-in retry capabilities for transient failures and provides an administrative interface for manual retries of failed notifications.
- **Extensible Configuration**: Notification behavior (templates, default channels, rules) is driven by database configurations rather than hardcoded logic, making it easy to add new event types or channels.
- **Authentication**: Secures API endpoints using JSON Web Tokens.

-----------------------------------------------------------------------------------------------------------------------------------------------
## 🛠️ Architecture Overview

The system is built on a microservices-friendly, event-driven architecture.

### Core Components:

- **Notification Service (built with Nest.js)**: The main application, responsible for receiving events, applying business logic, persisting notification records, and enqueuing jobs. It also exposes REST APIs for users, developers, and administrators.

- **PostgreSQL Database**: Stores user preferences, notification templates, event-to-notification mappings, and all historical notification records e.g status, content, timestamps, etc.

- **Redis & BullMQ**: Redis serves as the backend for BullMQ, a robust job queue. BullMQ handles asynchronous job processing, retries, and concurrency, ensuring reliable notification delivery.

- **Notification Worker**: A dedicated process that consumes jobs from the BullMQ queue and dispatches notifications to external channels.

- **External Channel Providers**: Integrations with Email (Nodemailer/SMTP), SMS (Twilio), and In-App (internal storage/API) services.

## Key Decisions and Assumptions

- **Framework**: Nest.js was chosen for its modular structure, strong TypeScript support, dependency injection, and opinionated architecture, which promotes clean and scalable code.

- **Database**: PostgreSQL was used for its reliability, transactional integrity, and suitability for structured data like user preferences and notification logs.

- **Queueing**: BullMQ was selected for its comprehensive features (retries, delays, monitoring) and excellent integration with Node.js/TypeScript, providing a robust asynchronous processing layer.

- **Message Broker (Event Ingestion)**: Incoming events from services are received via a direct HTTP POST endpoint e.g `/api/v1/events/receive`.

- **Authentication**: JWT was used for API authentication.

- **Extensibility**: Notification templates and event-to-notification mappings are stored in the database, allowing administrators to define and modify notification behavior without code changes. Handlebars is used for flexible templating.

- **Error Handling & Logging**: Centralized logging with Winston and robust error handling mechanisms were implemented to ensure operational visibility.

- **In-App Notifications**: In-app notifications are primarily stored in the database and retrieved via an API endpoint.

-----------------------------------------------------------------------------------------------------------------------------------------------
## ⚙️ Setup Instructions
### Prerequisites
Before you begin, ensure you have the following installed:

- Node.js (LTS version, e.g., 20.x):npm is used in scripts

- Docker and Docker Compose

- PostgreSQL (if not using Docker)

- Redis (if not using Docker)

1. Clone the Repository
```bash
$ git clone https://github.com/your-username/notifyly.git
$ cd notifyly
```

2. Environment Variables
Create a .env file in the root directory of the project based on the .env.example provided. Fill in the values:
```bash
# Server Configuration
PORT=3000

# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/notifyly_db"

# Redis Configuration (for BullMQ)
REDIS_URL="redis://localhost:6379"

# JWT Authentication
JWT_SECRET="super_secret_jwt_key"
JWT_EXPIRATION_TIME="1h"

# Email Provider
EMAIL_PROVIDER_HOST="smtp.sendgrid.net"
EMAIL_PROVIDER_PORT=587
EMAIL_PROVIDER_SECURE=false
EMAIL_PROVIDER_USER="apikey"
EMAIL_PROVIDER_PASS="SENDGRID_API_KEY"
EMAIL_FROM_ADDRESS="no-reply@notifyly.com"

# SMS Provider
TWILIO_ACCOUNT_SID="xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="twilio_auth_token"
TWILIO_FROM_NUMBER="+1501712266"
```

3. Setup with Docker Compose (Recommended): This is the easiest way to get all services (PostgreSQL, Redis, and the Nest.js app) running.

- Ensure Docker and Docker Compose are installed and running.
- From the project root, run:
```bash
$ docker-compose up --build
```
This command will:

- Build the Docker image for the Nest.js application.
- Start PostgreSQL and Redis containers.
- Run database migrations automatically (configured in Dockerfile and package.json).
- Start the Nest.js application.

4. Manual Setup (Alternative): If you prefer not to use Docker Compose:

- Install Dependencies:
```bash
$ npm install
```
- Start PostgreSQL & Redis: Ensure your PostgreSQL and Redis instances are running and accessible at the DATABASE_URL and REDIS_URL specified in your .env file.
- Run Database Migrations:
```bash
$ npm run migration:run
```
This will create all necessary tables in your PostgreSQL database.
- Seed Initial Data:
```bash
$ npm run seed:templates
```
This script populates the notification_templates and event_notification_mappings tables with sample data.
- Start the Application:
```bash
$ npm run start:dev # For development with hot-reloading
```

# Or for production:

# npm run build

# npm run start:prod

The application will be running on http://localhost:3000 (or your specified PORT).

-----------------------------------------------------------------------------------------------------------------------------------------------
## 🔍Testing the API
You can use curl or a tool like Postman to interact with the API.

### Generating Test JWT Tokens
For testing authenticated endpoints, you'll need JWT tokens. You can generate them using a simple script:

```bash
// Save this as generate-token.js and run with `node generate-token.js`
const jwt = require('jsonwebtoken');
const secret = 'super_secret_jwt_key'; // MUST match your .env JWT_SECRET

// Example User IDs
const testUserId = 'd7e9f8a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a';
const testAdminId = 'a0b1c2d3-e4f5-6789-0123-456789abcdef';

const userToken = jwt.sign({ sub: testUserId, roles: ['user'] }, secret, { expiresIn: '1h' });
const adminToken = jwt.sign({ sub: testAdminId, roles: ['user', 'admin'] }, secret, { expiresIn: '1h' });

console.log('--- JWT Tokens ---');
console.log('User ID:', testUserId);
console.log('User Token:', userToken);
console.log('\nAdmin ID:', testAdminId);
console.log('Admin Token:', adminToken);
console.log('------------------');
```

Use the generated `User Token` for requests and `Admin Token` for admin requests.

### Sample API Calls (using `curl`)
Replace `USER_JWT_TOKEN` and `ADMIN_JWT_TOKEN` with the tokens generated above.

1. Emit an Event
This simulates another microservice sending an event to the Notification System.

```bash
    curl -X POST http://localhost:3000/api/v1/events/receive \
    -H "Content-Type: application/json" \
    -d '{
            "eventType": "order.created",
            "payload": {
                "userId": "d7e9f8a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a",
                "orderId": "ORD-001-XYZ",
                "userName": "Confidence Isaiah",
                "email": "confidence.isaiah@example.com",
                "phoneNumber": "+2347077773333",
                "totalAmount": 125.50,
                "productName": "Wireless Headphones"
            }
        }'
```

Expected Response: `HTTP/1.1 202 Accepted` and `{"message": "Event received and processing initiated."}`. This will enqueue notifications for email and in-app based on default mappings.

2. Update User Preferences
```bash
   curl -X PUT http://localhost:3000/api/v1/users/me/preferences \
   -H "Content-Type: application/json" \
   -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
   -d '{
        "global": {
        "email": true,
        "sms": false,
        "in_app": true
        },
        "notificationTypes": {
            "order.created": {
                "email": true,
                "in_app": false
            },
            "invoice.paid": {
                "sms": true,
                "in_app": true
            }
        }
   }'
```

3. Get User In-App Notifications
```bash
   curl -X GET http://localhost:3000/api/v1/users/me/notifications/in-app \
   -H "Authorization: Bearer USER_JWT_TOKEN"
```

5. Admin - Inspect All Notifications (e.g., FAILED)
```bash
   curl -X GET "http://localhost:3000/api/v1/admin/notifications?status=FAILED" \
   -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

6. Admin - Retry a Failed Notification
First, use the Admin Inspect API to find the id of a notification that has status: "FAILED".

```bash
curl -X POST http://localhost:3000/api/v1/admin/notifications/YOUR_FAILED_NOTIFICATION_ID/retry \
-H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Stay in touch

- Author - [Confidence Isaiah](mailto:qdubsmusk@gmail.com)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).