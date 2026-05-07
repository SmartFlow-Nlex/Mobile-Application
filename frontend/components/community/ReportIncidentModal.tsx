import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ReportIncidentPayload, TrafficStatus } from '@smartflow/shared';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';

export interface ReportIncidentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: ReportIncidentPayload) => void;
}

const INCIDENT_STATUSES: TrafficStatus[] = ['moderate', 'heavy', 'incident'];

const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<TrafficStatus>('incident');

  const handleSubmit = (): void => {
    onSubmit({
      location,
      description,
      status,
      reportedBy: 'Community User',
    });
    setLocation('');
    setDescription('');
    setStatus('incident');
    onClose();
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={styles.scrim} />
        <View style={styles.sheet}>
          <Text style={styles.title}>Report Incident</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              onChangeText={setLocation}
              placeholder="Enter incident location"
              placeholderTextColor={Colors.textTertiary}
              style={styles.input}
              value={location}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              multiline
              onChangeText={setDescription}
              placeholder="Describe what happened"
              placeholderTextColor={Colors.textTertiary}
              style={styles.textArea}
              textAlignVertical="top"
              value={description}
            />

            <Text style={styles.label}>Severity</Text>
            <View style={styles.statusRow}>
              {INCIDENT_STATUSES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setStatus(item)}
                  style={[styles.statusChip, status === item && styles.statusChipActive]}
                >
                  <Text
                    style={[styles.statusChipText, status === item && styles.statusChipTextActive]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handleSubmit} style={styles.submitButton}>
              <Text style={styles.submitText}>Submit Report</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ReportIncidentModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '82%',
  },
  title: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 18,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statusChip: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipActive: {
    backgroundColor: Colors.dangerRed,
  },
  statusChipText: {
    color: '#6B7280',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  statusChipTextActive: {
    color: Colors.textInverse,
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerRed,
  },
  submitText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});
