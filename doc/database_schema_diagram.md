# Campus Event Management System - Database Schema

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           CAMPUS EVENT MANAGEMENT SYSTEM                                │
│                                  DATABASE SCHEMA                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │      COLLEGES       │
                    ├─────────────────────┤
                    │ 🔑 id (PK)          │
                    │ 📝 name             │
                    │ 📅 created_at       │
                    └─────────────────────┘
                             │
                             │ 1:N
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                │
    ┌─────────────────────┐ ┌─────────────────────┐
    │       USERS         │ │       EVENTS        │
    ├─────────────────────┤ ├─────────────────────┤
    │ 🔑 id (PK)          │ │ 🔑 id (PK)          │
    │ 📧 email (UNIQUE)   │ │ 📝 title            │
    │ 🔒 hashed_password  │ │ 📄 description      │
    │ 👤 full_name        │ │ 🏷️ type             │
    │ 🎭 role             │ │ 📅 date             │
    │ 🏫 college_id (FK)  │ │ 📍 location         │
    │ ✅ is_active        │ │ 👥 max_attendees    │
    │ 📅 created_at       │ │ 🏫 college_id (FK)  │
    │ 📅 updated_at       │ │ 👤 created_by (FK)  │
    └─────────────────────┘ │ 📅 created_at       │
            │               │ 📅 updated_at       │
            │               └─────────────────────┘
            │ 1:N                    │
            │                        │ 1:N
            │                        │
            │               ┌─────────────────────┐
            │               │    REGISTRATIONS    │
            │               ├─────────────────────┤
            │               │ 🔑 id (PK)          │
            │               │ 👤 student_id (FK)  │◄──────┘
            │               │ 🎪 event_id (FK)    │
            │               │ 📅 created_at       │
            │               └─────────────────────┘
            │                        │
            │                        │ 1:1
            │                        │
            │               ┌─────────────────────┐
            │               │     ATTENDANCE      │
            │               ├─────────────────────┤
            │               │ 🔑 id (PK)          │
            │               │ 📋 registration_id  │◄──────┘
            │               │     (FK)            │
            │               │ 👤 student_id (FK)  │◄──────┘
            │               │ 🎪 event_id (FK)    │
            │               │ ⏰ check_in_time    │
            │               └─────────────────────┘
            │
            │               ┌─────────────────────┐
            │               │      FEEDBACK       │
            │               ├─────────────────────┤
            │               │ 🔑 id (PK)          │
            │               │ 📋 registration_id  │
            │               │     (FK)            │
            │               │ 👤 student_id (FK)  │◄──────┘
            │               │ 🎪 event_id (FK)    │
            │               │ ⭐ rating (1-5)     │
            │               │ 💬 comment          │
            │               │ 📅 created_at       │
            │               └─────────────────────┘

```

## Relationship Details

### 1. COLLEGES → USERS (1:N)
- **Relationship**: One college can have many users
- **Foreign Key**: `users.college_id` → `colleges.id`
- **Description**: Students and admins belong to a specific college

### 2. COLLEGES → EVENTS (1:N)
- **Relationship**: One college can host many events
- **Foreign Key**: `events.college_id` → `colleges.id`
- **Description**: Events are organized by colleges

### 3. USERS → EVENTS (1:N) - Creator Relationship
- **Relationship**: One user (admin) can create many events
- **Foreign Key**: `events.created_by` → `users.id`
- **Description**: Admin users create and manage events

### 4. USERS → REGISTRATIONS (1:N)
- **Relationship**: One user can register for many events
- **Foreign Key**: `registrations.student_id` → `users.id`
- **Description**: Students register for events they want to attend

### 5. EVENTS → REGISTRATIONS (1:N)
- **Relationship**: One event can have many registrations
- **Foreign Key**: `registrations.event_id` → `events.id`
- **Description**: Multiple students can register for the same event

### 6. REGISTRATIONS → ATTENDANCE (1:1)
- **Relationship**: One registration can have one attendance record
- **Foreign Key**: `attendance.registration_id` → `registrations.id`
- **Description**: Attendance is tracked per registration

### 7. REGISTRATIONS → FEEDBACK (1:1)
- **Relationship**: One registration can have one feedback
- **Foreign Key**: `feedback.registration_id` → `registrations.id`
- **Description**: Students can provide feedback for events they attended

## Table Structures

### COLLEGES
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique college identifier |
| name | VARCHAR | NOT NULL | College name |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation time |

### USERS
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR | UNIQUE, NOT NULL, INDEXED | User email address |
| hashed_password | VARCHAR | NOT NULL | Encrypted password |
| full_name | VARCHAR | NOT NULL | User's full name |
| role | VARCHAR | DEFAULT 'student' | User role (student/admin) |
| college_id | INTEGER | FOREIGN KEY → colleges.id | Associated college |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation time |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP, ON UPDATE | Last modification time |

### EVENTS
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique event identifier |
| title | VARCHAR | NOT NULL | Event title |
| description | TEXT | NULLABLE | Event description |
| type | VARCHAR | NOT NULL | Event type (Workshop, Fest, Seminar, etc.) |
| date | DATETIME | NOT NULL | Event date and time |
| location | VARCHAR | NULLABLE | Event venue |
| max_attendees | INTEGER | NULLABLE | Maximum capacity |
| college_id | INTEGER | FOREIGN KEY → colleges.id, NOT NULL | Hosting college |
| created_by | INTEGER | FOREIGN KEY → users.id, NOT NULL | Event creator (admin) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP, ON UPDATE | Last modification time |

### REGISTRATIONS
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique registration identifier |
| student_id | INTEGER | FOREIGN KEY → users.id, NOT NULL | Registered student |
| event_id | INTEGER | FOREIGN KEY → events.id, NOT NULL | Target event |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Registration time |

### ATTENDANCE
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique attendance identifier |
| registration_id | INTEGER | FOREIGN KEY → registrations.id, NOT NULL | Associated registration |
| student_id | INTEGER | FOREIGN KEY → users.id, NOT NULL | Student who attended |
| event_id | INTEGER | FOREIGN KEY → events.id, NOT NULL | Event attended |
| check_in_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | Attendance timestamp |

### FEEDBACK
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique feedback identifier |
| registration_id | INTEGER | FOREIGN KEY → registrations.id, NOT NULL | Associated registration |
| student_id | INTEGER | FOREIGN KEY → users.id, NOT NULL | Student providing feedback |
| event_id | INTEGER | FOREIGN KEY → events.id, NOT NULL | Event being rated |
| rating | INTEGER | NOT NULL, CHECK (rating BETWEEN 1 AND 5) | Rating score (1-5) |
| comment | TEXT | NULLABLE | Optional feedback comment |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Feedback submission time |

## Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication system
- Role-based access control (admin/student)
- Password hashing with bcrypt

### 🎯 Core Functionality
- **Event Management**: CRUD operations for events
- **Registration System**: Students can register for events
- **Attendance Tracking**: QR code-based check-in system
- **Feedback System**: Post-event ratings and comments
- **College Management**: Multi-college support

### 📊 Data Integrity
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate registrations
- Check constraints validate rating values (1-5)
- Timestamps track all data modifications

### 🔍 Indexing Strategy
- Primary keys are automatically indexed
- Email field is indexed for fast user lookups
- Foreign keys are indexed for efficient joins

## Database Technology
- **Engine**: SQLite (Development) / PostgreSQL (Production recommended)
- **ORM**: SQLAlchemy with declarative base
- **Migration**: Alembic (recommended for production)
