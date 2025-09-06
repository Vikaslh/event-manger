import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../AppNavigator';
import { eventAPI, registrationAPI, attendanceAPI, feedbackAPI } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';

export type EventsScreenProps = NativeStackScreenProps<RootStackParamList, 'Events'>;

interface EventItem {
  id: number;
  title: string;
  description?: string;
  date: string;
  location?: string;
  type?: string;
  average_rating?: number;
}

const EventsScreen: React.FC<EventsScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Array<{ id: number; event_id: number; student_id?: number; created_at?: string }>>([]);
  const [attendance, setAttendance] = useState<Array<{ id: number; registration_id: number; event_id: number; student_id?: number; check_in_time?: string }>>([]);
  const [feedback, setFeedback] = useState<Array<{ id: number; registration_id: number; event_id: number; rating: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [eventsData, regs, atts, fbs] = await Promise.all([
        eventAPI.list(),
        registrationAPI.mine(),
        attendanceAPI.myAttendance(),
        feedbackAPI.mine(),
      ]);
      setEvents(eventsData);
      setRegistrations(regs);
      setAttendance(atts);
      setFeedback(fbs);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const register = async (eventId: number) => {
    setActionLoading(eventId);
    try {
      const reg = await registrationAPI.create(eventId);
      setRegistrations((prev) => [...prev, reg]);
      Alert.alert('Registered', 'You have registered for this event.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to register');
    } finally {
      setActionLoading(null);
    }
  };

  const markAttendanceToday = async (eventId: number) => {
    // Find registration for this event
    const reg = registrations.find(r => r.event_id === eventId);
    if (!reg) {
      return Alert.alert('Not registered', 'Please register first.');
    }
    setActionLoading(eventId);
    try {
      // Check existing attendance
      const hasAttended = attendance.some(a => a.event_id === eventId);
      if (hasAttended) {
        setActionLoading(null);
        return Alert.alert('Already marked', 'Attendance already marked for this event.');
      }
      const att = await attendanceAPI.create(reg.id, eventId);
      setAttendance(prev => [...prev, att]);
      Alert.alert('Success', 'Attendance marked successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to mark attendance');
    } finally {
      setActionLoading(null);
    }
  };

  const isEventToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const statusByEvent = useMemo(() => {
    const map: Record<number, { registered: boolean; attended: boolean; feedback: boolean }> = {};
    for (const ev of events) {
      const registered = registrations.some(r => r.event_id === ev.id);
      const attended = attendance.some(a => a.event_id === ev.id);
      const evRegIds = registrations.filter(r => r.event_id === ev.id).map(r => r.id);
      const fb = feedback.some(f => evRegIds.includes(f.registration_id));
      map[ev.id] = { registered, attended, feedback: fb };
    }
    return map;
  }, [events, registrations, attendance, feedback]);

  const isPast = (dateStr: string) => new Date(dateStr).getTime() < new Date().getTime();
  const upcomingEvents = useMemo(() => events.filter(e => !isPast(e.date)), [events]);
  const pastEvents = useMemo(() => events.filter(e => isPast(e.date)), [events]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Button title="My Registrations" onPress={() => navigation.navigate('MyRegistrations')} />
        <Button title="Scan" onPress={() => navigation.navigate('Scan')} />
        <Button title="Logout" onPress={logout} />
      </View>

      {/* Upcoming Events */}
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      <FlatList
        data={upcomingEvents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{new Date(item.date).toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {item.type ? (
                <View style={[styles.badge, { backgroundColor: '#e5e7eb' }]}><Text style={styles.badgeText}>{item.type}</Text></View>
              ) : null}
              {typeof item.average_rating === 'number' ? (
                <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={styles.badgeText}>Rating: {item.average_rating.toFixed(1)}</Text>
                </View>
              ) : null}
            </View>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            {item.location ? <Text style={styles.meta}>Location: {item.location}</Text> : null}
            {/* Status badges */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {statusByEvent[item.id]?.registered ? (
                <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}><Text style={styles.badgeText}>Registered</Text></View>
              ) : (
                <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}><Text style={styles.badgeText}>Not Registered</Text></View>
              )}
              {statusByEvent[item.id]?.attended ? (
                <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}><Text style={styles.badgeText}>Attended</Text></View>
              ) : null}
            </View>

            {/* Actions */}
            {!statusByEvent[item.id]?.registered ? (
              <Button title={actionLoading === item.id ? 'Registering...' : 'Register'} onPress={() => register(item.id)} disabled={actionLoading === item.id} />
            ) : (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {isEventToday(item.date) && !statusByEvent[item.id]?.attended ? (
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Button
                      title={actionLoading === item.id ? 'Marking…' : 'Mark Attendance'}
                      onPress={() => markAttendanceToday(item.id)}
                      disabled={actionLoading === item.id}
                    />
                  </View>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Button
                    title={statusByEvent[item.id]?.feedback ? 'View Rating' : 'Rate Event'}
                    onPress={() => navigation.navigate('MyRegistrations')}
                  />
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No events available.</Text>}
      />

      {/* Past Events */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Past Events</Text>
      <FlatList
        data={pastEvents}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={[styles.card, { opacity: 0.95 }]}> 
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{new Date(item.date).toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {item.type ? (
                <View style={[styles.badge, { backgroundColor: '#e5e7eb' }]}><Text style={styles.badgeText}>{item.type}</Text></View>
              ) : null}
              {typeof item.average_rating === 'number' ? (
                <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={styles.badgeText}>Rating: {item.average_rating.toFixed(1)}</Text>
                </View>
              ) : null}
              <View style={[styles.badge, { backgroundColor: '#e5e7eb' }]}><Text style={styles.badgeText}>Past Event</Text></View>
            </View>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            {item.location ? <Text style={styles.meta}>Location: {item.location}</Text> : null}
            {/* Status badges */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {statusByEvent[item.id]?.attended ? (
                <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}><Text style={styles.badgeText}>Attended</Text></View>
              ) : (
                <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}><Text style={styles.badgeText}>Missed</Text></View>
              )}
            </View>
            {/* Rating shortcut */}
            {statusByEvent[item.id]?.attended ? (
              <Button
                title={statusByEvent[item.id]?.feedback ? 'View Rating' : 'Rate Event'}
                onPress={() => navigation.navigate('MyRegistrations')}
              />
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text>No past events.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#666', marginBottom: 8 },
  desc: { color: '#333', marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 8 },
  badgeText: { fontSize: 12, color: '#111827' },
  meta: { color: '#374151', marginBottom: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginVertical: 8, color: '#111827' },
});

export default EventsScreen;
