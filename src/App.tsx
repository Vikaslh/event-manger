import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './components/Layout/Header';
import { EventList } from './components/Admin/EventList';
import { EventForm } from './components/Admin/EventForm';
import { Reports } from './components/Admin/Reports';
import { EventBrowser } from './components/Student/EventBrowser';
import { MyEvents } from './components/Student/MyEvents';
import { AuthPage } from './components/Auth/AuthPage';
import { useEventDataAPI } from './hooks/useEventDataAPI';
import { useAuth } from './contexts/AuthContext';
import { Event } from './types';

function App() {
  const { isAuthenticated, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();

  const {
    eventsWithStats,
    studentsWithStats,
    registeredEvents,
    registeredEventIds,
    attendedEventIds,
    feedbackSubmittedIds,
    createEvent,
    updateEvent,
    deleteEvent,
    registerForEvent,
    markAttendance,
    submitFeedback,
  } = useEventDataAPI();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  const userType = user.role as 'admin' | 'student';

  const handleCreateEvent = () => {
    setEditingEvent(undefined);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleEventSubmit = (eventData: Omit<Event, 'id'>) => {
    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
    } else {
      createEvent(eventData);
    }
    setShowEventForm(false);
    setEditingEvent(undefined);
  };


  const renderContent = () => {
    if (userType === 'admin') {
      switch (activeTab) {
        case 'events':
          return (
            <EventList
              events={eventsWithStats}
              onCreateEvent={handleCreateEvent}
              onEditEvent={handleEditEvent}
              onDeleteEvent={deleteEvent}
            />
          );
        case 'reports':
          return (
            <Reports
              events={eventsWithStats}
              students={studentsWithStats}
            />
          );
        default:
          return null;
      }
    } else {
      switch (activeTab) {
        case 'browse':
          return (
            <EventBrowser
              events={eventsWithStats}
              registeredEventIds={registeredEventIds}
              onRegisterForEvent={registerForEvent}
            />
          );
        case 'registered':
          return (
            <MyEvents
              registeredEvents={registeredEvents}
              attendedEventIds={attendedEventIds}
              feedbackSubmitted={feedbackSubmittedIds}
              onMarkAttendance={markAttendance}
              onSubmitFeedback={submitFeedback}
            />
          );
        default:
          return null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        userType={userType}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${userType}-${activeTab}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showEventForm && (
        <EventForm
          event={editingEvent}
          onSubmit={handleEventSubmit}
          onCancel={() => {
            setShowEventForm(false);
            setEditingEvent(undefined);
          }}
        />
      )}
    </div>
  );
}

export default App;
