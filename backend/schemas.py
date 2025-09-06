from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "student"
    college_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Token schema
class Token(BaseModel):
    access_token: str
    token_type: str

# College schemas
class CollegeBase(BaseModel):
    name: str

class CollegeCreate(CollegeBase):
    pass

class CollegeResponse(CollegeBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Event schemas
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: str
    date: datetime
    location: Optional[str] = None
    max_attendees: Optional[int] = None
    college_id: int

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    max_attendees: Optional[int] = None
    college_id: Optional[int] = None

class EventResponse(EventBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    average_rating: Optional[float] = None
    
    class Config:
        from_attributes = True

# Registration schemas
class RegistrationBase(BaseModel):
    event_id: int

class RegistrationCreate(RegistrationBase):
    pass

class RegistrationResponse(RegistrationBase):
    id: int
    student_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Attendance schemas
class AttendanceBase(BaseModel):
    registration_id: int
    event_id: int

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: int
    student_id: int
    check_in_time: datetime
    
    class Config:
        from_attributes = True

# QR Code Attendance schemas
class QRAttendanceCreate(BaseModel):
    event_id: int
    qr_data: str

class QRAttendanceResponse(BaseModel):
    success: bool
    message: str
    attendance_id: Optional[int] = None
    student_name: Optional[str] = None
    event_title: Optional[str] = None

# Feedback schemas
class FeedbackBase(BaseModel):
    registration_id: int
    event_id: int
    rating: int
    comment: Optional[str] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackResponse(FeedbackBase):
    id: int
    student_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
