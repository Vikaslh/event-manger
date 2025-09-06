# Campus Event Management System - Complete Setup Guide

This project now includes a **FastAPI backend with SQLite database** and **JWT authentication** integrated with the React frontend.

## 🏗️ Architecture Overview

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + SQLite + SQLAlchemy
- **Authentication**: JWT tokens with role-based access
- **Database**: SQLite (development) with proper schema

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Make the startup script executable and run it
chmod +x start-dev.sh
./start-dev.sh
```

This will:
1. Set up Python virtual environment
2. Install backend dependencies
3. Start FastAPI server on port 8000
4. Install frontend dependencies
5. Start React dev server on port 5173

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python run.py
```

#### Frontend Setup

```bash
# In a new terminal, navigate to project root
cd src

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Configuration

### Backend Configuration

Create a `.env` file in the `backend/` directory:

```env
SECRET_KEY=your-super-secret-key-change-this-in-production-12345
DATABASE_URL=sqlite:///./campus_events.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend Configuration

The frontend is configured to connect to `http://localhost:8000` by default. This can be changed in `src/lib/apiClient.ts`.

## 📊 Database Schema

The SQLite database includes:

- **users**: User accounts with roles (student/admin)
- **colleges**: Educational institutions
- **events**: Event information and details
- **registrations**: Student event registrations
- **attendance**: Event attendance tracking
- **feedback**: Event feedback and ratings

## 🔐 Authentication Flow

1. **Registration**: Users can register with email, password, and role
2. **Login**: JWT token is issued upon successful login
3. **Authorization**: Token is included in API requests
4. **Role-based Access**: Different permissions for students vs admins

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Events
- `GET /events` - Get all events
- `POST /events` - Create event (admin only)
- `PUT /events/{id}` - Update event (admin only)
- `DELETE /events/{id}` - Delete event (admin only)

### Registrations
- `GET /registrations/my` - Get user's registrations
- `POST /registrations` - Register for event

### Attendance & Feedback
- `POST /attendance` - Mark attendance
- `POST /feedback` - Submit feedback

## 🎯 User Roles

### Student Features
- Browse and search events
- Register for events
- Mark attendance
- Submit feedback
- View personal event history

### Admin Features
- Create, edit, and delete events
- View all registrations and attendance
- Access analytics and reports
- Manage college information

## 🧪 Testing the Integration

1. **Start both servers** using the quick start method
2. **Open** http://localhost:5173 in your browser
3. **Register** a new user account
4. **Login** with your credentials
5. **Test features**:
   - Create events (as admin)
   - Register for events (as student)
   - Mark attendance
   - Submit feedback

## 📁 Project Structure

```
campus_event_management_system/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── crud.py             # Database operations
│   ├── auth.py             # Authentication utilities
│   ├── database.py         # Database configuration
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # API client and utilities
│   └── types/              # TypeScript types
├── start-dev.sh           # Development startup script
└── SETUP.md               # This file
```

## 🚨 Troubleshooting

### Backend Issues
- Ensure Python 3.8+ is installed
- Check that all dependencies are installed
- Verify the database file is created (`campus_events.db`)

### Frontend Issues
- Ensure Node.js 16+ is installed
- Clear browser cache and localStorage
- Check browser console for API errors

### Database Issues
- Delete `campus_events.db` to reset the database
- Check that the backend server is running
- Verify CORS settings in `main.py`

## 🔄 Development Workflow

1. **Backend changes**: The FastAPI server auto-reloads on file changes
2. **Frontend changes**: The React dev server hot-reloads
3. **Database changes**: Modify models and restart the backend
4. **API changes**: Update schemas and frontend API calls

## 📚 Additional Resources

- **FastAPI Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **React App**: http://localhost:5173

## 🎉 Success!

You now have a fully functional campus event management system with:
- ✅ User authentication and authorization
- ✅ Event management (CRUD operations)
- ✅ Student registration and attendance
- ✅ Feedback collection system
- ✅ Role-based access control
- ✅ Modern, responsive UI
- ✅ Real-time data synchronization

The system is ready for development and can be easily extended with additional features!
