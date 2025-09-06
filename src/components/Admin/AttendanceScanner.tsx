import React, { useState } from 'react';
import QRCodeScanner from '../QRCode/QRCodeScanner';
import { attendanceAPI } from '../../lib/apiClient';
import { CheckCircle, XCircle, Users, Calendar } from 'lucide-react';

interface AttendanceScannerProps {
  eventId?: number;
  eventTitle?: string;
}

interface AttendanceRecord {
  id: number;
  studentName: string;
  eventTitle: string;
  timestamp: string;
}

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ 
  eventId, 
  eventTitle 
}) => {
  const [selectedEventId, setSelectedEventId] = useState<number>(eventId || 0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleQRScan = async (qrData: any) => {
    if (!selectedEventId) {
      setMessage({
        type: 'error',
        text: 'Please select an event first'
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await attendanceAPI.markQRAttendance(
        selectedEventId, 
        JSON.stringify(qrData)
      );

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        });

        // Add to attendance records
        if (result.attendance_id) {
          const newRecord: AttendanceRecord = {
            id: result.attendance_id,
            studentName: result.student_name || 'Unknown Student',
            eventTitle: result.event_title || 'Unknown Event',
            timestamp: new Date().toLocaleString()
          };
          setAttendanceRecords(prev => [newRecord, ...prev]);
        }
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to mark attendance'
      });
    } finally {
      setIsLoading(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  };

  const handleScanError = (error: string) => {
    setMessage({
      type: 'error',
      text: error
    });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">
            Attendance Scanner
          </h1>
        </div>

        {/* Event Selection */}
        {!eventId && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <input
              type="number"
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
              placeholder="Enter Event ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {eventTitle && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Calendar className="text-blue-600" size={20} />
              <span className="font-medium text-blue-800">
                Scanning for: {eventTitle}
              </span>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-800"></div>
              <span>Processing attendance...</span>
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner */}
      <QRCodeScanner 
        onScan={handleQRScan}
        onError={handleScanError}
        className="w-full"
      />

      {/* Attendance Records */}
      {attendanceRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Recent Attendance Records
          </h2>
          <div className="space-y-3">
            {attendanceRecords.map((record) => (
              <div 
                key={record.id}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div>
                  <div className="font-medium text-green-800">
                    {record.studentName}
                  </div>
                  <div className="text-sm text-green-600">
                    {record.eventTitle}
                  </div>
                </div>
                <div className="text-sm text-green-600">
                  {record.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceScanner;
