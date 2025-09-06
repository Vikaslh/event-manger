export interface College {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  collegeId: string;
}

export interface Event {
  id: string;
  title: string;
  type: 'Workshop' | 'Fest' | 'Seminar' | 'Conference' | 'Sports' | 'Cultural';
  date: string;
  collegeId: string;
  description: string;
  location: string;
  maxAttendees?: number;
  averageRating?: number;
}

export interface Registration {
  id: string;
  studentId: string;
  eventId: string;
  timestamp: string;
}

export interface Attendance {
  id: string;
  registrationId: string;
  checkInTime: string;
}

export interface Feedback {
  id: string;
  registrationId: string;
  rating: number;
  comment: string;
}

export interface EventWithStats extends Event {
  registrationCount: number;
  attendanceCount: number;
  averageFeedback: number;
  averageRating?: number;
  collegeName: string;
  createdBy?: number;
  creatorName?: string;
}

export interface StudentWithStats extends Student {
  registrationCount: number;
  attendanceCount: number;
  collegeName: string;
}
