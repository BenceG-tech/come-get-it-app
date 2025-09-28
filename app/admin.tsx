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
  Image,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { Edit3, Save, X, Plus, Trash2, Coffee, Clock } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { Venue, VenueDrink, FreeDrinkWindow, VenueWithDetails, OpeningHours, DayHours } from '@/types/venue';
import Colors from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AdminMode = 'tags' | 'drinks' | 'hours';

type EditingDrink = {
  id: string;
  drinkName: string;
  imageUrl: string;
  isFreeDrink: boolean;
  timeSlots: EditingTimeSlot[];
};

type EditingTimeSlot = {
  id: string;
  dayOfWeek: number;
  start: string;
  end: string;
};

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AdminMode>('tags');
  
  // Tags editing
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [editTags, setEditTags] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Drinks editing
  const [editingVenueWithDrinks, setEditingVenueWithDrinks] = useState<VenueWithDetails | null>(null);
  const [editingDrinks, setEditingDrinks] = useState<EditingDrink[]>([]);
  const [showDrinksModal, setShowDrinksModal] = useState(false);
  const [savingDrinks, setSavingDrinks] = useState(false);
  
  // Hours editing
  const [editingVenueHours, setEditingVenueHours] = useState<Venue | null>(null);
  const [editingHours, setEditingHours] = useState<OpeningHours | null>(null);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  const venuesQuery = trpc.venues.getAll.useQuery();
  const updateTagsMutation = trpc.venues.updateTags.useMutation();
  const updateDrinksMutation = trpc.venues.updateDrinks.useMutation();
  const updateHoursMutation = trpc.venues.updateHours.useMutation();

  useEffect(() => {
    if (venuesQuery.data) {
      setVenues(venuesQuery.data.venues);
      setLoading(false);
    }
  }, [venuesQuery.data]);

  const handleEditTags = (venue: Venue) => {
    if (!venue?.name?.trim()) return;
    setEditingVenue(venue);
    setEditTags(venue.tags?.join(', ') || '');
    setShowEditModal(true);
  };

  const handleEditDrinks = async (venue: Venue) => {
    if (!venue?.name?.trim()) return;
    try {
      setSaving(true);
      // Use trpcClient for direct query call
      const { trpcClient } = await import('@/lib/trpc');
      const result = await trpcClient.venues.getWithDrinks.query({ venueId: venue.id });
      const venueWithDrinks = result.venue;
      
      setEditingVenueWithDrinks(venueWithDrinks);
      
      // Convert to editing format
      const drinks: EditingDrink[] = (venueWithDrinks.drinks || []).map((drink: VenueDrink) => {
        const timeSlots: EditingTimeSlot[] = (venueWithDrinks.freeDrinkWindows || [])
          .filter((window: FreeDrinkWindow) => window.drinkId === drink.id)
          .map((window: FreeDrinkWindow) => ({
            id: window.id,
            dayOfWeek: window.dayOfWeek,
            start: window.start,
            end: window.end,
          }));
        
        return {
          id: drink.id,
          drinkName: drink.drinkName,
          imageUrl: drink.imageUrl || '',
          isFreeDrink: drink.isFreeDrink || false,
          timeSlots,
        };
      });
      
      setEditingDrinks(drinks);
      setShowDrinksModal(true);
    } catch (error) {
      console.error('Failed to load venue drinks:', error);
      Alert.alert('Error', 'Failed to load venue drinks');
    } finally {
      setSaving(false);
    }
  };

  const handleEditHours = (venue: Venue) => {
    if (!venue?.name?.trim()) return;
    setEditingVenueHours(venue);
    setEditingHours(venue.opening_hours || {
      monday: null,
      tuesday: null,
      wednesday: null,
      thursday: null,
      friday: null,
      saturday: null,
      sunday: null,
    });
    setShowHoursModal(true);
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

  const closeDrinksModal = () => {
    setShowDrinksModal(false);
    setEditingVenueWithDrinks(null);
    setEditingDrinks([]);
  };

  const closeHoursModal = () => {
    setShowHoursModal(false);
    setEditingVenueHours(null);
    setEditingHours(null);
  };

  const addNewDrink = () => {
    const newDrink: EditingDrink = {
      id: `drink-${Date.now()}`,
      drinkName: '',
      imageUrl: '',
      isFreeDrink: true,
      timeSlots: [],
    };
    setEditingDrinks([...editingDrinks, newDrink]);
  };

  const removeDrink = (drinkId: string) => {
    setEditingDrinks(editingDrinks.filter(d => d.id !== drinkId));
  };

  const updateDrink = (drinkId: string, updates: Partial<EditingDrink>) => {
    setEditingDrinks(editingDrinks.map(d => 
      d.id === drinkId ? { ...d, ...updates } : d
    ));
  };

  const addTimeSlot = (drinkId: string) => {
    const newSlot: EditingTimeSlot = {
      id: `window-${Date.now()}`,
      dayOfWeek: 0,
      start: '09:00',
      end: '17:00',
    };
    
    setEditingDrinks(editingDrinks.map(d => 
      d.id === drinkId 
        ? { ...d, timeSlots: [...d.timeSlots, newSlot] }
        : d
    ));
  };

  const removeTimeSlot = (drinkId: string, slotId: string) => {
    setEditingDrinks(editingDrinks.map(d => 
      d.id === drinkId 
        ? { ...d, timeSlots: d.timeSlots.filter(s => s.id !== slotId) }
        : d
    ));
  };

  const updateTimeSlot = (drinkId: string, slotId: string, updates: Partial<EditingTimeSlot>) => {
    setEditingDrinks(editingDrinks.map(d => 
      d.id === drinkId 
        ? { 
            ...d, 
            timeSlots: d.timeSlots.map(s => 
              s.id === slotId ? { ...s, ...updates } : s
            )
          }
        : d
    ));
  };

  const handleSaveDrinks = async () => {
    if (!editingVenueWithDrinks) return;

    setSavingDrinks(true);
    try {
      // Convert back to API format
      const drinks: VenueDrink[] = editingDrinks.map(d => ({
        id: d.id,
        venueId: editingVenueWithDrinks.id,
        drinkName: d.drinkName,
        imageUrl: d.imageUrl || null,
        isFreeDrink: d.isFreeDrink,
        isCover: null,
      }));

      const freeDrinkWindows: FreeDrinkWindow[] = editingDrinks.flatMap(d => 
        d.timeSlots.map(slot => ({
          id: slot.id,
          venueId: editingVenueWithDrinks.id,
          drinkId: d.id,
          dayOfWeek: slot.dayOfWeek,
          start: slot.start,
          end: slot.end,
        }))
      );

      await updateDrinksMutation.mutateAsync({
        venueId: editingVenueWithDrinks.id,
        drinks,
        freeDrinkWindows,
      });

      closeDrinksModal();
      Alert.alert('Success', 'Free drinks updated successfully');
    } catch (error) {
      console.error('Failed to update drinks:', error);
      Alert.alert('Error', 'Failed to update drinks');
    } finally {
      setSavingDrinks(false);
    }
  };

  const handleSaveHours = async () => {
    if (!editingVenueHours || !editingHours) return;

    setSavingHours(true);
    try {
      await updateHoursMutation.mutateAsync({
        venueId: editingVenueHours.id,
        openingHours: editingHours,
      });

      // Update local state
      setVenues(prev => prev.map(v => 
        v.id === editingVenueHours.id 
          ? { ...v, opening_hours: editingHours }
          : v
      ));

      closeHoursModal();
      Alert.alert('Success', 'Opening hours updated successfully');
    } catch (error) {
      console.error('Failed to update hours:', error);
      Alert.alert('Error', 'Failed to update opening hours');
    } finally {
      setSavingHours(false);
    }
  };

  const updateDayHours = (day: keyof OpeningHours, hours: DayHours | null) => {
    if (!editingHours) return;
    setEditingHours({
      ...editingHours,
      [day]: hours,
    });
  };

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayKeys: (keyof OpeningHours)[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: 'Admin - Venue Management' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Loading venues...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: 'Admin - Venue Management' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Venue Management</Text>
          <Text style={styles.subtitle}>
            Manage venue tags and free drinks. Changes will appear in the app immediately.
          </Text>
          
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'tags' && styles.modeButtonActive]}
              onPress={() => setMode('tags')}
            >
              <Text style={[styles.modeButtonText, mode === 'tags' && styles.modeButtonTextActive]}>Tags</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'drinks' && styles.modeButtonActive]}
              onPress={() => setMode('drinks')}
            >
              <Coffee size={16} color={mode === 'drinks' ? Colors.dark.background : Colors.dark.text} />
              <Text style={[styles.modeButtonText, mode === 'drinks' && styles.modeButtonTextActive]}>Free Drinks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'hours' && styles.modeButtonActive]}
              onPress={() => setMode('hours')}
            >
              <Clock size={16} color={mode === 'hours' ? Colors.dark.background : Colors.dark.text} />
              <Text style={[styles.modeButtonText, mode === 'hours' && styles.modeButtonTextActive]}>Hours</Text>
            </TouchableOpacity>
          </View>
        </View>

        {venues.map((venue) => (
          <View key={venue.id} style={styles.venueCard}>
            <View style={styles.venueHeader}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  if (mode === 'tags') handleEditTags(venue);
                  else if (mode === 'drinks') handleEditDrinks(venue);
                  else if (mode === 'hours') handleEditHours(venue);
                }}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.dark.primary} />
                ) : (
                  <Edit3 size={16} color={Colors.dark.primary} />
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.venueAddress}>{venue.address}</Text>
            
            {mode === 'tags' ? (
              <View style={styles.tagsContainer}>
                <Text style={styles.tagsLabel}>Current Tags:</Text>
                {venue.tags && venue.tags.length > 0 ? (
                  <View style={styles.tagsList}>
                    {venue.tags.map((tag, index) => (
                      <View key={`${venue.id}-tag-${index}`} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noTagsText}>No tags set</Text>
                )}
              </View>
            ) : mode === 'drinks' ? (
              <View style={styles.drinksContainer}>
                <Text style={styles.tagsLabel}>Free Drinks:</Text>
                <Text style={styles.drinksHint}>Click edit to manage free drinks and time slots</Text>
              </View>
            ) : (
              <View style={styles.hoursContainer}>
                <Text style={styles.tagsLabel}>Opening Hours:</Text>
                {venue.opening_hours ? (
                  <View style={styles.hoursPreview}>
                    {dayKeys.map((dayKey, index) => {
                      const dayHours = venue.opening_hours?.[dayKey];
                      if (!dayHours) return null;
                      return (
                        <Text key={dayKey} style={styles.hoursPreviewText}>
                          {dayNames[index]}: {dayHours.closed ? 'Zárva' : `${dayHours.open} - ${dayHours.close}`}
                        </Text>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.drinksHint}>Click edit to set opening hours</Text>
                )}
              </View>
            )}
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
                      <View key={`preview-${index}`} style={styles.previewTag}>
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

      {/* Edit Drinks Modal */}
      <Modal
        visible={showDrinksModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeDrinksModal}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDrinksModal}>
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Free Drinks</Text>
            <TouchableOpacity
              onPress={handleSaveDrinks}
              disabled={savingDrinks}
              style={[styles.saveButton, savingDrinks && styles.saveButtonDisabled]}
            >
              {savingDrinks ? (
                <ActivityIndicator size="small" color={Colors.dark.primary} />
              ) : (
                <Save size={20} color={Colors.dark.primary} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.editingVenueName}>{editingVenueWithDrinks?.name}</Text>
            
            <TouchableOpacity style={styles.addDrinkButton} onPress={addNewDrink}>
              <Plus size={20} color={Colors.dark.primary} />
              <Text style={styles.addDrinkButtonText}>Add Free Drink</Text>
            </TouchableOpacity>

            {editingDrinks.map((drink, drinkIndex) => (
              <View key={drink.id} style={styles.drinkCard}>
                <View style={styles.drinkHeader}>
                  <Text style={styles.drinkCardTitle}>Drink {drinkIndex + 1}</Text>
                  <TouchableOpacity
                    style={styles.removeDrinkButton}
                    onPress={() => removeDrink(drink.id)}
                  >
                    <Trash2 size={16} color="#FF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.drinkInputContainer}>
                  <Text style={styles.inputLabel}>Drink Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={drink.drinkName}
                    onChangeText={(text) => updateDrink(drink.id, { drinkName: text })}
                    placeholder="e.g. Sör, Kávé, Koktél"
                    placeholderTextColor={Colors.dark.subtext}
                  />
                </View>

                <View style={styles.drinkInputContainer}>
                  <Text style={styles.inputLabel}>Image URL</Text>
                  <TextInput
                    style={styles.textInput}
                    value={drink.imageUrl}
                    onChangeText={(text) => updateDrink(drink.id, { imageUrl: text })}
                    placeholder="https://example.com/drink-image.jpg"
                    placeholderTextColor={Colors.dark.subtext}
                  />
                  {drink.imageUrl ? (
                    <Image 
                      source={{ uri: drink.imageUrl }} 
                      style={styles.drinkImagePreview} 
                      resizeMode="cover"
                    />
                  ) : null}
                </View>

                <View style={styles.switchContainer}>
                  <Text style={styles.inputLabel}>Is Free Drink</Text>
                  <Switch
                    value={drink.isFreeDrink}
                    onValueChange={(value) => updateDrink(drink.id, { isFreeDrink: value })}
                    trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
                    thumbColor={drink.isFreeDrink ? Colors.dark.background : Colors.dark.subtext}
                  />
                </View>

                <View style={styles.timeSlotsContainer}>
                  <View style={styles.timeSlotsHeader}>
                    <Text style={styles.inputLabel}>Available Time Slots</Text>
                    <TouchableOpacity
                      style={styles.addTimeSlotButton}
                      onPress={() => addTimeSlot(drink.id)}
                    >
                      <Plus size={16} color={Colors.dark.primary} />
                      <Text style={styles.addTimeSlotText}>Add Slot</Text>
                    </TouchableOpacity>
                  </View>

                  {drink.timeSlots.map((slot, slotIndex) => (
                    <View key={slot.id} style={styles.timeSlotCard}>
                      <View style={styles.timeSlotHeader}>
                        <Text style={styles.timeSlotTitle}>Slot {slotIndex + 1}</Text>
                        <TouchableOpacity
                          style={styles.removeTimeSlotButton}
                          onPress={() => removeTimeSlot(drink.id, slot.id)}
                        >
                          <X size={16} color="#FF4444" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.timeSlotInputs}>
                        <View style={styles.dayPickerContainer}>
                          <Text style={styles.timeSlotLabel}>Day</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.dayPicker}>
                              {dayNames.map((dayName, dayIndex) => (
                                <TouchableOpacity
                                  key={dayIndex}
                                  style={[
                                    styles.dayButton,
                                    slot.dayOfWeek === dayIndex && styles.dayButtonActive
                                  ]}
                                  onPress={() => updateTimeSlot(drink.id, slot.id, { dayOfWeek: dayIndex })}
                                >
                                  <Text style={[
                                    styles.dayButtonText,
                                    slot.dayOfWeek === dayIndex && styles.dayButtonTextActive
                                  ]}>
                                    {dayName.slice(0, 3)}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </ScrollView>
                        </View>

                        <View style={styles.timeInputsRow}>
                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeSlotLabel}>Start</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={slot.start}
                              onChangeText={(text) => updateTimeSlot(drink.id, slot.id, { start: text })}
                              placeholder="09:00"
                              placeholderTextColor={Colors.dark.subtext}
                            />
                          </View>
                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeSlotLabel}>End</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={slot.end}
                              onChangeText={(text) => updateTimeSlot(drink.id, slot.id, { end: text })}
                              placeholder="17:00"
                              placeholderTextColor={Colors.dark.subtext}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Hours Modal */}
      <Modal
        visible={showHoursModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeHoursModal}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeHoursModal}>
              <X size={24} color={Colors.dark.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Opening Hours</Text>
            <TouchableOpacity
              onPress={handleSaveHours}
              disabled={savingHours}
              style={[styles.saveButton, savingHours && styles.saveButtonDisabled]}
            >
              {savingHours ? (
                <ActivityIndicator size="small" color={Colors.dark.primary} />
              ) : (
                <Save size={20} color={Colors.dark.primary} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.editingVenueName}>{editingVenueHours?.name}</Text>
            
            <Text style={styles.hoursInstructions}>
              Set the opening hours for each day. Leave a day empty if the venue is closed that day.
            </Text>

            {dayKeys.map((dayKey, index) => {
              const dayHours = editingHours?.[dayKey];
              return (
                <View key={dayKey} style={styles.dayHoursCard}>
                  <View style={styles.dayHoursHeader}>
                    <Text style={styles.dayName}>{dayNames[index]}</Text>
                    <Switch
                      value={dayHours !== null && !dayHours?.closed}
                      onValueChange={(isOpen) => {
                        if (isOpen) {
                          updateDayHours(dayKey, { open: '09:00', close: '23:00', closed: false });
                        } else {
                          updateDayHours(dayKey, null);
                        }
                      }}
                      trackColor={{ false: Colors.dark.border, true: Colors.dark.primary }}
                      thumbColor={dayHours !== null && !dayHours?.closed ? Colors.dark.background : Colors.dark.subtext}
                    />
                  </View>
                  
                  {dayHours !== null && !dayHours?.closed && (
                    <View style={styles.timeInputsRow}>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeSlotLabel}>Open</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={dayHours?.open || ''}
                          onChangeText={(text) => updateDayHours(dayKey, { open: text, close: dayHours?.close || '23:00', closed: false })}
                          placeholder="09:00"
                          placeholderTextColor={Colors.dark.subtext}
                        />
                      </View>
                      <View style={styles.timeInputContainer}>
                        <Text style={styles.timeSlotLabel}>Close</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={dayHours?.close || ''}
                          onChangeText={(text) => updateDayHours(dayKey, { open: dayHours?.open || '09:00', close: text, closed: false })}
                          placeholder="23:00"
                          placeholderTextColor={Colors.dark.subtext}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
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
  modeSelector: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: Colors.dark.primary,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  modeButtonTextActive: {
    color: Colors.dark.background,
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
  drinksContainer: {
    marginTop: 8,
  },
  drinksHint: {
    fontSize: 12,
    color: Colors.dark.subtext,
    fontStyle: 'italic',
    marginTop: 4,
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
  addDrinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 8,
  },
  addDrinkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.primary,
  },
  drinkCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  drinkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  drinkCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  removeDrinkButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dark.background,
  },
  drinkInputContainer: {
    marginBottom: 16,
  },
  drinkImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeSlotsContainer: {
    marginTop: 8,
  },
  timeSlotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addTimeSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.dark.background,
    borderRadius: 6,
  },
  addTimeSlotText: {
    fontSize: 14,
    color: Colors.dark.primary,
    fontWeight: '500',
  },
  timeSlotCard: {
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSlotTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  removeTimeSlotButton: {
    padding: 4,
  },
  timeSlotInputs: {
    gap: 12,
  },
  dayPickerContainer: {
    marginBottom: 8,
  },
  timeSlotLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 6,
  },
  dayPicker: {
    flexDirection: 'row',
    gap: 6,
  },
  dayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  dayButtonText: {
    fontSize: 12,
    color: Colors.dark.text,
    fontWeight: '500',
  },
  dayButtonTextActive: {
    color: Colors.dark.background,
  },
  timeInputsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: Colors.dark.text,
    textAlign: 'center',
  },
  hoursContainer: {
    marginTop: 8,
  },
  hoursPreview: {
    gap: 4,
  },
  hoursPreviewText: {
    fontSize: 12,
    color: Colors.dark.text,
  },
  hoursInstructions: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 20,
    marginBottom: 20,
  },
  dayHoursCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  dayHoursHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
});