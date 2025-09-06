import React, { useState } from 'react';
import QRCodeGenerator from '../QRCode/QRCodeGenerator';
import { attendanceAPI } from '../../lib/apiClient';
import { QrCode, CheckCircle, XCircle, Clock } from 'lucide-react';

interface QRAttendanceProps {
  eventId: number;
  eventTitle: string;
  isRegistered: boolean;
}

const QRAttendance: React.FC<QRAttendanceProps> = ({ 
  eventId, 
  eventTitle, 
  isRegistered 
}) => {
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleMarkAttendance = async () => {
    if (!isRegistered) {
      setAttendanceStatus({
        type: 'error',
        message: 'You must be registered for this event to mark attendance'
      });
      return;
    }

    setIsMarkingAttendance(true);
    try {
      const result = await attendanceAPI.markStudentQRAttendance(eventId);
      
      if (result.success) {
        setAttendanceStatus({
          type: 'success',
          message: result.message
        });
      } else {
        setAttendanceStatus({
          type: 'info',
          message: result.message
        });
      }
    } catch (error: any) {
      setAttendanceStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to mark attendance'
      });
    } finally {
      setIsMarkingAttendance(false);
    }

    // Clear status after 5 seconds
    setTimeout(() => setAttendanceStatus(null), 5000);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <QrCode className="text-blue-600" size={28} />
          <h2 className="text-xl font-semibold text-gray-800">
            QR Code Attendance
          </h2>
        </div>
        <p className="text-gray-600">
          Use this QR code to mark your attendance or click the button below
        </p>
      </div>

      {/* Status Message */}
      {attendanceStatus && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          attendanceStatus.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : attendanceStatus.type === 'error'
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {attendanceStatus.type === 'success' ? (
            <CheckCircle size={20} />
          ) : attendanceStatus.type === 'error' ? (
            <XCircle size={20} />
          ) : (
            <Clock size={20} />
          )}
          <span className="font-medium">{attendanceStatus.message}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <QRCodeGenerator 
            eventId={eventId.toString()}
            eventTitle={eventTitle}
            className="max-w-sm"
          />
        </div>

        {/* Manual Attendance Button */}
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <span>Or mark attendance manually:</span>
            </div>
          </div>
          
          <button
            onClick={handleMarkAttendance}
            disabled={isMarkingAttendance || !isRegistered}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              !isRegistered
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isMarkingAttendance
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isMarkingAttendance ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Marking Attendance...</span>
              </div>
            ) : (
              'Mark My Attendance'
            )}
          </button>

          {!isRegistered && (
            <p className="mt-2 text-sm text-red-600">
              You must register for this event first
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-800 mb-2">How to use:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Show this QR code to the admin for scanning</li>
            <li>• Or click "Mark My Attendance" button</li>
            <li>• You can download the QR code for offline use</li>
            <li>• Attendance can only be marked once per event</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QRAttendance;
