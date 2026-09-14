# AI-Powered Incident Management System

A full-stack Incident Management System built for the SBITS technical assignment. The application provides authentication and role-based access, incident lifecycle management, comments, search/filtering, SQL Server persistence, MongoDB activity history, AI-assisted incident analysis, and an AI Agent for investigation and similar-incident analysis.

## 1. Technology Stack

### Frontend
- Angular 21
- TypeScript
- Angular Forms
- Angular Router
- RxJS

### Backend
- Node.js
- Express 5
- TypeScript
- JWT authentication
- bcryptjs password hashing
- Zod validation

### Data
- Microsoft SQL Server — primary transactional/application data
- MongoDB — incident activity/audit history

### AI
- AI Analysis service for category, severity, confidence, probable cause, troubleshooting actions and resolution
- AI Agent for incident investigation, similarity search and recommended resolution
- OpenAI integration is included; when an LLM request is unavailable, the application uses a controlled deterministic fallback so the core AI workflow remains demonstrable locally

## 2. High-Level Architecture

```text
Angular Frontend
      |
      | HTTP / JSON + JWT
      v
Node.js + Express API
      |
      +--------------------+
      |                    |
      v                    v
SQL Server             MongoDB
Incidents, Users,      Activity / Audit
Comments, Knowledge    History
      |
      v
AI Services
  |             |
  v             v
AI Analysis   AI Agent
              |
              +--> Similar Incident Search
              +--> Investigation Decision
              +--> Recommended Resolution
```

## 3. Project Structure

```text
incident-management-system/
├── backend/
│   ├── src/
│   │   ├── config/          # SQL Server, MongoDB and OpenAI configuration
│   │   ├── controllers/     # HTTP request/response handling
│   │   ├── middleware/      # Authentication and role authorization
│   │   ├── repositories/    # Database access layer
│   │   ├── routes/          # REST API route definitions
│   │   ├── scripts/         # Seed scripts
│   │   └── services/        # Business logic and AI services
│   ├── package.json
│   └── tsconfig.json
│
├── database/
│   └── sql/
│       └── schema.sql       # SQL Server schema
│
├── docs/
│   └── api.md               # REST API documentation
│
├── frontend-app/
│   ├── src/app/pages/       # Login, dashboard, incidents, detail, create pages
│   ├── src/app/services/    # API and authentication services
│   ├── src/app/guards/      # Route protection
│   ├── src/environments/    # Frontend API configuration
│   └── package.json
│
└── README.md
```

## 4. Prerequisites

Install the following on the local machine:

- Node.js 22.x or compatible recent LTS release
- npm
- Microsoft SQL Server
- SQL Server Management Studio (SSMS) or another SQL client
- ODBC Driver 18 for SQL Server
- MongoDB Server 8.x or a compatible local MongoDB installation
- Git (optional)

The backend uses Windows trusted authentication for SQL Server through `msnodesqlv8`.

## 5. Database Setup — SQL Server

1. Start SQL Server.
2. Open SSMS.
3. Create the application database:

```sql
CREATE DATABASE IncidentManagementDB;
GO
```

4. Select/open `database/sql/schema.sql` from this project.
5. Execute the complete script while connected to the SQL Server instance.

The schema creates:

- `Users`
- `Incidents`
- `Comments`
- `KnowledgeArticles`
- incident number sequence
- supporting indexes and foreign keys

### Verify SQL Server data

```sql
USE IncidentManagementDB;
GO

SELECT TOP 20
    Id,
    IncidentNumber,
    Title,
    Priority,
    Category,
    Status,
    CreatedBy,
    AssignedTo,
    CreatedAt
FROM dbo.Incidents
ORDER BY Id DESC;
```

## 6. Database Setup — MongoDB

Start the local MongoDB service.

The backend connects using the configured `MONGO_URI` and database name. The `activity_events` collection is created/used by the application when activity is logged; no manual collection creation is required.

Activity events include actions such as:

- `INCIDENT_CREATED`
- `INCIDENT_ASSIGNED`
- `COMMENT_ADDED`
- `AI_ANALYSIS`
- `AI_AGENT_RUN`

### Verify MongoDB activity data

Using `mongosh`:

```javascript
show dbs
use IncidentManagement
show collections
db.activity_events.find().sort({timestamp: -1}).limit(10).pretty()
```

## 7. Backend Configuration

Create `backend/.env` from the following template. Do not commit or share the real `.env` file because it can contain secrets.

```env
PORT=3000

SQL_SERVER=YOUR_SQL_SERVER_INSTANCE
SQL_DATABASE=IncidentManagementDB
SQL_TRUST_SERVER_CERTIFICATE=true

MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DATABASE=IncidentManagement

JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET

OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=YOUR_MODEL_NAME
```

For a local Windows SQL Server setup, `SQL_SERVER` must match the SQL Server instance visible in SSMS. The application uses Windows trusted authentication.

## 8. Install and Run Backend

Open a terminal in the `backend` directory:

```bash
cd backend
npm install
npm run dev
```

Expected startup output is similar to:

```text
SQL Server connected successfully
MongoDB connected successfully
Server running on http://localhost:3000
```

Health check:

```text
GET http://localhost:3000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Incident Management API is running"
}
```

## 9. Seed Demo Users

With SQL Server configured, run:

```bash
cd backend
npm run seed:users
```

