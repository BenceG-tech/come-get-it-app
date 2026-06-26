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
import { ChevronLeft, Heart, TrendingUp, Flame, Crown, Sprout, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { getUserCSRImpact } from '@/lib/csrService';
import { useAuth } from '@/context/AuthContext';
import { CSRImpactResponse, RecentDonation } from '@/types/csr';

const CYAN = '#00C8E8' as const;

const EMPTY_IMPACT: CSRImpactResponse = {
  stats: {
    total_donations_huf: 0,
    total_impact_units: 0,
    total_redemptions: 0,
    current_streak_days: 0,
    longest_streak_days: 0,
    last_donation_date: null,
    global_rank: null,
    city_rank: null,
  },
  recent_donations: [],
  next_milestone: {
    target_units: 5,
    current_units: 0,
    remaining_units: 5,
    description: 'Válts be ajánlatokat partnerhelyeken, és építsd fel az első közösségi mérföldköved.',
  },
  leaderboard_position: null,
};

export default function MyImpactScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<CSRImpactResponse, Error>({
    queryKey: ['csr-impact'],
    queryFn: async () => {
      const result = await getUserCSRImpact();
      if (!result.success) {
        console.warn('[MyImpact] Showing friendly fallback', { code: result.error.code });
        return EMPTY_IMPACT;
      }
      return result.data;
    },
    enabled: !!session,
    staleTime: 60_000,
    retry: false,
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
            <ChevronLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hatásom</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <Lock size={40} color="rgba(255,255,255,0.22)" />
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
            <ChevronLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hatásom</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={CYAN} />
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
            <ChevronLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hatásom</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyImpactCard}>
            <Sprout size={42} color={CYAN} />
            <Text style={styles.emptyTitle}>A hatásod hamarosan megjelenik</Text>
            <Text style={styles.emptySubtitle}>
              Most nem érjük el az élő adatokat, de az oldal működik. Fedezz fel partnerhelyeket, válts be ajánlatokat, és itt fog épülni a közösségi eredményed.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/home')}>
              <Text style={styles.primaryButtonText}>Partnerhelyek felfedezése</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
            <ChevronLeft size={22} color={Colors.text} />
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
              tintColor={CYAN}
            />
          }
        >
          <LinearGradient
            colors={['rgba(0, 200, 232, 0.14)', 'rgba(29, 109, 255, 0.06)', 'rgba(255,255,255,0.035)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyImpactCard}
          >
            <Sprout size={42} color={CYAN} />
            <Text style={styles.emptyTitle}>Kezdd el a hatásod</Text>
            <Text style={styles.emptySubtitle}>
              Az első beváltásod után itt látszik majd, mennyi közösségi támogatást indítottál el a Come Get It-en keresztül.
            </Text>
            <View style={styles.mockMilestoneCard}>
              <View style={styles.milestoneHeader}>
                <TrendingUp size={18} color={CYAN} />
                <Text style={styles.milestoneTitle}>Első mérföldkő: 5 támogatott adag</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: '0%' }]} />
              </View>
              <Text style={styles.milestoneSubtext}>5 még hátravan</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(tabs)/home')}>
              <Text style={styles.primaryButtonText}>Partnerhelyek felfedezése</Text>
            </TouchableOpacity>
          </LinearGradient>
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
          <ChevronLeft size={22} color={Colors.text} />
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
            tintColor={CYAN}
          />
        }
      >
        <LinearGradient
          colors={['rgba(0, 200, 232, 0.10)', 'rgba(0, 200, 232, 0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
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
                <Flame size={14} color="#F6B17A" />
                <Text style={styles.badgeText}>{stats.current_streak_days} napos sorozat</Text>
              </View>
            )}
            {leaderboard_position && leaderboard_position.percentile <= 20 && (
              <View style={styles.badge}>
                <Crown size={14} color="#F6B17A" />
                <Text style={styles.badgeText}>Top {Math.round(leaderboard_position.percentile)}%</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {next_milestone && (
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <TrendingUp size={18} color={CYAN} />
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
              <Heart size={16} color={CYAN} />
              <Text style={styles.sectionTitle}>Legutóbbi adományok</Text>
            </View>
            
            {recent_donations.slice(0, 10).map((donation: RecentDonation, index: number) => (
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
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.44)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyImpactCard: {
    minHeight: 360,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 232, 0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  mockMilestoneCard: {
    width: '100%',
    marginTop: 2,
    marginBottom: 18,
    borderRadius: 16,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.44)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: CYAN,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#001014',
    fontSize: 15,
    fontWeight: '700',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  retryButtonText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: CYAN,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 25,
  },
  primaryButtonText: {
    color: '#001014',
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 200, 232, 0.18)',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    color: CYAN,
    letterSpacing: -0.8,
  },
  statValueSecondary: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00B8D8',
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.44)',
    marginTop: 3,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  milestoneCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: CYAN,
    borderRadius: 4,
  },
  milestoneSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.44)',
  },
  milestoneDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  timelineSection: {
    marginTop: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingLeft: 3,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: CYAN,
    marginTop: 5,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.38)',
    marginBottom: 3,
  },
  timelineVenue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 3,
  },
  timelineImpact: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.44)',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
