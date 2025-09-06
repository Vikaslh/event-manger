import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Event } from '../../types';
import { colleges } from '../../data/mockData';

interface EventFormProps {
  event?: Event;
  onSubmit: (event: Omit<Event, 'id'>) => void;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    type: event?.type || 'Workshop' as const,
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    collegeId: event?.collegeId || '',
    description: event?.description || '',
    location: event?.location || '',
    maxAttendees: event?.maxAttendees?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      type: formData.type,
      date: new Date(formData.date).toISOString(),
      collegeId: formData.collegeId,
      description: formData.description,
      location: formData.location,
      maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : undefined,
    });
  };

  const eventTypes = [
    { value: 'Workshop', label: 'Workshop' },
    { value: 'Fest', label: 'Fest' },
    { value: 'Seminar', label: 'Seminar' },
    { value: 'Conference', label: 'Conference' },
    { value: 'Sports', label: 'Sports' },
    { value: 'Cultural', label: 'Cultural' },
  ];

  const collegeOptions = [
    { value: '', label: 'Select College' },
    ...colleges.map(college => ({
      value: college.id,
      label: college.name,
    })),
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Event Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Select
              label="Event Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={eventTypes}
              required
            />

            <Input
              label="Date & Time"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />

            <Select
              label="College"
              value={formData.collegeId}
              onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
              options={collegeOptions}
              required
            />

            <Input
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />

            <Input
              label="Max Attendees"
              type="number"
              value={formData.maxAttendees}
              onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
