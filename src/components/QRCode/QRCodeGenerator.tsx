import React from 'react';
import QRCode from 'react-qr-code';

interface QRCodeGeneratorProps {
  eventId: string;
  eventTitle: string;
  className?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  eventId, 
  eventTitle, 
  className = '' 
}) => {
  // Generate QR code data with event information
  const qrData = JSON.stringify({
    type: 'attendance',
    eventId: eventId,
    timestamp: Date.now()
  });

  const handleDownload = () => {
    const svg = document.getElementById(`qr-${eventId}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${eventTitle}-attendance-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Attendance QR Code
        </h3>
        <p className="text-sm text-gray-600">
          Students can scan this code to mark attendance
        </p>
      </div>
      
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
          <QRCode
            id={`qr-${eventId}`}
            value={qrData}
            size={200}
            level="M"
          />
        </div>
      </div>
      
      <div className="text-center">
        <button
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Download QR Code
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Event ID: {eventId}
      </div>
    </div>
  );
};

export default QRCodeGenerator;
