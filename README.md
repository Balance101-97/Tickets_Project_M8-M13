# Ticket Project

A ticket management system developed with Node.js and Express, featuring a complete RESTful API with webhook support for external system integration.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Tickets](#tickets)
  - [Statistics](#statistics)
  - [Webhooks](#webhooks)
- [Project Structure](#project-structure)
- [Webhook System](#webhook-system)
- [Testing](#testing)
- [Technologies Used](#technologies-used)
- [License](#license)

## Features

- Complete CRUD operations for ticket management
- Real-time webhook notification system
- Aggregated ticket statistics
- Pagination and sorting of results
- Filtering by status, priority, and CI Cat
- SQLite database (lightweight and zero-configuration)
- Layered architecture (Routes, Controllers, Services, Repositories)
- Separate webhook receiver server

## Architecture

```
┌─────────────────────┐     Webhook Events     ┌─────────────────────┐
│   server-main       │ ──────────────────────>│   server-receiver   │
│   (Main API)        │                        │   (Webhook Receiver)│
│   Port: 3000        │                        │   Port: 4000        │
└─────────────────────┘                        └─────────────────────┘
         │
         ▼
┌─────────────────────┐
│   SQLite Database   │
│   (data/app.db)     │
└─────────────────────┘
```

## Configuration

### Environment Variables

#### Main Server (`server-main/.env`)

```env
PORT=3000
DB_FILE=./data/app.db
WEBHOOK_SECRET=your_webhook_secret_here
```

#### Receiver Server (`server-receiver/.env`)

```env
PORT=4000
WEBHOOK_SECRET=your_webhook_secret_here
```

| Variable | Description |
|----------|-------------|
| `PORT` | Port where the server will run |
| `DB_FILE` | Path to the SQLite database file |
| `WEBHOOK_SECRET` | Secret key for webhook validation (must be the same on both servers) |

## Running the Application

**Terminal 1 - Main Server:**
```bash
cd server-main
npm i
npm start
```
if db is not created:

```bash
cd server-main
npm i
CSV_PATH="/pathToCSVFile" npm start
```

**Terminal 2 - Webhook Receiver Server:**
```bash
cd server-receiver
npm i
npm start
```
or

```bash
cd server-receiver
npm i
PORT=**** npm start
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check if the server is online |

**Example:**
Server-main
```bash
curl http://localhost:3000/health
```
**Response:**
```json
{
    "status": "ok",
    "db": true,
    "time": "2026-02-05T10:40:32.032Z"
}
```
**Example:**
Server-receiver
```bash
curl http://localhost:4000/health
```

**Response:**
```json
{ "status": "ok" }
```

---

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets` | List all tickets (with pagination) |
| GET | `/tickets/:id` | Get a specific ticket |
| POST | `/tickets` | Create a new ticket |
| PATCH | `/tickets/:id` | Update an existing ticket |
| DELETE | `/tickets/:id` | Delete a ticket |

#### List Tickets

**GET** `/tickets`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of results (max: 100) |
| `offset` | number | 0 | Number of records to skip |
| `status` | string | - | Filter by status |
| `priority` | string | - | Filter by priority |
| `ci_cat` | string | - | Filter by CI_Cat |
| `sort_by` | string | id | Field to sort by |
| `sort_dir` | string | asc | Direction (asc/desc) |

**Example:**
```bash
curl "http://localhost:3000/tickets?status=Open&priority=2&offset=0&limit=10"
```

**Response:**
```json
{
  "data": [
        {
            "id": 46625,
            "CI_Name": "Payment API",
            "CI_Cat": "Backend",
            "Status": "Open",
            "Priority": "2",
            "Open_Time": "2026-02-03T10:00:00Z",
            "Close_Time": null,
            "created_at": "2026-02-04 12:00:52",
            "updated_at": "2026-02-04 12:00:52"
        }
    ],
    "paging": {
        "total": 13,
        "limit": 10,
        "offset": 0
    }
}
```

#### Get Ticket by ID

**GET** `/tickets/:id`

**Example:**
```bash
curl http://localhost:3000/tickets/1
```

**Response:**
```json
{
    "data": {
        "id": 1,
        "CI_Name": "SUB000508",
        "CI_Cat": "subapplication",
        "Status": "Closed",
        "Priority": "4",
        "Open_Time": "5/2/2012 13:32",
        "Close_Time": "2026-02-03T11:00:00Z",
        "created_at": "2026-01-30 16:53:48",
        "updated_at": "2026-02-03 12:10:50"
    }
}
```

#### Create Ticket

**POST** `/tickets`

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `CI_Name` | string | No | Configuration Item name |
| `CI_Cat` | string | No | CI category |
| `Status` | string | No | Ticket status (default: "Work In Progress") |
| `Priority` | string | No | Priority level (default: "1") |
| `Open_Time` | string | **Yes** | Opening date/time (ISO 8601) |
| `Close_Time` | string | No | Closing date/time |

**Example:**
```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "CI_Name": "Payment API",
    "CI_Cat": "Backend",
    "Status": "Open",
    "Priority": "2",
    "Open_Time": "2026-02-02T11:00:00Z"
  }'
```

**Response (201 Created):**
```json
{
    "data": {
        "id": 46629,
        "CI_Name": "Payment API",
        "CI_Cat": "Backend",
        "Status": "Open",
        "Priority": "2",
        "Open_Time": "2026-02-03T10:00:00Z",
        "Close_Time": null,
        "created_at": "2026-02-05 10:51:17",
        "updated_at": "2026-02-05 10:51:17"
    }
}
```

#### Update Ticket

**PATCH** `/tickets/:id`

**Example:**
```bash
curl -X PATCH http://localhost:3000/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{
    "Status": "Open",
    "Close_Time": "2026-02-03T11:00:00Z"
}'
```

**Response:**
```json
{
    "data": {
        "before": {
            "id": 1,
            "CI_Name": "SUB000508",
            "CI_Cat": "subapplication",
            "Status": "Closed",
            "Priority": "4",
            "Open_Time": "5/2/2012 13:32",
            "Close_Time": "2026-02-03T11:00:00Z",
            "created_at": "2026-01-30 16:53:48",
            "updated_at": "2026-02-03 12:10:50"
        },
        "after": {
            "id": 1,
            "CI_Name": "SUB000508",
            "CI_Cat": "subapplication",
            "Status": "Open",
            "Priority": "4",
            "Open_Time": "5/2/2012 13:32",
            "Close_Time": "2026-02-03T11:00:00Z",
            "created_at": "2026-01-30 16:53:48",
            "updated_at": "2026-02-05 12:19:43"
        }
    }
}
```

#### Delete Ticket

**DELETE** `/tickets/:id`

**Example:**
```bash
curl -X DELETE http://localhost:3000/tickets/44619
```

**Response:**
```json
{
    "data": {
        "id": 44619,
        "CI_Name": "DCE000110",
        "CI_Cat": "hardware",
        "Status": "Closed",
        "Priority": "3",
        "Open_Time": "20-03-2014 12:56",
        "Close_Time": "21-03-2014 15:36",
        "created_at": "2026-01-30 17:10:31",
        "updated_at": "2026-01-30 17:10:31"
    }
}
```

---

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats/tickets` | Get aggregated ticket statistics |

**Example:**
```bash
curl http://localhost:3000/stats/tickets
```

**Response:**
```json
{
    "data": {
        "totals": {
            "total": 46621,
            "open": 15,
            "closed": 46606,
        },
        "by_status": [
            {
                "status": "Closed",
                "count": 46596
            },
            {
                "status": "Open",
                "count": 16
            },
            {
                "status": "Work in progress",
                "count": 9
            }
        ],
        "by_priority": [
            {
                "priority": "4",
                "count": 22714
            },
            {
                "priority": "5",
                "count": 16486
            },
            {
                "priority": "3",
                "count": 5322
            },
            {
                "priority": "NA",
                "count": 1380
            },
            {
                "priority": "2",
                "count": 715
            },
            {
                "priority": "1",
                "count": 4
            }
        ]
    }
}
```

---

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhooks/subscriptions` | List all subscriptions |
| POST | `/webhooks/subscriptions` | Create a new subscription |
| DELETE | `/webhooks/subscriptions/:id` | Delete a subscription |
<!-- | POST | `/webhooks/test` | Test webhook dispatch | -->

#### List Subscriptions

**GET** `/webhooks/subscriptions`

**Example:**
```bash
curl http://localhost:3000/webhooks/subscriptions
```

#### Create Subscription

**POST** `/webhooks/subscriptions`

**Example:**
```bash
curl -X POST http://localhost:3000/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:4000/webhook",
    "events": ["ticket.created", "ticket.updated", "ticket.deleted"]
  }'
```

#### Delete Subscription

**DELETE** `/webhooks/subscriptions/:id`

**Example:**
```bash
curl -X DELETE http://localhost:3000/webhooks/subscriptions/1
```

## Project Structure

```
Ticket_Project/
├── server-main/                 # Main API
│   ├── data/
│   │   └── app.db               # SQLite database
│   ├── src/
│   │   ├── controllers/         # HTTP logic (req/res)
│   │   │   ├── healthController.js
│   │   │   ├── ticketController.js
│   │   │   ├── statsController.js
│   │   │   └── webhookController.js
│   │   ├── db/                  # Database configuration
│   │   │   ├── index.js
│   │   │   ├── schema.sql
│   │   │   └── migrate.js
│   │   ├── middlewares/         # Express middlewares
│   │   │   ├── errorMiddleware.js
│   │   │   └── index.js
│   │   ├── reposositories       # Database access
│   │   │   ├── ticketRepo.js
│   │   │   └── webhookRepo.js
│   │   ├── routes/              # Route definitions
│   │   │   ├── healthRoutes.js
│   │   │   ├── ticketRoutes.js
│   │   │   ├── statsRoutes.js
│   │   │   └── webhookRoutes.js
│   │   ├── services/            # Business logic
│   │   │   ├── csvImport.service.js
│   │   │   ├── webhooks.service.js
│   │   │   └── webhookDispatcher.service.js
│   │   ├── app.js               # Express configuration
│   │   └── server.js            # Entry point
│   ├── .env                     # Environment variables
│   └── package.json
│   └── package-lock.json
│   └── openapi.yaml
│
├── server-receiver/             # Webhook Receiver Server
│   ├── src/
│   │   ├── controllers/
│   │   │   └── webhook.controller.js
│   │   ├── routes/
│   │   │   └── webhook.routes.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env                     # Environment variables
│   └── package.json
│   └── package-lock.json
│   └── openapi.yaml
│
├── README.md
├── .gitignore
└── LICENSE
```

## Webhook System

The system automatically triggers webhooks when ticket events occur:

| Event | Trigger |
|-------|---------|
| `ticket.created` | A new ticket is created |
| `ticket.updated` | A ticket is updated |
| `ticket.deleted` | A ticket is deleted |

### How It Works

1. **Register subscription** - Configure URL and events to receive
2. **Ticket operation** - Create, update, or delete a ticket
3. **Automatic dispatch** - Webhook is sent to all subscribers
4. **Reception** - The `server-receiver` receives and processes the event

### Complete Configuration Example

**1. Register subscription:**
```bash
curl -X POST http://localhost:3000/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:4000/webhook",
    "events": ["ticket.created", "ticket.updated", "ticket.deleted"]
  }'
```

**2. Create ticket (triggers `ticket.created`):**
```bash
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "CI_Name": "Test Service",
    "Status": "Open",
    "Priority": "1",
    "Open_Time": "2026-02-02T10:00:00Z"
  }'
```

**3. Check `server-receiver` logs** - Should show the received webhook.

### Manual Testing

**Check Health:**
```bash
curl http://localhost:3000/health
curl http://localhost:4000/health
```

**Complete Flow:**
```bash
# 1. Health
curl http://localhost:3000/health 

# 2. List subscriptions
curl http://localhost:3000/webhooks/subscriptions

# 3. Create subscription 
curl -X POST http://localhost:3000/webhooks/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:4000/webhooks",
    "events": ["ticket.created","ticket.updated","ticket.deleted"]
  }'
# 4. Delete (change <SUB_ID>)
curl -X DELETE http://localhost:3000/webhooks/subscriptions/<SUB_ID>

# 5. List tickets
curl http://localhost:3000/tickets

# 6. List tickets with page
curl "http://localhost:3000/tickets?offset=20&limit=10"

# 7. List tickets filter by status
curl "http://localhost:3000/tickets?status=Open"

# 8. List tickets filter by priority
curl "http://localhost:3000/tickets?priority=1"

# 9. List tickets filter by CI_Cat
curl "http://localhost:3000/tickets?ci_Cat=Payment%20API"

# 10. Combo of filter
curl "http://localhost:3000/tickets?status=Open&priority=2&offset=0&limit=10"

# 11. Order tickects
curl "http://localhost:3000/tickets?sort_by=id&sort_dir=desc&offset=0&limit=10"

# 12. Create ticket
curl -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "CI_Name": "Payment API",
    "CI_Cat": "Backend",
    "Status": "Open",
    "Priority": "2",
    "Open_Time": "2026-02-03T10:00:00Z",
    "Close_Time": null
  }'

# 13. Get ticket by id (chnage <ID>)
curl http://localhost:3000/tickets/<ID>


# 14. Update ticket
curl -X PATCH http://localhost:3000/tickets/46621 \
  -H "Content-Type: application/json" \
  -d '{
    "Status": "Closed",
    "Close_Time": "2026-02-03T11:00:00Z"
  }'

# 15. View statistics
curl http://localhost:3000/stats/tickets

# 16. Delete ticket
curl -X DELETE http://localhost:3000/tickets/1
```

---

## Technologies Used

| Technology | Version | Description |
|------------|---------|-------------|
| Node.js | 18+ | JavaScript runtime |
| Express.js | 4.19.2 | Web framework |
| SQLite3 | 5.1.7 | Database |
| csv-parse | 6.1.0 | CSV file parsing |
| dotenv | 16.4.5 | Environment variable management |
| nodemon | 3.1.4 | Development hot-reload |

---

## License

This project is licensed under the license specified in the [LICENSE](LICENSE) file.

---

**Developed for Module 8 - Upskills**
