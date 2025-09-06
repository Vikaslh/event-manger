from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="student")  # "student" or "admin"
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    college = relationship("College", back_populates="users")
    events_created = relationship("Event", back_populates="creator")
    registrations = relationship("Registration", back_populates="student")
    attendance = relationship("Attendance", back_populates="student")
    feedback = relationship("Feedback", back_populates="student")

class College(Base):
    __tablename__ = "colleges"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="college")
    events = relationship("Event", back_populates="college")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    type = Column(String, nullable=False)  # Workshop, Fest, Seminar, etc.
    date = Column(DateTime, nullable=False)
    location = Column(String)
    max_attendees = Column(Integer)
    college_id = Column(Integer, ForeignKey("colleges.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    college = relationship("College", back_populates="events")
    creator = relationship("User", back_populates="events_created")
    registrations = relationship("Registration", back_populates="event")
    attendance = relationship("Attendance", back_populates="event")
    feedback = relationship("Feedback", back_populates="event")

class Registration(Base):
    __tablename__ = "registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student = relationship("User", back_populates="registrations")
    event = relationship("Event", back_populates="registrations")
    attendance = relationship("Attendance", back_populates="registration")
    feedback = relationship("Feedback", back_populates="registration")

class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    check_in_time = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    registration = relationship("Registration", back_populates="attendance")
    student = relationship("User", back_populates="attendance")
    event = relationship("Event", back_populates="attendance")

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 scale
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    registration = relationship("Registration", back_populates="feedback")
    student = relationship("User", back_populates="feedback")
    event = relationship("Event", back_populates="feedback")
