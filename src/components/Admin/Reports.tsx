import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Calendar, Star } from 'lucide-react';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { EventWithStats, StudentWithStats } from '../../types';

interface ReportsProps {
  events: EventWithStats[];
  students: StudentWithStats[];
}

export const Reports: React.FC<ReportsProps> = ({ events, students }) => {
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');

  const filteredEvents = events.filter(event => {
    const matchesCollege = !selectedCollege || event.collegeName.includes(selectedCollege);
    const matchesType = !selectedEventType || event.type === selectedEventType;
    const matchesCreator = !selectedCreator || event.creatorName?.includes(selectedCreator);
    const matchesEvent = !selectedEvent || event.id === selectedEvent;
    return matchesCollege && matchesType && matchesCreator && matchesEvent;
  });

  // Calculate statistics
  const totalRegistrations = filteredEvents.reduce((sum, event) => sum + event.registrationCount, 0);
  const totalAttendance = filteredEvents.reduce((sum, event) => sum + event.attendanceCount, 0);
  const averageRating = filteredEvents.reduce((sum, event) => sum + (event.averageRating || 0), 0) / filteredEvents.length || 0;
  const attendanceRate = totalRegistrations > 0 ? (totalAttendance / totalRegistrations) * 100 : 0;

  // Event popularity data
  const popularityData = filteredEvents
    .sort((a, b) => b.registrationCount - a.registrationCount)
    .slice(0, 10)
    .map(event => ({
      name: event.title.substring(0, 20) + (event.title.length > 20 ? '...' : ''),
      registrations: event.registrationCount,
      attendance: event.attendanceCount,
    }));

  // Event type distribution
  const typeDistribution = filteredEvents.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeDistribution).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  // Top students
  const topStudents = students
    .sort((a, b) => b.registrationCount - a.registrationCount)
    .slice(0, 10);

  // Colors for pie chart
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const colleges = [...new Set(events.map(e => e.collegeName))];
  const eventTypes = ['Workshop', 'Fest', 'Seminar', 'Conference', 'Sports', 'Cultural'];
  const creators = [...new Set(events.map(e => e.creatorName).filter(Boolean))];

  const collegeOptions = [
    { value: '', label: 'All Colleges' },
    ...colleges.map(college => ({ value: college, label: college })),
  ];

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...eventTypes.map(type => ({ value: type, label: type })),
  ];

  const creatorOptions = [
    { value: '', label: 'All Creators' },
    ...creators.map(creator => ({ value: creator, label: creator })),
  ];

  const eventOptions = [
    { value: '', label: 'All Events' },
    ...events.map(event => ({ 
      value: event.id, 
      label: `${event.title} (${event.type})` 
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            options={collegeOptions}
          />
          <Select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            options={typeOptions}
          />
          <Select
            value={selectedCreator}
            onChange={(e) => setSelectedCreator(e.target.value)}
            options={creatorOptions}
          />
          <Select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            options={eventOptions}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{filteredEvents.length}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </Card>

        <Card className="text-center">
          <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalRegistrations}</div>
          <div className="text-sm text-gray-600">Total Registrations</div>
        </Card>

        <Card className="text-center">
          <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{attendanceRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Attendance Rate</div>
        </Card>

        <Card className="text-center">
          <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </Card>
      </div>

      {/* Detailed Event Analytics - Show when specific event is selected */}
      {selectedEvent && filteredEvents.length === 1 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Analytics: {filteredEvents[0].title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{filteredEvents[0].registrationCount}</div>
              <div className="text-sm text-blue-800">Total Registrations</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{filteredEvents[0].attendanceCount}</div>
              <div className="text-sm text-green-800">Total Attendance</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredEvents[0].registrationCount > 0 
                  ? ((filteredEvents[0].attendanceCount / filteredEvents[0].registrationCount) * 100).toFixed(1)
                  : 0}%
              </div>
              <div className="text-sm text-yellow-800">Attendance Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {filteredEvents[0].averageRating ? filteredEvents[0].averageRating.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm text-purple-800">Average Rating</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Event Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div><span className="font-medium">Type:</span> {filteredEvents[0].type}</div>
                <div><span className="font-medium">College:</span> {filteredEvents[0].collegeName}</div>
                <div><span className="font-medium">Creator:</span> {filteredEvents[0].creatorName}</div>
                <div><span className="font-medium">Date:</span> {new Date(filteredEvents[0].date).toLocaleDateString()}</div>
                <div><span className="font-medium">Location:</span> {filteredEvents[0].location}</div>
                {filteredEvents[0].maxAttendees && (
                  <div><span className="font-medium">Max Attendees:</span> {filteredEvents[0].maxAttendees}</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Performance Metrics</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Registration Fill Rate:</span>{' '}
                  {filteredEvents[0].maxAttendees 
                    ? `${((filteredEvents[0].registrationCount / filteredEvents[0].maxAttendees) * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </div>
                <div>
                  <span className="font-medium">No-Show Rate:</span>{' '}
                  {filteredEvents[0].registrationCount > 0 
                    ? `${(((filteredEvents[0].registrationCount - filteredEvents[0].attendanceCount) / filteredEvents[0].registrationCount) * 100).toFixed(1)}%`
                    : 'N/A'
                  }
                </div>
                <div>
                  <span className="font-medium">Event Status:</span>{' '}
                  <span className={`px-2 py-1 rounded text-xs ${
                    new Date(filteredEvents[0].date) < new Date() 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {new Date(filteredEvents[0].date) < new Date() ? 'Completed' : 'Upcoming'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Popularity Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Popularity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="registrations" fill="#3B82F6" name="Registrations" />
              <Bar dataKey="attendance" fill="#10B981" name="Attendance" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Event Type Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Students */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Most Active Students</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registrations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topStudents.map((student, index) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.collegeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.registrationCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.attendanceCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
