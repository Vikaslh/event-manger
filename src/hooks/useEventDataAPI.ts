import { useState, useEffect, useMemo } from 'react';
import { 
  Event, 
  EventWithStats, 
  StudentWithStats,
  Registration,
  Attendance,
  Feedback
} from '../types';
import { eventAPI, registrationAPI, attendanceAPI, feedbackAPI, collegeAPI, authAPI } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

export const useEventDataAPI = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [colleges, setColleges] = useState<Array<{ id: number; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: number; full_name: string }>>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load different data based on user role
        const isAdmin = user.role === 'admin';
        const [eventsData, collegesData, usersData, registrationsData, attendanceData, feedbackData] = await Promise.all([
          eventAPI.getEvents(),
          collegeAPI.getColleges(),
          isAdmin ? authAPI.getUsers() : Promise.resolve([]),
          isAdmin ? registrationAPI.getAllRegistrations() : registrationAPI.getMyRegistrations(),
          isAdmin ? attendanceAPI.getAllAttendance() : attendanceAPI.getMyAttendance(),
          isAdmin ? feedbackAPI.getAllFeedback() : feedbackAPI.getMyFeedback(),
        ]);

        // Transform backend data to frontend format (convert IDs to strings)
        const transformedEvents = eventsData.map(event => ({
          ...event,
          id: event.id.toString(),
          collegeId: event.college_id.toString(),
          createdBy: event.created_by.toString(),
        }));

        const transformedColleges = collegesData.map(college => ({
          ...college,
          id: college.id.toString(),
        }));

        const transformedUsers = usersData.map(user => ({
          ...user,
          id: user.id.toString(),
        }));

        const transformedRegistrations = registrationsData.map(registration => ({
          ...registration,
          id: registration.id.toString(),
          studentId: registration.student_id.toString(),
          eventId: registration.event_id.toString(),
          timestamp: registration.created_at,
        }));

        const transformedAttendance = attendanceData.map(attendance => ({
          ...attendance,
          id: attendance.id.toString(),
          registrationId: attendance.registration_id.toString(),
          studentId: attendance.student_id.toString(),
          eventId: attendance.event_id.toString(),
          checkInTime: attendance.check_in_time,
        }));

        const transformedFeedback = feedbackData.map(feedback => ({
          ...feedback,
          id: feedback.id.toString(),
          registrationId: feedback.registration_id.toString(),
          studentId: feedback.student_id.toString(),
          eventId: feedback.event_id.toString(),
        }));

        setEvents(transformedEvents);
        setColleges(transformedColleges);
        setUsers(transformedUsers);
        setRegistrations(transformedRegistrations);
        setAttendance(transformedAttendance);
        setFeedback(transformedFeedback);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

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

      const college = colleges.find(c => c.id === event.collegeId);
      const creator = users.find(u => u.id === event.createdBy);

      return {
        ...event,
        registrationCount: eventRegistrations.length,
        attendanceCount: eventAttendance.length,
        averageFeedback,
        collegeName: college?.name || 'Unknown College',
        creatorName: creator?.full_name || 'Unknown Creator',
      };
    });
  }, [events, registrations, attendance, feedback, colleges, users]);

  // Students with statistics (for admin view)
  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    // This would need to be implemented in the backend
    // For now, return empty array
    return [];
  }, []);

  // Current student's data
  const registeredEventIds = registrations.map(r => r.eventId);
  const attendedEventIds = attendance.map(a => {
    const registration = registrations.find(r => r.id === a.registrationId);
    return registration?.eventId;
  }).filter(Boolean) as string[];
  const feedbackSubmittedIds = feedback.map(f => {
    const registration = registrations.find(r => r.id === f.registrationId);
    return registration?.eventId;
  }).filter(Boolean) as string[];

  const registeredEvents = eventsWithStats.filter(e => registeredEventIds.includes(e.id));

  // Actions
  const createEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      const newEvent = await eventAPI.createEvent({
        title: eventData.title,
        description: eventData.description,
        type: eventData.type,
        date: eventData.date,
        location: eventData.location,
        max_attendees: eventData.maxAttendees,
        college_id: parseInt(eventData.collegeId),
      });
      
      // Transform the response to frontend format
      const transformedEvent = {
        ...newEvent,
        id: newEvent.id.toString(),
        collegeId: newEvent.college_id.toString(),
        createdBy: newEvent.created_by.toString(),
      };
      
      setEvents(prev => [...prev, transformedEvent]);
      return transformedEvent;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  };

  const updateEvent = async (eventId: string, eventData: Omit<Event, 'id'>) => {
    try {
      const updatedEvent = await eventAPI.updateEvent(parseInt(eventId), {
        title: eventData.title,
        description: eventData.description,
        type: eventData.type,
        date: eventData.date,
        location: eventData.location,
        max_attendees: eventData.maxAttendees,
        college_id: parseInt(eventData.collegeId),
      });
      
      // Transform the response to frontend format
      const transformedEvent = {
        ...updatedEvent,
        id: updatedEvent.id.toString(),
        collegeId: updatedEvent.college_id.toString(),
        createdBy: updatedEvent.created_by.toString(),
      };
      
      setEvents(prev => prev.map(event => 
        event.id === eventId ? transformedEvent : event
      ));
      return transformedEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw error;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await eventAPI.deleteEvent(parseInt(eventId));
      setEvents(prev => prev.filter(event => event.id !== eventId));
      // Also remove related registrations, attendance, and feedback
      setRegistrations(prev => prev.filter(r => r.eventId !== eventId));
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error;
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const newRegistration = await registrationAPI.createRegistration(parseInt(eventId));
      
      // Transform the response to frontend format
      const transformedRegistration = {
        ...newRegistration,
        id: newRegistration.id.toString(),
        studentId: newRegistration.student_id.toString(),
        eventId: newRegistration.event_id.toString(),
        timestamp: newRegistration.created_at,
      };
      
      setRegistrations(prev => [...prev, transformedRegistration]);
      
      // If user is admin, refresh all data to get updated statistics
      if (user?.role === 'admin') {
        const [allRegistrations, allAttendance, allFeedback] = await Promise.all([
          registrationAPI.getAllRegistrations(),
          attendanceAPI.getAllAttendance(),
          feedbackAPI.getAllFeedback(),
        ]);
        
        const transformedRegistrations = allRegistrations.map(registration => ({
          ...registration,
          id: registration.id.toString(),
          studentId: registration.student_id.toString(),
          eventId: registration.event_id.toString(),
          timestamp: registration.created_at,
        }));
        
        const transformedAttendance = allAttendance.map(attendance => ({
          ...attendance,
          id: attendance.id.toString(),
          registrationId: attendance.registration_id.toString(),
          studentId: attendance.student_id.toString(),
          eventId: attendance.event_id.toString(),
          checkInTime: attendance.check_in_time,
        }));
        
        const transformedFeedback = allFeedback.map(feedback => ({
          ...feedback,
          id: feedback.id.toString(),
          registrationId: feedback.registration_id.toString(),
          studentId: feedback.student_id.toString(),
          eventId: feedback.event_id.toString(),
        }));
        
        setRegistrations(transformedRegistrations);
        setAttendance(transformedAttendance);
        setFeedback(transformedFeedback);
      }
    } catch (error) {
      console.error('Failed to register for event:', error);
      throw error;
    }
  };

  const markAttendance = async (eventId: string) => {
    try {
      const registration = registrations.find(r => r.eventId === eventId);
      if (!registration) {
        throw new Error('Registration not found. Please register for this event first.');
      }
      
      // Check if attendance already exists
      const existingAttendance = attendance.find(a => {
        const attendanceRegistration = registrations.find(r => r.id === a.registrationId);
        return attendanceRegistration?.eventId === eventId && a.studentId === user?.id?.toString();
      });
      
      if (existingAttendance) {
        throw new Error('Attendance already marked for this event.');
      }
      
      const newAttendance = await attendanceAPI.createAttendance(parseInt(registration.id), parseInt(eventId));
      
      // Transform the response to frontend format
      const transformedAttendance = {
        ...newAttendance,
        id: newAttendance.id.toString(),
        registrationId: newAttendance.registration_id.toString(),
        studentId: newAttendance.student_id.toString(),
        eventId: newAttendance.event_id.toString(),
        checkInTime: newAttendance.check_in_time,
      };
      
      setAttendance(prev => [...prev, transformedAttendance]);
      return transformedAttendance;
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      throw error;
    }
  };

  const submitFeedback = async (eventId: string, rating: number, comment: string) => {
    try {
      const registration = registrations.find(r => r.eventId === eventId);
      if (registration) {
        const newFeedback = await feedbackAPI.createFeedback(parseInt(registration.id), parseInt(eventId), rating, comment);
        
        // Transform the response to frontend format
        const transformedFeedback = {
          ...newFeedback,
          id: newFeedback.id.toString(),
          registrationId: newFeedback.registration_id.toString(),
          studentId: newFeedback.student_id.toString(),
          eventId: newFeedback.event_id.toString(),
        };
        
        setFeedback(prev => [...prev, transformedFeedback]);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  };

  return {
    // Data
    eventsWithStats,
    studentsWithStats,
    currentStudent: user,
    registeredEvents,
    registeredEventIds,
    attendedEventIds,
    feedbackSubmittedIds,
    colleges,
    loading,
    
    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    markAttendance,
    submitFeedback,
  };
};
