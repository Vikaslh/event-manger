import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../AppNavigator';
import { attendanceAPI } from '../../lib/apiClient';

export type ScanScreenProps = NativeStackScreenProps<RootStackParamList, 'Scan'>;

const ScanScreen: React.FC<ScanScreenProps> = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const onScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      // Expect JSON like { type: 'attendance', eventId: number }
      let payload: any;
      try {
        payload = JSON.parse(data);
      } catch {
        // Fallback for plain text number
        payload = { type: 'attendance', eventId: Number(data) };
      }

      if (payload?.type !== 'attendance' || !payload?.eventId) {
        throw new Error('Invalid QR code format. Expected { type: "attendance", eventId }');
      }

      const res = await attendanceAPI.markStudent(Number(payload.eventId));
      if (res?.success) {
        Alert.alert('Success', res.message || 'Attendance marked successfully');
      } else {
        Alert.alert('Notice', res?.message || 'Attendance may have been already marked');
      }
    } catch (e: any) {
      Alert.alert('Scan failed', e?.response?.data?.detail || e?.message || 'Unable to process QR');
    } finally {
      // Allow scanning again after dialog
      setTimeout(() => setScanned(false), 1200);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <Text style={{ marginTop: 8 }}>Please grant camera permissions in settings.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : onScan}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <View style={styles.overlay}> 
          <Text style={styles.overlayText}>Processing…</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayText: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});

export default ScanScreen;
