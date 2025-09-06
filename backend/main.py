from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn
from datetime import datetime, timedelta
from typing import List, Optional

from database import get_db, engine, Base
from models import User, College, Event, Registration, Attendance, Feedback
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    CollegeCreate, CollegeResponse,
    EventCreate, EventUpdate, EventResponse,
    RegistrationCreate, RegistrationResponse,
    AttendanceCreate, AttendanceResponse,
    FeedbackCreate, FeedbackResponse
)
from auth import create_access_token, verify_token, get_password_hash, verify_password
from crud import (
    create_user, get_user_by_email, get_user_by_id,
    create_college, get_colleges, get_college_by_id,
    create_event, get_events, get_event_by_id, update_event, delete_event,
    create_registration, get_user_registrations, get_event_registrations,
    create_attendance, get_user_attendance,
    create_feedback, get_user_feedback
)
from config import ALLOWED_ORIGINS

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Campus Event Management API",
    description="Backend API for campus event management system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub")
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

# Health check
@app.get("/")
async def root():
    return {"message": "Campus Event Management API is running"}

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    user = create_user(db, user_data, hashed_password)
    return user

@app.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, user_credentials.email)
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# College endpoints
@app.post("/colleges", response_model=CollegeResponse)
async def create_college_endpoint(college_data: CollegeCreate, db: Session = Depends(get_db)):
    return create_college(db, college_data)

@app.get("/colleges", response_model=List[CollegeResponse])
async def get_colleges_endpoint(db: Session = Depends(get_db)):
    return get_colleges(db)

# Event endpoints
@app.post("/events", response_model=EventResponse)
async def create_event_endpoint(event_data: EventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create events"
        )
    return create_event(db, event_data, current_user.id)

@app.get("/events", response_model=List[EventResponse])
async def get_events_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_events(db, skip=skip, limit=limit)

@app.get("/events/{event_id}", response_model=EventResponse)
async def get_event_endpoint(event_id: int, db: Session = Depends(get_db)):
    event = get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return event

@app.put("/events/{event_id}", response_model=EventResponse)
async def update_event_endpoint(event_id: int, event_data: EventUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update events"
        )
    
    event = get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    return update_event(db, event_id, event_data)

@app.delete("/events/{event_id}")
async def delete_event_endpoint(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete events"
        )
    
    event = get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    delete_event(db, event_id)
    return {"message": "Event deleted successfully"}

# Registration endpoints
@app.post("/registrations", response_model=RegistrationResponse)
async def create_registration_endpoint(registration_data: RegistrationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can register for events"
        )
    
    # Check if already registered
    existing_registration = db.query(Registration).filter(
        Registration.student_id == current_user.id,
        Registration.event_id == registration_data.event_id
    ).first()
    
    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this event"
        )
    
    return create_registration(db, registration_data, current_user.id)

@app.get("/registrations/my", response_model=List[RegistrationResponse])
async def get_my_registrations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_registrations(db, current_user.id)

@app.get("/registrations/all", response_model=List[RegistrationResponse])
async def get_all_registrations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view all registrations"
        )
    return db.query(Registration).all()

# Attendance endpoints
@app.post("/attendance", response_model=AttendanceResponse)
async def create_attendance_endpoint(attendance_data: AttendanceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_attendance(db, attendance_data, current_user.id)

@app.get("/attendance/my", response_model=List[AttendanceResponse])
async def get_my_attendance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_attendance(db, current_user.id)

@app.get("/attendance/all", response_model=List[AttendanceResponse])
async def get_all_attendance(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view all attendance"
        )
    return db.query(Attendance).all()

# Feedback endpoints
@app.post("/feedback", response_model=FeedbackResponse)
async def create_feedback_endpoint(feedback_data: FeedbackCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_feedback(db, feedback_data, current_user.id)

@app.get("/feedback/my", response_model=List[FeedbackResponse])
async def get_my_feedback(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_feedback(db, current_user.id)

@app.get("/feedback/all", response_model=List[FeedbackResponse])
async def get_all_feedback(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can view all feedback"
        )
    return db.query(Feedback).all()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
