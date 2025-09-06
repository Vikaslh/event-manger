import { useState, useEffect, useMemo } from 'react';
import { 
  Event, 
  EventWithStats, 
  StudentWithStats,
  Registration,
  Attendance,
  Feedback
} from '../types';
import { 
  events as mockEvents, 
  students as mockStudents, 
  colleges as mockColleges,
  registrations as mockRegistrations,
  attendance as mockAttendance,
  feedback as mockFeedback
} from '../data/mockData';

export const useEventData = () => {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [registrations, setRegistrations] = useState<Registration[]>(mockRegistrations);
  const [attendance, setAttendance] = useState<Attendance[]>(mockAttendance);
  const [feedback, setFeedback] = useState<Feedback[]>(mockFeedback);

  // Current user simulation (student)
  const currentStudent = mockStudents[0];

  // Enhanced events with statistics
  const eventsWithStats: EventWithStats[] = useMemo(() => {
    return events.map(event => {
      const eventRegistrations = registrations.filter(r => r.eventId === event.id);
      const eventAttendance = attendance.filter(a => 
        eventRegistrations.some(r => r.id === a.registrationId)
      );
      const eventFeedback = feedback.filter(f => 
        eventRegistrations.some(r => r.id === f.registrationId)
      );
      
      const averageFeedback = eventFeedback.length > 0 
        ? eventFeedback.reduce((sum, f) => sum + f.rating, 0) / eventFeedback.length 
        : 0;

      const college = mockColleges.find(c => c.id === event.collegeId);

      return {
        ...event,
        registrationCount: eventRegistrations.length,
        attendanceCount: eventAttendance.length,
        averageFeedback,
        collegeName: college?.name || 'Unknown College',
      };
    });
  }, [events, registrations, attendance, feedback]);

  // Students with statistics
  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    return mockStudents.map(student => {
      const studentRegistrations = registrations.filter(r => r.studentId === student.id);
      const studentAttendance = attendance.filter(a => 
        studentRegistrations.some(r => r.id === a.registrationId)
      );
      
      const college = mockColleges.find(c => c.id === student.collegeId);

      return {
        ...student,
        registrationCount: studentRegistrations.length,
        attendanceCount: studentAttendance.length,
        collegeName: college?.name || 'Unknown College',
      };
    });
  }, [registrations, attendance]);

  // Current student's data
  const currentStudentRegistrations = registrations.filter(r => r.studentId === currentStudent.id);
  const currentStudentAttendance = attendance.filter(a => 
    currentStudentRegistrations.some(r => r.id === a.registrationId)
  );
  const currentStudentFeedback = feedback.filter(f => 
    currentStudentRegistrations.some(r => r.id === f.registrationId)
  );

  const registeredEventIds = currentStudentRegistrations.map(r => r.eventId);
  const attendedEventIds = currentStudentAttendance.map(a => {
    const registration = currentStudentRegistrations.find(r => r.id === a.registrationId);
    return registration?.eventId;
  }).filter(Boolean) as string[];
  const feedbackSubmittedIds = currentStudentFeedback.map(f => {
    const registration = currentStudentRegistrations.find(r => r.id === f.registrationId);
    return registration?.eventId;
  }).filter(Boolean) as string[];

  const registeredEvents = eventsWithStats.filter(e => registeredEventIds.includes(e.id));

  // Actions
  const createEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setEvents(prev => [...prev, newEvent]);
  };

  const updateEvent = (eventId: string, eventData: Omit<Event, 'id'>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...eventData, id: eventId } : event
    ));
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    // Also remove related registrations, attendance, and feedback
    setRegistrations(prev => prev.filter(r => r.eventId !== eventId));
  };

  const registerForEvent = (eventId: string) => {
    const newRegistration: Registration = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: currentStudent.id,
      eventId,
      timestamp: new Date().toISOString(),
    };
    setRegistrations(prev => [...prev, newRegistration]);
  };

  const markAttendance = (eventId: string) => {
    const registration = currentStudentRegistrations.find(r => r.eventId === eventId);
    if (registration) {
      const newAttendance: Attendance = {
        id: Math.random().toString(36).substr(2, 9),
        registrationId: registration.id,
        checkInTime: new Date().toISOString(),
      };
      setAttendance(prev => [...prev, newAttendance]);
    }
  };

  const submitFeedback = (eventId: string, rating: number, comment: string) => {
    const registration = currentStudentRegistrations.find(r => r.eventId === eventId);
    if (registration) {
      const newFeedback: Feedback = {
        id: Math.random().toString(36).substr(2, 9),
        registrationId: registration.id,
        rating,
        comment,
      };
      setFeedback(prev => [...prev, newFeedback]);
    }
  };

  return {
    // Data
    eventsWithStats,
    studentsWithStats,
    currentStudent,
    registeredEvents,
    registeredEventIds,
    attendedEventIds,
    feedbackSubmittedIds,
    
    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    markAttendance,
    submitFeedback,
  };
};