The seed script creates these demo users if they do not already exist:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@incident.local` | `Admin@123` |
| AGENT | `agent@incident.local` | `Agent@123` |

These credentials are intended only for local demonstration.

## 10. Install and Run Frontend

Open a second terminal:

```bash
cd frontend-app
npm install
npm start
```

Angular normally serves the application at:

```text
http://localhost:4200
```

The frontend API base URL is configured in:

```text
frontend-app/src/environments/environment.ts
```

Default:

```typescript
apiUrl: "http://localhost:3000/api"
```

## 11. Main Application Flow

### Login

1. User submits email and password from the Angular login page.
2. Angular sends `POST /api/auth/login`.
3. Express authenticates the user against SQL Server.
4. Passwords are verified using bcrypt.
5. A JWT containing user identity and role is returned.
6. The frontend stores the token and sends it as a Bearer token on protected API calls.

### Incident creation

1. Admin enters incident details in Angular.
2. Angular sends `POST /api/incidents`.
3. Express route authenticates and authorizes the user.
4. Controller validates request data and delegates to the service.
5. Service/repository persists the incident in SQL Server.
6. An `INCIDENT_CREATED` event is recorded in MongoDB.
7. Angular displays the created incident.

### Incident activity

Transactional records such as incidents, users and comments are stored in SQL Server. Activity/audit events are stored separately in MongoDB, allowing the application to maintain a chronological history of actions without mixing audit documents with transactional relational data.

## 12. AI Analysis

Endpoint:

```text
POST /api/incidents/:id/analyze
```

The AI Analysis service receives the incident title, description, priority and category and produces a structured result containing:

- Suggested category
- Severity
- Confidence
- Summary
- Probable cause
- Recommended actions
- Possible resolution

The current local implementation includes a deterministic analysis path. Confidence is an evidence-based rule score, not an LLM probability.

The analysis is also written to MongoDB as an `AI_ANALYSIS` activity event so that the result can be shown in the incident audit trail.

## 13. AI Agent

Endpoint:

```text
POST /api/incidents/:id/agent/run
```

The AI Agent:

1. Loads the current incident.
2. Retrieves other incidents.
3. Excludes the current incident from similarity matching.
4. Calculates text-based similarity.
5. Selects up to three relevant incidents above the similarity threshold.
6. Generates a recommended resolution based on the incident context.
7. Determines an investigation action.
8. If investigation is started and the incident is `OPEN`, it moves the incident to `IN_PROGRESS` and adds an investigation comment.
9. Records the agent execution in MongoDB as `AI_AGENT_RUN`.

If an LLM decision is unavailable, the application uses the controlled fallback decision path and marks the source as `FALLBACK`.

## 14. Important REST Endpoints

Base URL:

```text
http://localhost:3000/api
```

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Login and obtain JWT |
| GET | `/incidents` | List incidents |
| GET | `/incidents/:id` | View incident |
| POST | `/incidents` | Create incident |
| PUT | `/incidents/:id/status` | Update status |
| PUT | `/incidents/:id/assign` | Assign incident |
| GET | `/incidents/:id/comments` | View comments |
| POST | `/incidents/:id/comments` | Add comment |
| GET | `/incidents/:id/activity` | View activity history |
| POST | `/incidents/:id/analyze` | Run AI analysis |
| POST | `/incidents/:id/agent/run` | Run AI Agent |
| GET | `/users` | List active users for assignment |
| GET | `/health` | Backend health check |

For full API details, see `docs/api.md`.

## 15. Role-Based Access

### ADMIN

- View incidents
- Create incidents
- Update incident status
- Assign incidents
- Add comments
- Run AI analysis
- Run AI Agent

### AGENT

- View incidents
- Add comments
- Run AI analysis
- Run AI Agent

Protected API routes require a valid JWT and role authorization where applicable.

## 16. Suggested End-to-End Demo

For a clean demonstration:

1. Start SQL Server and MongoDB.
2. Start the backend.
3. Confirm `/api/health` returns success.
4. Seed demo users if necessary.
5. Start Angular.
6. Login as the ADMIN user.
7. Open the dashboard and incident list.
8. Create an incident.
9. Open the incident detail page.
10. Assign it to the AGENT.
11. Run AI Analysis and show the structured output.
12. Run the AI Agent and show similar incidents, confidence, source, reason and recommended resolution.
13. Add a comment.
14. Change incident status.
15. Refresh the activity timeline.
16. In SSMS, show the incident stored in `dbo.Incidents`.
17. In MongoDB, show the corresponding activity events in `activity_events`.
18. Use browser DevTools → Network to show the frontend HTTP requests and JSON responses.

## 17. Troubleshooting

### SQL Server connection failure

Check:

- SQL Server service is running.
- The `SQL_SERVER` value matches the SSMS server/instance name.
- ODBC Driver 18 for SQL Server is installed.
- Windows account has access to the database.
- `SQL_TRUST_SERVER_CERTIFICATE=true` is set for the local development configuration.

### MongoDB connection failure

Check:

- MongoDB service is running.
- `MONGO_URI` points to the correct server.
- The configured MongoDB port is available.

### Frontend cannot call backend

Check:

- Backend is running on port 3000.
- Frontend `environment.ts` points to `http://localhost:3000/api`.
- Browser DevTools → Network shows requests reaching the backend.

### AI Agent shows `FALLBACK`

This is an intentional controlled fallback path. The application can continue demonstrating the AI workflow even when an external LLM call is unavailable. The response explicitly identifies the source as `FALLBACK` rather than presenting it as a successful external LLM response.

## 18. Security Notes for Submission

- Never share a real `backend/.env` file containing API keys or secrets.
- The submission package should contain `.env.example`, not the real `.env`.
- `node_modules`, compiled `dist` output, Angular cache, and `.git` history are not required in the source-code submission. Review the final ZIP before sending it.
