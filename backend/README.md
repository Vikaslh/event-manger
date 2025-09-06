# Campus Event Management Backend

FastAPI backend for the Campus Event Management System with SQLite database and JWT authentication.

## Features

- **JWT Authentication**: Secure user authentication with access tokens
- **User Management**: Student and admin role-based access
- **Event Management**: CRUD operations for events
- **Registration System**: Students can register for events
- **Attendance Tracking**: Mark and track event attendance
- **Feedback System**: Collect and manage event feedback
- **SQLite Database**: Lightweight database for development
- **CORS Support**: Configured for React frontend integration

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-super-secret-key-change-this-in-production-12345
DATABASE_URL=sqlite:///./campus_events.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. Run the Server

```bash
python run.py
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Colleges
- `GET /colleges` - Get all colleges
- `POST /colleges` - Create new college

### Events
- `GET /events` - Get all events
- `GET /events/{event_id}` - Get specific event
- `POST /events` - Create event (admin only)
- `PUT /events/{event_id}` - Update event (admin only)
- `DELETE /events/{event_id}` - Delete event (admin only)

### Registrations
- `GET /registrations/my` - Get user's registrations
- `POST /registrations` - Register for event

### Attendance
- `GET /attendance/my` - Get user's attendance
- `POST /attendance` - Mark attendance

### Feedback
- `GET /feedback/my` - Get user's feedback
- `POST /feedback` - Submit feedback

## Database Schema

The SQLite database includes the following tables:
- `users` - User accounts and profiles
- `colleges` - Educational institutions
- `events` - Event information
- `registrations` - Student event registrations
- `attendance` - Event attendance records
- `feedback` - Event feedback and ratings

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Development

The server runs with auto-reload enabled for development. Database tables are created automatically on first run.

## Production Notes

- Change the SECRET_KEY in production
- Consider using PostgreSQL for production
- Implement proper error handling and logging
- Add rate limiting and security headers
