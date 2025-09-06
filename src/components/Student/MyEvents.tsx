import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Star, CheckCircle, XCircle, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EventWithStats } from '../../types';
import QRAttendance from './QRAttendance';

interface MyEventsProps {
  registeredEvents: EventWithStats[];
  attendedEventIds: string[];
  feedbackSubmitted: string[];
  onMarkAttendance: (eventId: string) => void;
  onSubmitFeedback: (eventId: string, rating: number, comment: string) => void;
}

export const MyEvents: React.FC<MyEventsProps> = ({
  registeredEvents,
  attendedEventIds,
  feedbackSubmitted,
  onMarkAttendance,
  onSubmitFeedback,
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState<string | null>(null);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceSuccess, setAttendanceSuccess] = useState<string | null>(null);

  const handleFeedbackSubmit = (eventId: string) => {
    onSubmitFeedback(eventId, feedbackRating, feedbackComment);
    setShowFeedbackForm(null);
    setFeedbackRating(5);
    setFeedbackComment('');
  };

  const handleMarkAttendance = async (eventId: string) => {
    setAttendanceLoading(eventId);
    setAttendanceError(null);
    setAttendanceSuccess(null);
    
    try {
      await onMarkAttendance(eventId);
      setAttendanceSuccess(eventId);
      setTimeout(() => setAttendanceSuccess(null), 3000);
    } catch (error: any) {
      setAttendanceError(error.message || 'Failed to mark attendance');
      setTimeout(() => setAttendanceError(null), 5000);
    } finally {
      setAttendanceLoading(null);
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      Workshop: 'primary',
      Fest: 'warning',
      Seminar: 'success',
      Conference: 'secondary',
      Sports: 'danger',
      Cultural: 'primary',
    };
    return colors[type as keyof typeof colors] || 'secondary';
  };

  const isEventToday = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  const isEventPast = (date: string) => new Date(date) < new Date();
  const isAttended = (eventId: string) => attendedEventIds.includes(eventId);
  const hasFeedback = (eventId: string) => feedbackSubmitted.includes(eventId);

  const upcomingEvents = registeredEvents.filter(event => !isEventPast(event.date));
  const pastEvents = registeredEvents.filter(event => isEventPast(event.date));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Events</h1>

      {/* Upcoming Events */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <Card className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming events registered.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getTypeColor(event.type) as any}>
                        {event.type}
                      </Badge>
                      {isEventToday(event.date) && (
                        <Badge variant="warning">Today</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.date), 'PPP')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(event.date), 'p')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{event.collegeName}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>

                {/* Error/Success Messages */}
                {attendanceError && (
                  <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">
                    {attendanceError}
                  </div>
                )}
                {attendanceSuccess === event.id && (
                  <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm">
                    Attendance marked successfully!
                  </div>
                )}

                {!isAttended(event.id) && (
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      {isEventToday(event.date) && (
                        <Button
                          onClick={() => handleMarkAttendance(event.id)}
                          className="flex-1"
                          variant="primary"
                          disabled={attendanceLoading === event.id}
                        >
                          {attendanceLoading === event.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Marking...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Attendance
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={() => setShowQRCode(showQRCode === event.id ? null : event.id)}
                        className="flex-1"
                        variant="outline"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {showQRCode === event.id ? 'Hide QR' : 'Show QR'}
                      </Button>
                    </div>
                    
                    {showQRCode === event.id && (
                      <div className="mt-4">
                        <QRAttendance
                          eventId={parseInt(event.id)}
                          eventTitle={event.title}
                          isRegistered={true}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Events</h2>
        {pastEvents.length === 0 ? (
          <Card className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No past events attended.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pastEvents.map((event) => (
              <Card key={event.id} className="space-y-4 opacity-90">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getTypeColor(event.type) as any}>
                        {event.type}
                      </Badge>
                      <Badge variant="secondary">Past Event</Badge>
                      {isAttended(event.id) ? (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Attended
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <XCircle className="h-3 w-3 mr-1" />
                          Missed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(event.date), 'PPP p')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                </div>

                {isAttended(event.id) && !hasFeedback(event.id) && (
                  <div className="space-y-3">
                    {showFeedbackForm === event.id ? (
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating (1-5 stars)
                          </label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setFeedbackRating(star)}
                                className={`h-6 w-6 ${
                                  star <= feedbackRating
                                    ? 'text-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              >
                                <Star className="h-6 w-6 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comment
                          </label>
                          <textarea
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            rows={3}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Share your feedback about this event..."
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleFeedbackSubmit(event.id)}
                          >
                            Submit Feedback
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowFeedbackForm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFeedbackForm(event.id)}
                        className="w-full"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Submit Feedback
                      </Button>
                    )}
                  </div>
                )}

                {hasFeedback(event.id) && (
                  <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Feedback submitted</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
