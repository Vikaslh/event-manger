from sqlalchemy.orm import Session
from typing import List, Optional
from models import User, College, Event, Registration, Attendance, Feedback
from schemas import UserCreate, CollegeCreate, EventCreate, EventUpdate, RegistrationCreate, AttendanceCreate, FeedbackCreate

# User CRUD operations
def create_user(db: Session, user_data: UserCreate, hashed_password: str) -> User:
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        college_id=user_data.college_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

# College CRUD operations
def create_college(db: Session, college_data: CollegeCreate) -> College:
    db_college = College(name=college_data.name)
    db.add(db_college)
    db.commit()
    db.refresh(db_college)
    return db_college

def get_colleges(db: Session, skip: int = 0, limit: int = 100) -> List[College]:
    return db.query(College).offset(skip).limit(limit).all()

def get_college_by_id(db: Session, college_id: int) -> Optional[College]:
    return db.query(College).filter(College.id == college_id).first()

# Event CRUD operations
def create_event(db: Session, event_data: EventCreate, created_by: int) -> Event:
    db_event = Event(
        title=event_data.title,
        description=event_data.description,
        type=event_data.type,
        date=event_data.date,
        location=event_data.location,
        max_attendees=event_data.max_attendees,
        college_id=event_data.college_id,
        created_by=created_by
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_events(db: Session, skip: int = 0, limit: int = 100) -> List[Event]:
    return db.query(Event).offset(skip).limit(limit).all()

def get_event_by_id(db: Session, event_id: int) -> Optional[Event]:
    return db.query(Event).filter(Event.id == event_id).first()

def update_event(db: Session, event_id: int, event_data: EventUpdate) -> Event:
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if db_event:
        update_data = event_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_event, field, value)
        db.commit()
        db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int) -> bool:
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if db_event:
        db.delete(db_event)
        db.commit()
        return True
    return False

# Registration CRUD operations
def create_registration(db: Session, registration_data: RegistrationCreate, student_id: int) -> Registration:
    db_registration = Registration(
        student_id=student_id,
        event_id=registration_data.event_id
    )
    db.add(db_registration)
    db.commit()
    db.refresh(db_registration)
    return db_registration

def get_user_registrations(db: Session, student_id: int) -> List[Registration]:
    return db.query(Registration).filter(Registration.student_id == student_id).all()

def get_event_registrations(db: Session, event_id: int) -> List[Registration]:
    return db.query(Registration).filter(Registration.event_id == event_id).all()

# Attendance CRUD operations
def create_attendance(db: Session, attendance_data: AttendanceCreate, student_id: int) -> Attendance:
    db_attendance = Attendance(
        registration_id=attendance_data.registration_id,
        student_id=student_id,
        event_id=attendance_data.event_id
    )
    db.add(db_attendance)
    db.commit()
    db.refresh(db_attendance)
    return db_attendance

def get_user_attendance(db: Session, student_id: int) -> List[Attendance]:
    return db.query(Attendance).filter(Attendance.student_id == student_id).all()

# Feedback CRUD operations
def create_feedback(db: Session, feedback_data: FeedbackCreate, student_id: int) -> Feedback:
    db_feedback = Feedback(
        registration_id=feedback_data.registration_id,
        student_id=student_id,
        event_id=feedback_data.event_id,
        rating=feedback_data.rating,
        comment=feedback_data.comment
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_user_feedback(db: Session, student_id: int) -> List[Feedback]:
    return db.query(Feedback).filter(Feedback.student_id == student_id).all()

def get_event_feedback(db: Session, event_id: int) -> List[Feedback]:
    return db.query(Feedback).filter(Feedback.event_id == event_id).all()

def get_event_average_rating(db: Session, event_id: int) -> float:
    """Calculate average rating for an event"""
    feedbacks = db.query(Feedback).filter(Feedback.event_id == event_id).all()
    if not feedbacks:
        return 0.0
    total_rating = sum(f.rating for f in feedbacks)
    return round(total_rating / len(feedbacks), 1)

def get_all_feedback(db: Session) -> List[Feedback]:
    return db.query(Feedback).all()
