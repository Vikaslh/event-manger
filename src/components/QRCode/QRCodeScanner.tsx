import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, CameraOff, CheckCircle, XCircle, Upload, Image } from 'lucide-react';

interface QRCodeScannerProps {
  onScan: (data: any) => void;
  onError?: (error: string) => void;
  className?: string;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ 
  onScan, 
  onError, 
  className = '' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const initializeScanner = async () => {
      if (videoRef.current) {
        try {
          // Check if camera is available first
          const hasCameraAccess = await QrScanner.hasCamera();
          setHasCamera(hasCameraAccess);
          
          if (!hasCameraAccess) {
            console.warn('No camera available');
            return;
          }

          qrScannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
              try {
                // Try to parse as JSON first
                let data;
                try {
                  data = JSON.parse(result.data);
                } catch {
                  // If not JSON, treat as plain text
                  data = { type: 'attendance', eventId: result.data };
                }
                
                if (data.type === 'attendance' && data.eventId) {
                  setScanResult({
                    type: 'success',
                    message: `Scanned attendance for Event ID: ${data.eventId}`
                  });
                  onScan(data);
                } else {
                  throw new Error('Invalid QR code format');
                }
              } catch (error) {
                console.error('Camera QR code validation error:', error);
                console.log('Raw camera QR data:', result.data);
                const errorMsg = `Invalid QR code format. Expected attendance QR with eventId, got: ${result.data.substring(0, 50)}...`;
                setScanResult({
                  type: 'error',
                  message: errorMsg
                });
                onError?.(errorMsg);
              }
              
              // Clear result after 3 seconds
              setTimeout(() => setScanResult(null), 3000);
            },
            {
              highlightScanRegion: true,
              highlightCodeOutline: true,
              preferredCamera: 'environment',
              maxScansPerSecond: 5,
              calculateScanRegion: (video) => {
                const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
                const scanRegionSize = Math.round(0.7 * smallestDimension);
                return {
                  x: Math.round((video.videoWidth - scanRegionSize) / 2),
                  y: Math.round((video.videoHeight - scanRegionSize) / 2),
                  width: scanRegionSize,
                  height: scanRegionSize,
                };
              }
            }
          );
        } catch (error) {
          console.error('Failed to initialize QR scanner:', error);
          setHasCamera(false);
          onError?.('Failed to initialize camera');
        }
      }
    };

    initializeScanner();

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, [onScan, onError]);

  const startScanning = async () => {
    if (qrScannerRef.current && hasCamera) {
      try {
        setCameraLoading(true);
        setScanResult(null); // Clear any previous messages
        
        await qrScannerRef.current.start();
        
        // Wait a moment for the video stream to initialize
        setTimeout(() => {
          setIsScanning(true);
          setCameraLoading(false);
        }, 500);
        
      } catch (error: any) {
        console.error('Failed to start camera:', error);
        setCameraLoading(false);
        const errorMsg = error.name === 'NotAllowedError' 
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Failed to start camera. Please check your camera permissions.';
        setScanResult({
          type: 'error',
          message: errorMsg
        });
        onError?.(errorMsg);
      }
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsScanning(false);
      setCameraLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setScanResult({
        type: 'error',
        message: 'Please select a valid image file (PNG, JPG, etc.)'
      });
      return;
    }

    let imageUrl: string | null = null;
    try {
      setCameraLoading(true);
      setScanResult(null);
      
      // Create object URL for the image
      imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);
      
      // Scan QR code from the uploaded image
      const result = await QrScanner.scanImage(file);
      
      // Process the scanned result
      try {
        let data;
        try {
          data = JSON.parse(result);
        } catch {
          // If not JSON, treat as plain text
          data = { type: 'attendance', eventId: result };
        }
        
        if (data.type === 'attendance' && data.eventId) {
          setScanResult({
            type: 'success',
            message: `Scanned attendance for Event ID: ${data.eventId}`
          });
          onScan(data);
        } else {
          throw new Error('Invalid QR code format');
        }
      } catch (error) {
        console.error('QR code validation error:', error);
        console.log('Raw QR data:', result);
        const errorMsg = `Invalid QR code format. Expected attendance QR with eventId, got: ${result.substring(0, 50)}...`;
        setScanResult({
          type: 'error',
          message: errorMsg
        });
        onError?.(errorMsg);
      }
      
    } catch (error) {
      console.error('Failed to scan image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setScanResult({
        type: 'error',
        message: `Scan failed: ${errorMessage}. Make sure the image contains a clear QR code.`
      });
      onError?.(`Failed to scan QR code from image: ${errorMessage}`);
    } finally {
      setCameraLoading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Clear uploaded image after a delay
      setTimeout(() => {
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
          setUploadedImage(null);
        }
      }, 3000);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (!hasCamera) {
    return (
      <div className={`bg-gray-100 p-6 rounded-lg text-center ${className}`}>
        <CameraOff className="mx-auto mb-4 text-gray-400" size={48} />
        <p className="text-gray-600">No camera available</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          QR Code Scanner
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Scan student QR codes to mark attendance
        </p>
        
        {/* Scan Mode Toggle */}
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => setScanMode('camera')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'camera'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Camera className="inline w-4 h-4 mr-1" />
            Camera
          </button>
          <button
            onClick={() => setScanMode('upload')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              scanMode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Upload className="inline w-4 h-4 mr-1" />
            Upload Image
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Camera Mode */}
        {scanMode === 'camera' && (
          <>
            <video
              ref={videoRef}
              className="w-full h-64 object-cover bg-black"
              style={{ display: (isScanning || cameraLoading) ? 'block' : 'none' }}
              playsInline
              muted
              autoPlay
            />
            
            {/* Loading overlay when camera is starting */}
            {cameraLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Starting camera...</p>
                </div>
              </div>
            )}
            
            {!isScanning && !cameraLoading && (
              <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600 mb-4">Camera preview will appear here</p>
                  <p className="text-sm text-gray-500">Click "Start Scanning" to begin</p>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Upload Mode */}
        {scanMode === 'upload' && (
          <>
            {uploadedImage ? (
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded QR Code"
                  className="w-full h-64 object-contain bg-gray-100"
                />
                {cameraLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm">Scanning image...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Image className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600 mb-4">Upload an image with QR code</p>
                  <p className="text-sm text-gray-500">Supports PNG, JPG, and other image formats</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Scan Result Overlay */}
        {scanResult && (
          <div className="absolute top-4 left-4 right-4">
            <div className={`p-3 rounded-lg flex items-center space-x-2 ${
              scanResult.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {scanResult.type === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <XCircle size={20} />
              )}
              <span className="text-sm font-medium">{scanResult.message}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <div className="flex justify-center space-x-4">
          {scanMode === 'camera' ? (
            // Camera mode buttons
            !isScanning && !cameraLoading ? (
              <button
                onClick={startScanning}
                disabled={!hasCamera}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
              >
                <Camera size={20} />
                <span>Start Scanning</span>
              </button>
            ) : cameraLoading ? (
              <button
                disabled
                className="bg-gray-400 cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center space-x-2"
              >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Starting Camera...</span>
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
              >
                <CameraOff size={20} />
                <span>Stop Scanning</span>
              </button>
            )
          ) : (
            // Upload mode button
            <button
              onClick={triggerFileUpload}
              disabled={cameraLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              {cameraLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span>Choose Image</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;
