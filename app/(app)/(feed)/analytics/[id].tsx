import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Line, Text as SvgText } from 'react-native-svg';
import { SafeScreen } from '../../../../src/components/layout/SafeScreen';
import { Header } from '../../../../src/components/layout/Header';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { postsApi } from '../../../../src/api/endpoints/posts';
import { formatNumber } from '../../../../src/utils/formatters';
import { colors, fontFamily, typography, spacing, borderRadius, shadows } from '../../../../src/theme';
import { ms } from '../../../../src/utils/responsive';
import type { PostAnalytics } from '../../../../src/types/models';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - ms(40);
const CHART_HEIGHT = ms(180);
const PAD = { left: ms(4), right: ms(4), top: ms(16), bottom: ms(28) };
const PLOT_W = CHART_WIDTH - PAD.left - PAD.right;
const PLOT_H = CHART_HEIGHT - PAD.top - PAD.bottom;

const DEFAULT_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function PostAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<PostAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'full' | 'partial' | 'failed'>('full');

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await postsApi.getAnalytics(id);
        if (mounted) {
          setData(res.data);
          setStatus('full');
        }
      } catch {
        // Backend analytics endpoint not available yet — fall back to the
        // like/comment counts we can read from the post itself.
        try {
          const postRes = await postsApi.getById(id);
          const post = postRes.data.post;
          if (mounted) {
            setData({
              postId: id,
              totalViews: 0,
              totalLikes: post.likesCount ?? 0,
              totalComments: post.commentsCount ?? 0,
              engagementRate: 0,
            });
            setStatus('partial');
          }
        } catch {
          if (mounted) setStatus('failed');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const chart = useMemo(() => {
    const series = data?.series ?? [];
    if (series.length < 2) return null;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const points = series
      .map((v, i) => {
        const x = PAD.left + (i / (series.length - 1)) * PLOT_W;
        const y = PAD.top + PLOT_H - ((v - min) / range) * PLOT_H;
        return `${x},${y}`;
      })
      .join(' ');
    const labels = data?.seriesLabels ?? DEFAULT_LABELS;
    return { points, labels: labels.slice(0, series.length), count: series.length };
  }, [data]);

  const partial = status === 'partial';

  if (loading) {
    return (
      <SafeScreen>
        <Header title="Post Analytics" showBack onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
        </View>
      </SafeScreen>
    );
  }

  if (status === 'failed' || !data) {
    return (
      <SafeScreen>
        <Header title="Post Analytics" showBack onBack={() => router.back()} />
        <EmptyState icon="bar-chart-outline" title="Analytics unavailable" message="We couldn't load analytics for this post." />
      </SafeScreen>
    );
  }

  const delta = data.engagementDelta;

  return (
    <SafeScreen>
      <Header title="Post Analytics" showBack onBack={() => router.back()} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stat cards */}
        <View style={[styles.statCard, shadows.card]}>
          <Text style={styles.statLabel}>TOTAL VIEWS</Text>
          <Text style={styles.statValue}>{partial ? '—' : formatNumber(data.totalViews)}</Text>
        </View>
        <View style={[styles.statCard, shadows.card]}>
          <Text style={styles.statLabel}>TOTAL LIKES</Text>
          <Text style={styles.statValue}>{formatNumber(data.totalLikes)}</Text>
        </View>
        <View style={[styles.statCard, shadows.card]}>
          <Text style={styles.statLabel}>TOTAL COMMENTS</Text>
          <Text style={styles.statValue}>{formatNumber(data.totalComments)}</Text>
        </View>

        {/* Engagement rate */}
        <Text style={styles.sectionTitle}>Engagement Rate</Text>
        {partial ? (
          <Text style={styles.note}>
            Detailed views and engagement analytics will appear here once tracking is enabled on the backend.
          </Text>
        ) : (
          <>
            <Text style={styles.bigPercent}>{(data.engagementRate ?? 0).toFixed(1)}%</Text>
            <View style={styles.periodRow}>
              <Text style={styles.periodText}>{data.periodLabel || 'Last 7 Days'}</Text>
              {typeof delta === 'number' ? (
                <Text style={[styles.deltaText, { color: delta >= 0 ? colors.status.success : colors.status.error }]}>
                  {delta >= 0 ? '+' : ''}
                  {delta.toFixed(1)}%
                </Text>
              ) : null}
            </View>

            {chart ? (
              <View style={styles.chartWrap}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                  <Line
                    x1={PAD.left}
                    y1={PAD.top + PLOT_H}
                    x2={CHART_WIDTH - PAD.right}
                    y2={PAD.top + PLOT_H}
                    stroke={colors.border.light}
                    strokeWidth={1}
                  />
                  <Polyline
                    points={chart.points}
                    fill="none"
                    stroke={colors.text.secondary}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {chart.labels.map((label, i) => (
                    <SvgText
                      key={i}
                      x={PAD.left + (i / (chart.count - 1)) * PLOT_W}
                      y={CHART_HEIGHT - ms(6)}
                      fontSize={ms(10)}
                      fill={colors.text.light}
                      textAnchor="middle"
                      fontFamily={fontFamily.medium}
                    >
                      {label}
                    </SvgText>
                  ))}
                </Svg>
              </View>
            ) : null}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  statLabel: {
    fontFamily: fontFamily.bold,
    fontSize: ms(11),
    lineHeight: ms(15),
    color: colors.text.light,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: ms(28),
    lineHeight: ms(34),
    color: colors.text.primary,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  note: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(21),
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  bigPercent: {
    fontFamily: fontFamily.bold,
    fontSize: ms(40),
    lineHeight: ms(46),
    color: colors.text.primary,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  periodText: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    lineHeight: ms(20),
    color: colors.text.light,
  },
  deltaText: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    lineHeight: ms(20),
  },
  chartWrap: {
    marginTop: spacing.xl,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
