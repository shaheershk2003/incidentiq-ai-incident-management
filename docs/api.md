# Incident Management API

Base URL:

`/api`

## Authentication

### POST /auth/login

Authenticate a user.

Request:

```json
{
  "email": "admin@example.com",
  "password": "Password123"
}


Response:

{
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
Incidents
GET /incidents

Get incidents.

Optional query parameters:

status
priority
category
assignedTo
page
limit
GET /incidents/:id

Get a single incident.

POST /incidents

Create an incident.

Request:

{
  "title": "Payment API unavailable",
  "description": "Production API is returning 503 errors",
  "priority": "P1",
  "category": "APPLICATION"
}

Response:

{
  "id": 1,
  "incidentNumber": "INC-1001",
  "title": "Payment API unavailable",
  "status": "OPEN"
}
PUT /incidents/:id

Update incident details.

PUT /incidents/:id/assign

Assign an incident.

Request:

{
  "assignedTo": 2
}
PUT /incidents/:id/status

Change incident status.

Request:

{
  "status": "IN_PROGRESS"
}
Comments
GET /incidents/:id/comments

Get comments for an incident.

POST /incidents/:id/comments

Add a comment.

Request:

{
  "commentText": "Checked the deployment logs."
}
AI Analysis
POST /incidents/:id/analyze

Analyze an incident using AI.

Expected response:

{
  "category": "APPLICATION",
  "priority": "P1",
  "severity": "CRITICAL",
  "possibleCause": "Invalid deployment configuration",
  "troubleshootingSteps": [
    "Review deployment logs",
    "Compare environment variables",
    "Check application health",
    "Review recent changes"
  ],
  "possibleResolution": "Rollback the deployment and correct the configuration."
}
AI Agent
POST /incidents/:id/investigate

Investigate an incident using the AI Agent.

The agent may use:

Current incident
Similar incidents
Knowledge articles
Incident activity/history

Response:

{
  "summary": "Deployment-related failure is likely.",
  "evidence": [],
  "recommendation": "Compare the current configuration with the last known working deployment.",
  "confidence": 0.87
}
Standard Error Response
{
  "success": false,
  "message": "Invalid request",
  "errors": []
}
Authentication

Protected endpoints require:

Authorization: Bearer <JWT>
