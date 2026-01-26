import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Heart, TrendingUp } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { getUserCSRImpact } from '@/lib/csrService';
import { useAuth } from '@/context/AuthContext';

export default function MyImpactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['csr-impact'],
    queryFn: async () => {
      const result = await getUserCSRImpact();
      if (!result.success) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    enabled: !!session,
    staleTime: 60_000,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (!session) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hatásom</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyTitle}>Jelentkezz be</Text>
          <Text style={styles.emptySubtitle}>Jelentkezz be a hatásod megtekintéséhez</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth')}>
            <Text style={styles.loginButtonText}>Bejelentkezés</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hatásom</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Betöltés...</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hatásom</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Hiba történt</Text>
          <Text style={styles.emptySubtitle}>
            A hatás adatok átmenetileg nem elérhetők. Próbáld újra később!
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Újrapróbálás</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { stats, recent_donations, next_milestone, leaderboard_position } = data;
  const hasImpact = stats.total_impact_units > 0;

  if (!hasImpact) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hatásom</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Kezdd el a hatásod!</Text>
            <Text style={styles.emptySubtitle}>
              Váltsd be az első ingyenes italod, hogy adományozz az első adagot.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/home')}>
              <Text style={styles.primaryButtonText}>Felfedezés</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const progressPercent = next_milestone
    ? Math.min((next_milestone.current_units / next_milestone.target_units) * 100, 100)
    : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hatásom</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <LinearGradient
          colors={['rgba(31, 177, 183, 0.15)', 'rgba(6, 182, 212, 0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroEmoji}>🎉</Text>
          <Text style={styles.heroTitle}>Te egy hős vagy!</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total_impact_units}</Text>
              <Text style={styles.statLabel}>adag adományozva</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValueSecondary}>
                {stats.total_donations_huf.toLocaleString('hu-HU')}
              </Text>
              <Text style={styles.statLabel}>Ft összesen</Text>
            </View>
          </View>

          <View style={styles.badgesRow}>
            {stats.current_streak_days > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>🔥</Text>
                <Text style={styles.badgeText}>{stats.current_streak_days} napos sorozat</Text>
              </View>
            )}
            {leaderboard_position && leaderboard_position.percentile <= 20 && (
              <View style={styles.badge}>
                <Text style={styles.badgeEmoji}>👑</Text>
                <Text style={styles.badgeText}>Top {Math.round(leaderboard_position.percentile)}%</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {next_milestone && (
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <TrendingUp size={20} color={Colors.primary} />
              <Text style={styles.milestoneTitle}>
                Következő mérföldkő: {next_milestone.target_units} adag
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.milestoneSubtext}>
              {next_milestone.remaining_units} még hátravan!
            </Text>
            {next_milestone.description && (
              <Text style={styles.milestoneDescription}>{next_milestone.description}</Text>
            )}
          </View>
        )}

        {recent_donations.length > 0 && (
          <View style={styles.timelineSection}>
            <View style={styles.sectionHeader}>
              <Heart size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Legutóbbi adományok</Text>
            </View>
            
            {recent_donations.slice(0, 10).map((donation, index) => (
              <View key={`${donation.date}-${index}`} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>{formatDate(donation.date)}</Text>
                  <Text style={styles.timelineVenue}>{donation.venue_name}</Text>
                  <Text style={styles.timelineImpact}>
                    {donation.impact_description} adományozva a {donation.charity_name}nek
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  retryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(31, 177, 183, 0.3)',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 40,
    fontWeight: '900',
    color: '#1fb1b7',
    letterSpacing: -1,
  },
  statValueSecondary: {
    fontSize: 28,
    fontWeight: '800',
    color: '#06b6d4',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  milestoneCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1fb1b7',
    borderRadius: 5,
  },
  milestoneSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  milestoneDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  timelineSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingLeft: 4,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1fb1b7',
    marginTop: 6,
    marginRight: 14,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  timelineVenue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  timelineImpact: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
