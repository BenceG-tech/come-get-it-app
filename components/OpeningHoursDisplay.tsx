import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { 
  BusinessHours, 
  convertOpeningHoursToBusinessHours, 
  isVenueOpenNow, 
  getClosingTimeToday, 
  groupConsecutiveHours 
} from '@/utils/openingHours';
import { OpeningHours } from '@/types/venue';

type OpeningHoursDisplayProps = {
  businessHours?: BusinessHours | null;
  openingHours?: OpeningHours | null; // Legacy support
  showStatus?: boolean;
  compact?: boolean;
  style?: object;
};

export default function OpeningHoursDisplay({ 
  businessHours, 
  openingHours, 
  showStatus = false, 
  compact = false,
  style 
}: OpeningHoursDisplayProps) {
  const now = new Date();
  
  // Convert openingHours to businessHours if needed
  const hoursForStatus = businessHours ?? convertOpeningHoursToBusinessHours(openingHours ?? null);
  const venueLike = hoursForStatus ? { business_hours: hoursForStatus } : null;
  
  const isOpen = venueLike ? isVenueOpenNow(venueLike, now) : null;
  const closingTime = venueLike ? getClosingTimeToday(venueLike, now) : null;

  if (showStatus) {
    if (isOpen === null) {
      // No hours available
      if (compact) {
        return (
          <View style={[styles.compactContainer, style]}>
            <Clock size={12} color={Colors.textSecondary} />
            <Text style={[styles.compactText, styles.neutralText]}>
              Órák nem elérhetőek
            </Text>
          </View>
        );
      } else {
        return (
          <View style={[styles.statusContainer, styles.neutralStatus]}>
            <Clock size={16} color={Colors.textSecondary} />
            <Text style={[styles.statusText, styles.neutralStatusText]}>
              Nyitvatartás nem elérhető
            </Text>
          </View>
        );
      }
    }

    if (compact) {
      return (
        <View style={[styles.compactContainer, style]}>
          <Clock size={12} color={isOpen ? Colors.success : Colors.error} />
          <Text style={[
            styles.compactText,
            isOpen ? styles.openText : styles.closedText
          ]}>
            {isOpen ? `Nyitva - zár ${closingTime}` : 'Zárva'}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.statusContainer, isOpen ? styles.openStatus : styles.closedStatus]}>
          <Clock size={16} color={isOpen ? Colors.success : Colors.error} />
          <Text style={[
            styles.statusText,
            isOpen ? styles.openStatusText : styles.closedStatusText
          ]}>
            {isOpen ? `Nyitva - zár ${closingTime}` : 'Zárva'}
          </Text>
        </View>
      );
    }
  }

  // Full hours display
  if (!hoursForStatus) {
    return (
      <View style={styles.hoursContainer}>
        <Text style={styles.noHoursText}>Nincs megadott nyitvatartás</Text>
      </View>
    );
  }

  const groupedHours = groupConsecutiveHours(hoursForStatus);

  return (
    <View style={styles.hoursContainer}>
      {groupedHours.map((group) => (
        <View key={`${group.days}-${group.hours}`} style={styles.hoursRow}>
          <Text style={styles.daysText}>{group.days}</Text>
          <Text style={[
            styles.hoursText,
            group.hours === 'Zárva' ? styles.closedHoursText : styles.openHoursText
          ]}>
            {group.hours}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '500',
  },
  openText: {
    color: Colors.success,
  },
  closedText: {
    color: Colors.error,
  },
  neutralText: {
    color: Colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  openStatus: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  closedStatus: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  neutralStatus: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(156, 163, 175, 0.3)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openStatusText: {
    color: Colors.success,
  },
  closedStatusText: {
    color: Colors.error,
  },
  neutralStatusText: {
    color: Colors.textSecondary,
  },
  hoursContainer: {
    gap: 4,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  daysText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '400',
  },
  openHoursText: {
    color: Colors.text,
  },
  closedHoursText: {
    color: Colors.textSecondary,
  },
  noHoursText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
});