import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { Edit3, Save, X, Plus, Trash2 } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { Venue } from '@/types/venue';
import Colors from '@/constants/colors';

export default function AdminScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editTags, setEditTags] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const venuesQuery = trpc.venues.getAll.useQuery();
  const updateTagsMutation = trpc.venues.updateTags.useMutation();

  useEffect(() => {
    if (venuesQuery.data) {
      setVenues(venuesQuery.data.venues);
      setLoading(false);
    }
  }, [venuesQuery.data]);

  const handleEditTags = (venue: Venue) => {
    setEditingVenue(venue);
    setEditTags(venue.tags?.join(', ') || '');
    setShowEditModal(true);
  };

  const handleSaveTags = async () => {
    if (!editingVenue) return;

    setSaving(true);
    try {
      const tagsArray = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await updateTagsMutation.mutateAsync({
        venueId: editingVenue.id,
        tags: tagsArray,
      });

      // Update local state
      setVenues(prev => prev.map(v => 
        v.id === editingVenue.id 
          ? { ...v, tags: tagsArray }
          : v
      ));

      setShowEditModal(false);
      setEditingVenue(null);
      setEditTags('');
      
      Alert.alert('Success', 'Tags updated successfully');
    } catch (error) {
      console.error('Failed to update tags:', error);
      Alert.alert('Error', 'Failed to update tags');
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setShowEditModal(false);
    setEditingVenue(null);
    setEditTags('');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Admin - Venue Tags' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading venues...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Admin - Venue Tags' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Venue Tag Management</Text>
          <Text style={styles.subtitle}>
            Manage tags for all venues. Tags will appear consistently on both main page and detail pages.
          </Text>
        </View>

        {venues.map((venue) => (
          <View key={venue.id} style={styles.venueCard}>
            <View style={styles.venueHeader}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditTags(venue)}
              >
                <Edit3 size={16} color={Colors.dark.primary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.venueAddress}>{venue.address}</Text>
            
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>Current Tags:</Text>
              {venue.tags && venue.tags.length > 0 ? (
                <View style={styles.tagsList}>
                  {venue.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noTagsText}>No tags set</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Edit Tags Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Tags</Text>
            <TouchableOpacity
              onPress={handleSaveTags}
              disabled={saving}
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.dark.primary} />
              ) : (
                <Save size={20} color={Colors.dark.primary} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.editingVenueName}>{editingVenue?.name}</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Tags (separate with commas)
              </Text>
              <TextInput
                style={styles.textInput}
                value={editTags}
                onChangeText={setEditTags}
                placeholder="e.g. kávé, ingyen ital, terasz"
                placeholderTextColor={Colors.dark.subtext}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.inputHint}>
                These tags will appear on both the main page and venue detail page
              </Text>
            </View>

            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview:</Text>
              {editTags.trim() ? (
                <View style={styles.previewTags}>
                  {editTags.split(',').map((tag, index) => {
                    const trimmedTag = tag.trim();
                    if (!trimmedTag) return null;
                    return (
                      <View key={index} style={styles.previewTag}>
                        <Text style={styles.previewTagText}>{trimmedTag}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noPreviewText}>No tags to preview</Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 20,
  },
  venueCard: {
    backgroundColor: Colors.dark.card,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.background,
  },
  venueAddress: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 12,
  },
  tagsContainer: {
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: Colors.dark.background,
    fontWeight: '500',
  },
  noTagsText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  editingVenueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.dark.text,
    minHeight: 80,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.dark.subtext,
    marginTop: 6,
    lineHeight: 16,
  },
  previewContainer: {
    marginTop: 20,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewTag: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewTagText: {
    fontSize: 14,
    color: Colors.dark.background,
    fontWeight: '500',
  },
  noPreviewText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    fontStyle: 'italic',
  },
});