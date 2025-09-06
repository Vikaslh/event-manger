import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { EventWithStats } from '../../types';

interface EventBrowserProps {
  events: EventWithStats[];
  registeredEventIds: string[];
  onRegisterForEvent: (eventId: string) => void;
}

export const EventBrowser: React.FC<EventBrowserProps> = ({
  events,
  registeredEventIds,
  onRegisterForEvent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || event.type === typeFilter;
    const matchesCollege = !collegeFilter || event.collegeName.toLowerCase().includes(collegeFilter.toLowerCase());
    return matchesSearch && matchesType && matchesCollege;
  });

  const eventTypes = [
    { value: '', label: 'All Types' },
    { value: 'Workshop', label: 'Workshop' },
    { value: 'Fest', label: 'Fest' },
    { value: 'Seminar', label: 'Seminar' },
    { value: 'Conference', label: 'Conference' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Cultural', label: 'Cultural' },
  ];

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

  const isEventPast = (date: string) => new Date(date) < new Date();
  const isRegistered = (eventId: string) => registeredEventIds.includes(eventId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Browse Events</h1>
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={eventTypes}
          />
          <Input
            placeholder="Filter by college..."
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const isPast = isEventPast(event.date);
          const isUserRegistered = isRegistered(event.id);
          
          return (
            <Card key={event.id} className={`space-y-4 ${isPast ? 'opacity-75' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getTypeColor(event.type) as any}>
                      {event.type}
                    </Badge>
                    {isPast && <Badge variant="secondary">Past Event</Badge>}
                    {isUserRegistered && <Badge variant="success">Registered</Badge>}
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

              <p className="text-sm text-gray-600 line-clamp-3">{event.description}</p>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{event.registrationCount}</div>
                  <div className="text-xs text-gray-500">Registered</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{event.attendanceCount}</div>
                  <div className="text-xs text-gray-500">Attended</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-semibold text-yellow-600">
                      {event.averageRating ? event.averageRating.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
              </div>

              <div className="pt-4">
                {!isPast && !isUserRegistered && (
                  <Button
                    onClick={() => onRegisterForEvent(event.id)}
                    className="w-full"
                  >
                    Register for Event
                  </Button>
                )}
                {isUserRegistered && (
                  <Button variant="outline" className="w-full" disabled>
                    Already Registered
                  </Button>
                )}
                {isPast && (
                  <Button variant="secondary" className="w-full" disabled>
                    Event Ended
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">Try adjusting your search criteria to find events.</p>
        </Card>
      )}
    </div>
  );
};
