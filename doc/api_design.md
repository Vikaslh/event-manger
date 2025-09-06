# Campus Event Management System - API Design

## Overview
This document outlines the REST API design for the Campus Event Management System built with FastAPI. The API provides endpoints for authentication, event management, student registration, attendance tracking, and reporting.

**Base URL**: `http://localhost:8000` (Development)  
**API Version**: 1.0.0  
**Authentication**: JWT Bearer Token

## Table of Contents
- [Authentication](#authentication)
- [Event Management](#event-management)
- [Student Registration](#student-registration)
- [Attendance Tracking](#attendance-tracking)
- [Feedback System](#feedback-system)
- [College Management](#college-management)
- [User Management](#user-management)
- [Reporting & Analytics](#reporting--analytics)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

### 🔐 User Registration
**Endpoint**: `POST /auth/register`  
**Description**: Register a new user (student or admin)  
**Authentication**: None required

**Request Body**:
```json
{
  "email": "student@college.edu",
  "password": "securePassword123",
  "full_name": "John Doe",
  "role": "student",
  "college_id": 1
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "email": "student@college.edu",
  "full_name": "John Doe",
  "role": "student",
  "college_id": 1,
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Email already registered
- `422 Unprocessable Entity`: Invalid input data

---

### 🔑 User Login
**Endpoint**: `POST /auth/login`  
**Description**: Authenticate user and receive JWT token  
**Authentication**: None required

**Request Body**:
```json
{
  "email": "student@college.edu",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses**:
- `401 Unauthorized`: Incorrect email or password

---

### 👤 Get Current User
**Endpoint**: `GET /auth/me`  
**Description**: Get current authenticated user information  
**Authentication**: Bearer Token required

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "student@college.edu",
  "full_name": "John Doe",
  "role": "student",
  "college_id": 1,
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

## Event Management

### 🎪 Create Event
**Endpoint**: `POST /events`  
**Description**: Create a new event (Admin only)  
**Authentication**: Bearer Token (Admin role required)

**Request Body**:
```json
{
  "title": "Tech Workshop 2024",
  "description": "Learn the latest web development technologies",
  "type": "Workshop",
  "date": "2024-02-15T14:00:00Z",
  "location": "Main Auditorium",
  "max_attendees": 100,
  "college_id": 1
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "title": "Tech Workshop 2024",
  "description": "Learn the latest web development technologies",
  "type": "Workshop",
  "date": "2024-02-15T14:00:00Z",
  "location": "Main Auditorium",
  "max_attendees": 100,
  "college_id": 1,
  "created_by": 2,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "average_rating": null
}
```

**Error Responses**:
- `403 Forbidden`: Only admins can create events
- `422 Unprocessable Entity`: Invalid input data

---

### 📋 Get All Events
**Endpoint**: `GET /events`  
**Description**: Retrieve all events with pagination  
**Authentication**: None required

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum records to return (default: 100)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Tech Workshop 2024",
    "description": "Learn the latest web development technologies",
    "type": "Workshop",
    "date": "2024-02-15T14:00:00Z",
    "location": "Main Auditorium",
    "max_attendees": 100,
    "college_id": 1,
    "created_by": 2,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "average_rating": 4.2
  }
]
```

---

### 🎯 Get Event by ID
**Endpoint**: `GET /events/{event_id}`  
**Description**: Retrieve specific event details  
**Authentication**: None required

**Path Parameters**:
- `event_id`: Event ID (integer)

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Tech Workshop 2024",
  "description": "Learn the latest web development technologies",
  "type": "Workshop",
  "date": "2024-02-15T14:00:00Z",
  "location": "Main Auditorium",
  "max_attendees": 100,
  "college_id": 1,
  "created_by": 2,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "average_rating": 4.2
}
```

**Error Responses**:
- `404 Not Found`: Event not found

---

### ✏️ Update Event
**Endpoint**: `PUT /events/{event_id}`  
**Description**: Update event details (Admin only)  
**Authentication**: Bearer Token (Admin role required)

**Path Parameters**:
- `event_id`: Event ID (integer)

**Request Body** (all fields optional):
```json
{
  "title": "Advanced Tech Workshop 2024",
  "description": "Updated description",
  "type": "Workshop",
  "date": "2024-02-16T14:00:00Z",
  "location": "Conference Hall",
  "max_attendees": 150,
  "college_id": 1
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Advanced Tech Workshop 2024",
  "description": "Updated description",
  "type": "Workshop",
  "date": "2024-02-16T14:00:00Z",
  "location": "Conference Hall",
  "max_attendees": 150,
  "college_id": 1,
  "created_by": 2,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:45:00Z",
  "average_rating": 4.2
}
```

**Error Responses**:
- `403 Forbidden`: Only admins can update events
- `404 Not Found`: Event not found

---

### 🗑️ Delete Event
**Endpoint**: `DELETE /events/{event_id}`  
**Description**: Delete an event (Admin only)  
**Authentication**: Bearer Token (Admin role required)

**Path Parameters**:
- `event_id`: Event ID (integer)

**Response** (200 OK):
```json
{
  "message": "Event deleted successfully"
}
```

**Error Responses**:
- `403 Forbidden`: Only admins can delete events
- `404 Not Found`: Event not found

---

## Student Registration

### 📝 Register for Event
**Endpoint**: `POST /registrations`  
**Description**: Register student for an event (Student only)  
**Authentication**: Bearer Token (Student role required)

**Request Body**:
```json
{
  "event_id": 1
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "student_id": 1,
  "event_id": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Already registered for this event
- `403 Forbidden`: Only students can register for events
- `404 Not Found`: Event not found

---

### 📋 Get My Registrations
**Endpoint**: `GET /registrations/my`  
**Description**: Get current user's event registrations  
**Authentication**: Bearer Token required

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "student_id": 1,
    "event_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

### 📊 Get All Registrations (Admin)
**Endpoint**: `GET /registrations/all`  
**Description**: Get all event registrations (Admin only)  
**Authentication**: Bearer Token (Admin role required)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "student_id": 1,
    "event_id": 1,
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": 2,
    "student_id": 2,
    "event_id": 1,
    "created_at": "2024-01-15T11:00:00Z"
  }
]
```

**Error Responses**:
- `403 Forbidden`: Only admins can view all registrations

---

## Attendance Tracking

### ✅ Mark Attendance (Manual)
**Endpoint**: `POST /attendance`  
**Description**: Manually mark attendance for an event  
**Authentication**: Bearer Token required

**Request Body**:
```json
{
  "registration_id": 1,
  "event_id": 1
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "registration_id": 1,
  "student_id": 1,
  "event_id": 1,
  "check_in_time": "2024-02-15T14:05:00Z"
}
```

---

### 📱 Mark Attendance via QR Code (Admin)
**Endpoint**: `POST /attendance/qr`  
**Description**: Mark attendance by scanning QR code (Admin only)  
**Authentication**: Bearer Token (Admin role required)

**Request Body**:
```json
{
  "event_id": 1,
  "qr_data": "{\"type\":\"attendance\",\"eventId\":1,\"studentId\":1,\"timestamp\":\"2024-02-15T14:00:00Z\"}"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "attendance_id": 1,
  "student_name": "John Doe",
  "event_title": "Tech Workshop 2024"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid QR code format or already marked
- `403 Forbidden`: Only admins can scan QR codes
- `404 Not Found`: Event not found

---

### 📲 Student QR Attendance
**Endpoint**: `POST /attendance/qr/student`  
**Description**: Student marks their own attendance via QR scan  
**Authentication**: Bearer Token (Student role required)

**Request Body**:
```json
{
  "event_id": 1
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "attendance_id": 1,
  "student_name": "John Doe",
  "event_title": "Tech Workshop 2024"
}
```

**Error Responses**:
- `400 Bad Request`: Not registered or already marked attendance
- `403 Forbidden`: Only students can mark their own attendance
- `404 Not Found`: Event not found

---

### 📋 Get My Attendance
**Endpoint**: `GET /attendance/my`  
**Description**: Get current user's attendance records  
**Authentication**: Bearer Token required

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "registration_id": 1,
    "student_id": 1,
    "event_id": 1,
    "check_in_time": "2024-02-15T14:05:00Z"
  }
]
```

---

### 📊 Get All Attendance (Admin)
**Endpoint**: `GET /attendance/all`  
**Description**: Get all attendance records (Admin only)  
**Authentication**: Bearer Token (Admin role required)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "registration_id": 1,
    "student_id": 1,
    "event_id": 1,
    "check_in_time": "2024-02-15T14:05:00Z"
  }
]
```

**Error Responses**:
- `403 Forbidden`: Only admins can view all attendance

---

## Feedback System

### 💬 Submit Feedback
**Endpoint**: `POST /feedback`  
**Description**: Submit feedback for an attended event  
**Authentication**: Bearer Token required

**Request Body**:
```json
{
  "registration_id": 1,
  "event_id": 1,
  "rating": 5,
  "comment": "Excellent workshop! Learned a lot about web development."
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "registration_id": 1,
  "student_id": 1,
  "event_id": 1,
  "rating": 5,
  "comment": "Excellent workshop! Learned a lot about web development.",
  "created_at": "2024-02-15T16:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid rating (must be 1-5)
- `404 Not Found`: Registration not found

---

### 📋 Get My Feedback
**Endpoint**: `GET /feedback/my`  
**Description**: Get current user's feedback submissions  
**Authentication**: Bearer Token required

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "registration_id": 1,
    "student_id": 1,
    "event_id": 1,
    "rating": 5,
    "comment": "Excellent workshop! Learned a lot about web development.",
    "created_at": "2024-02-15T16:30:00Z"
  }
]
```

---

### 🎯 Get Event Feedback
**Endpoint**: `GET /events/{event_id}/feedback`  
**Description**: Get all feedback for a specific event  
**Authentication**: None required

**Path Parameters**:
- `event_id`: Event ID (integer)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "registration_id": 1,
    "student_id": 1,
    "event_id": 1,
    "rating": 5,
    "comment": "Excellent workshop! Learned a lot about web development.",
    "created_at": "2024-02-15T16:30:00Z"
  }
]
```

---

### ⭐ Get Event Average Rating
**Endpoint**: `GET /events/{event_id}/average-rating`  
**Description**: Get average rating for a specific event  
**Authentication**: None required

**Path Parameters**:
- `event_id`: Event ID (integer)

**Response** (200 OK):
```json
{
  "event_id": 1,
  "average_rating": 4.2
}
```

---

### 📊 Get All Feedback (Admin)
**Endpoint**: `GET /feedback/all`  
**Description**: Get all feedback submissions (Admin only)  
**Authentication**: Bearer Token (Admin role required)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "registration_id": 1,
    "student_id": 1,
    "event_id": 1,
    "rating": 5,
    "comment": "Excellent workshop! Learned a lot about web development.",
    "created_at": "2024-02-15T16:30:00Z"
  }
]
```

**Error Responses**:
- `403 Forbidden`: Only admins can view all feedback

---

## College Management

### 🏫 Create College
**Endpoint**: `POST /colleges`  
**Description**: Create a new college  
**Authentication**: None required (consider adding admin restriction)

**Request Body**:
```json
{
  "name": "MIT College of Engineering"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "name": "MIT College of Engineering",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### 📋 Get All Colleges
**Endpoint**: `GET /colleges`  
**Description**: Retrieve all colleges  
**Authentication**: None required

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "MIT College of Engineering",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

---

## User Management

### 👥 Get All Users (Admin)
**Endpoint**: `GET /users`  
**Description**: Get all system users (Admin only)  
**Authentication**: Bearer Token (Admin role required)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "email": "student@college.edu",
    "full_name": "John Doe",
    "role": "student",
    "college_id": 1,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**Error Responses**:
- `403 Forbidden`: Only admins can view all users

---

## Reporting & Analytics

### 📊 Event Registration Report
**Endpoint**: `GET /reports/events/{event_id}/registrations`  
**Description**: Get registration statistics for an event  
**Authentication**: Bearer Token (Admin role required)

**Path Parameters**:
- `event_id`: Event ID (integer)

**Response** (200 OK):
```json
{
  "event_id": 1,
  "event_title": "Tech Workshop 2024",
  "total_registrations": 85,
  "max_attendees": 100,
  "capacity_percentage": 85.0,
  "registration_by_date": [
    {
      "date": "2024-01-15",
      "count": 25
    },
    {
      "date": "2024-01-16",
      "count": 35
    }
  ]
}
```

---

### 📈 Attendance Report
**Endpoint**: `GET /reports/events/{event_id}/attendance`  
**Description**: Get attendance statistics for an event  
**Authentication**: Bearer Token (Admin role required)

**Path Parameters**:
- `event_id`: Event ID (integer)

**Response** (200 OK):
```json
{
  "event_id": 1,
  "event_title": "Tech Workshop 2024",
  "total_registrations": 85,
  "total_attendance": 72,
  "attendance_rate": 84.7,
  "check_in_by_hour": [
    {
      "hour": 14,
      "count": 45
    },
    {
      "hour": 15,
      "count": 27
    }
  ]
}
```

---

### 🎯 College Analytics
**Endpoint**: `GET /reports/colleges/{college_id}/analytics`  
**Description**: Get comprehensive analytics for a college  
**Authentication**: Bearer Token (Admin role required)

**Path Parameters**:
- `college_id`: College ID (integer)

**Response** (200 OK):
```json
{
  "college_id": 1,
  "college_name": "MIT College of Engineering",
  "total_events": 12,
  "total_students": 450,
  "total_registrations": 1250,
  "average_attendance_rate": 78.5,
  "average_event_rating": 4.2,
  "events_by_type": [
    {
      "type": "Workshop",
      "count": 8
    },
    {
      "type": "Seminar",
      "count": 4
    }
  ]
}
```

---

### 👤 Student Analytics
**Endpoint**: `GET /reports/students/{student_id}/analytics`  
**Description**: Get analytics for a specific student  
**Authentication**: Bearer Token (Admin or own student only)

**Path Parameters**:
- `student_id`: Student ID (integer)

**Response** (200 OK):
```json
{
  "student_id": 1,
  "student_name": "John Doe",
  "total_registrations": 15,
  "total_attendance": 12,
  "attendance_rate": 80.0,
  "average_rating_given": 4.3,
  "feedback_submissions": 10,
  "favorite_event_types": [
    {
      "type": "Workshop",
      "count": 8
    },
    {
      "type": "Seminar",
      "count": 4
    }
  ]
}
```

---

## Error Handling

### Standard Error Response Format
All API errors follow a consistent format:

```json
{
  "detail": "Error message description",
  "status_code": 400,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

---

## Rate Limiting

### Current Implementation
- No rate limiting implemented (recommended for production)

### Recommended Rate Limits
- Authentication endpoints: 5 requests/minute
- General API endpoints: 100 requests/minute
- File upload endpoints: 10 requests/minute

---

## Security Considerations

### Authentication
- JWT tokens with configurable expiration
- Password hashing using bcrypt
- Role-based access control (RBAC)

### CORS Configuration
- Configurable allowed origins
- Credentials support enabled
- All methods and headers allowed (restrict in production)

### Input Validation
- Pydantic schema validation
- SQL injection prevention via ORM
- XSS protection through input sanitization

---

## Health Check

### 🏥 System Health
**Endpoint**: `GET /`  
**Description**: Basic health check endpoint  
**Authentication**: None required

**Response** (200 OK):
```json
{
  "message": "Campus Event Management API is running"
}
```

---

## Development Notes

### Running the API
```bash
# Start development server
cd backend
python main.py

# Or using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### API Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

### Database
- SQLite for development
- PostgreSQL recommended for production
- Automatic table creation on startup
