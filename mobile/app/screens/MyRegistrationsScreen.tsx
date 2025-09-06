import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../AppNavigator';
import { registrationAPI, feedbackAPI } from '../../lib/apiClient';

export type MyRegistrationsProps = NativeStackScreenProps<RootStackParamList, 'MyRegistrations'>;

interface RegistrationItem {
  id: number;
  event_id: number;
  created_at?: string;
}

const MyRegistrationsScreen: React.FC<MyRegistrationsProps> = () => {
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingMap, setSubmittingMap] = useState<Record<number, boolean>>({});
  const [ratingDraft, setRatingDraft] = useState<Record<number, number>>({});
  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({});
  const [myFeedback, setMyFeedback] = useState<Array<{ id: number; registration_id: number; event_id: number; rating: number; comment?: string }>>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [regs, feedback] = await Promise.all([
          registrationAPI.mine(),
          feedbackAPI.mine(),
        ]);
        setItems(regs);
        setMyFeedback(feedback);
      } catch (e: any) {
        Alert.alert('Error', e?.response?.data?.detail || 'Failed to load registrations');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const feedbackByRegistration = useMemo(() => {
    const map: Record<number, { id: number; registration_id: number; rating: number; comment?: string }> = {};
    for (const f of myFeedback) {
      map[f.registration_id] = f;
    }
    return map;
  }, [myFeedback]);

  const setStar = (regId: number, value: number) => {
    setRatingDraft((prev) => ({ ...prev, [regId]: value }));
  };

  const submitFeedback = async (reg: RegistrationItem) => {
    const regId = reg.id;
    const rating = ratingDraft[regId] || 5;
    const comment = commentDraft[regId];
    try {
      setSubmittingMap((p) => ({ ...p, [regId]: true }));
      const created = await feedbackAPI.create(regId, reg.event_id, rating, comment);
      setMyFeedback((prev) => [...prev, created]);
      Alert.alert('Thanks!', 'Your rating has been submitted.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setSubmittingMap((p) => ({ ...p, [regId]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>Registration #{item.id}</Text>
            <Text style={styles.subtitle}>Event ID: {item.event_id}</Text>
            {item.created_at ? <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text> : null}

            {/* Rating section */}
            {feedbackByRegistration[item.id] ? (
              <View style={styles.ratedBox}>
                <Text style={styles.ratedText}>You rated: {feedbackByRegistration[item.id].rating} / 5</Text>
                {feedbackByRegistration[item.id].comment ? (
                  <Text style={styles.meta}>Comment: {feedbackByRegistration[item.id].comment}</Text>
                ) : null}
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionLabel}>Rate this event</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setStar(item.id, s)} style={{ padding: 4 }}>
                      <Text style={[styles.star, (ratingDraft[item.id] || 5) >= s ? styles.starActive : styles.starInactive]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  placeholder="Optional comment"
                  value={commentDraft[item.id] || ''}
                  onChangeText={(t) => setCommentDraft((p) => ({ ...p, [item.id]: t }))}
                  style={styles.input}
                  multiline
                />
                <TouchableOpacity
                  onPress={() => submitFeedback(item)}
                  disabled={!!submittingMap[item.id]}
                  style={[styles.submitBtn, submittingMap[item.id] ? styles.submitBtnDisabled : undefined]}
                >
                  <Text style={styles.submitLabel}>{submittingMap[item.id] ? 'Submitting...' : 'Submit Rating'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text>No registrations found.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#666', marginBottom: 8 },
  meta: { color: '#333' },
  sectionLabel: { marginTop: 4, marginBottom: 6, fontWeight: '600', color: '#333' },
  starsRow: { flexDirection: 'row', marginBottom: 8 },
  star: { fontSize: 24 },
  starActive: { color: '#f5a524' },
  starInactive: { color: '#d1d5db' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, minHeight: 60, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled: { backgroundColor: '#93c5fd' },
  submitLabel: { color: '#fff', fontWeight: '600' },
  ratedBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', padding: 10, borderRadius: 8, marginTop: 10 },
  ratedText: { color: '#166534', fontWeight: '600' },
});

export default MyRegistrationsScreen;
