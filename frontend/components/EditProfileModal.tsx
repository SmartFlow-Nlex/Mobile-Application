import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { UserProfile } from '@smartflow/shared';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';

export interface EditProfileModalProps {
  visible: boolean;
  user: UserProfile;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  user,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] = useState<UserProfile>(user);

  useEffect(() => {
    setDraft(user);
  }, [user]);

  const handlePickImage = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setDraft((current) => ({
        ...current,
        avatarUri: result.assets[0].uri,
      }));
    }
  };

  const initials = draft.displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.scrim} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable onPress={handlePickImage} style={styles.avatarSection}>
              {draft.avatarUri ? (
                <Image source={{ uri: draft.avatarUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials || 'U'}</Text>
                </View>
              )}
              <Text style={styles.changePhotoText}>Change profile photo</Text>
            </Pressable>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Profile Name</Text>
              <TextInput
                onChangeText={(displayName) => setDraft((current) => ({ ...current, displayName }))}
                placeholder="Enter full name"
                placeholderTextColor={Colors.textTertiary}
                style={styles.input}
                value={draft.displayName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                autoCapitalize="none"
                onChangeText={(username) => setDraft((current) => ({ ...current, username }))}
                placeholder="Enter username"
                placeholderTextColor={Colors.textTertiary}
                style={styles.input}
                value={draft.username}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={(email) => setDraft((current) => ({ ...current, email }))}
                placeholder="Enter email"
                placeholderTextColor={Colors.textTertiary}
                style={styles.input}
                value={draft.email}
              />
            </View>

            <Pressable
              onPress={() => onSave(draft)}
              style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginBottom: 12,
  },
  avatarInitials: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  changePhotoText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FBFCFE',
    paddingHorizontal: 14,
    color: Colors.text,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  saveButton: {
    marginTop: 10,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  saveButtonPressed: {
    opacity: 0.9,
  },
  saveButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});
