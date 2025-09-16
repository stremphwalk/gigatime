# API Documentation for Testsprite Testing

## Base Configuration
- **Base URL**: `http://localhost:5002`
- **Authentication**: Public (no authentication required for testing)
- **Content-Type**: `application/json`

## Core API Endpoints

### Authentication & User Management
```
GET /api/auth/user
POST /api/auth/login
POST /api/auth/logout
POST /api/init-user
```

### Notes Management
```
GET /api/notes
GET /api/notes/:id
POST /api/notes
PUT /api/notes/:id
DELETE /api/notes/:id
```

### Note Templates
```
GET /api/note-templates
POST /api/note-templates
PUT /api/note-templates/:id
DELETE /api/note-templates/:id
POST /api/note-templates/import
```

### Smart Phrases
```
GET /api/smart-phrases
POST /api/smart-phrases
PUT /api/smart-phrases/:id
DELETE /api/smart-phrases/:id
POST /api/smart-phrases/import/:shareableId
```

### Autocomplete Items
```
GET /api/autocomplete-items
POST /api/autocomplete-items
PUT /api/autocomplete-items/:id
DELETE /api/autocomplete-items/:id
```

### AI Services
```
POST /api/ai/medications
POST /api/ai/labs
POST /api/ai/pmh
POST /api/transcribe
```

### Teams & Collaboration
```
GET /api/teams
POST /api/teams/create
POST /api/teams/join
POST /api/teams/:teamId/leave
GET /api/teams/:teamId/members
GET /api/teams/:teamId/todos
POST /api/teams/:teamId/todos
PUT /api/todos/:id
DELETE /api/todos/:id
```

### Run List Management
```
GET /api/run-list/today
POST /api/run-list/:id/patients
PUT /api/run-list/:id/patients/reorder
PUT /api/run-list/patients/:id
DELETE /api/run-list/patients/:id
PUT /api/run-list/notes/:listPatientId
GET /api/run-list/:id/carry-forward
PUT /api/run-list/:id/carry-forward
PUT /api/run-list/:id/mode
POST /api/run-list/:id/clone-from-previous
POST /api/run-list/ai/generate
```

### User Preferences & Settings
```
GET /api/user-preferences
PUT /api/user-preferences
GET /api/user-lab-settings
POST /api/user-lab-settings
DELETE /api/user-lab-settings
```

### Lab & Medical Data
```
GET /api/lab-presets
POST /api/lab-presets
PUT /api/lab-presets/:id
DELETE /api/lab-presets/:id
GET /api/pertinent-negative-presets
POST /api/pertinent-negative-presets
PUT /api/pertinent-negative-presets/:id
DELETE /api/pertinent-negative-presets/:id
```

### System & Health
```
GET /api/health
GET /api/test
POST /api/init
GET /api/soniox-key
```

### Testsprite Testing
```
GET /api/testsprite/status
```

## Sample Request/Response Examples

### Create a Note
```http
POST /api/notes
Content-Type: application/json

{
  "title": "Test Note",
  "content": "This is a test note for automated testing",
  "templateType": "consultation"
}
```

**Response:**
```json
{
  "id": "note-123",
  "title": "Test Note",
  "content": "This is a test note for automated testing",
  "templateType": "consultation",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Get All Notes
```http
GET /api/notes
```

**Response:**
```json
[
  {
    "id": "note-123",
    "title": "Test Note",
    "content": "This is a test note for automated testing",
    "templateType": "consultation",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
]
```

### Create a Smart Phrase
```http
POST /api/smart-phrases
Content-Type: application/json

{
  "trigger": "test-phrase",
  "content": "This is a test smart phrase",
  "description": "Test phrase for automated testing"
}
```

### Get User Information
```http
GET /api/auth/user
```

**Response:**
```json
{
  "id": "dev-user-123",
  "email": "dev-doctor@gigatime-test.local",
  "firstName": "Dr. Test",
  "lastName": "Developer",
  "specialty": "Internal Medicine"
}
```

### Testsprite Status Check
```http
GET /api/testsprite/status
```

**Response:**
```json
{
  "status": "ready",
  "message": "Testsprite can connect to this server",
  "server": "dev-server-no-auth",
  "user": {
    "id": "dev-user-123",
    "email": "dev-doctor@gigatime-test.local",
    "firstName": "Dr. Test",
    "lastName": "Developer",
    "specialty": "Internal Medicine"
  },
  "endpoints": {
    "notes": "/api/notes",
    "smartPhrases": "/api/smart-phrases",
    "auth": "/api/auth/user",
    "health": "/api/health"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Testing Scenarios

### 1. Basic CRUD Operations
- Create a note
- Read the note
- Update the note
- Delete the note

### 2. Smart Phrase Management
- Create smart phrases
- Use smart phrases in notes
- Update smart phrases
- Delete smart phrases

### 3. Autocomplete Functionality
- Test autocomplete for medications
- Test autocomplete for medical conditions
- Test autocomplete for allergies

### 4. AI Integration
- Test medication AI suggestions
- Test lab value AI processing
- Test past medical history AI

### 5. Team Collaboration
- Create a team
- Add members to team
- Create team todos
- Manage team calendar

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (not applicable in test mode)
- `404` - Not Found
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Test Data Setup

The development server automatically creates a test user:
- **User ID**: `dev-user-{timestamp}-{random}`
- **Email**: `dev-doctor@gigatime-test.local`
- **Name**: `Dr. Test Developer`
- **Specialty**: `Internal Medicine`

## Notes for Testsprite

1. **No Authentication Required**: All endpoints are accessible without authentication in test mode
2. **Consistent Test User**: All operations are performed under a consistent development user
3. **Database Isolation**: Test data is isolated and can be safely created/deleted
4. **Port Configuration**: Server runs on port 5002 by default, but may use a different port if 5002 is occupied
5. **CORS Enabled**: All endpoints support cross-origin requests for testing
