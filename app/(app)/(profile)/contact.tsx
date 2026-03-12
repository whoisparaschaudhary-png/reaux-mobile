import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Card } from '../../../src/components/ui/Card';
import {
  colors,
  fontFamily,
  spacing,
  borderRadius,
  layout,
} from '../../../src/theme';

const CONTACT_EMAIL = 'support@reauxlabs.com';
const CONTACT_PHONE = '+91 XXXXXXXXXX';
const WEBSITE_URL = 'https://reauxlabs.com';

const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    icon: 'logo-instagram' as const,
    url: 'https://instagram.com/reauxlabs',
    color: '#E4405F',
  },
  {
    name: 'Facebook',
    icon: 'logo-facebook' as const,
    url: 'https://facebook.com/reauxlabs',
    color: '#1877F2',
  },
  {
    name: 'YouTube',
    icon: 'logo-youtube' as const,
    url: 'https://youtube.com/@reauxlabs',
    color: '#FF0000',
  },
  {
    name: 'Snapchat',
    icon: 'logo-snapchat' as const,
    url: 'https://snapchat.com/add/reauxlabs',
    color: '#FFFC00',
  },
];

function openURL(url: string) {
  Linking.openURL(url).catch(() => {});
}

export default function ContactScreen() {
  return (
    <SafeScreen>
      <Header title="Contact Us" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Info */}
        <Card style={styles.brandCard}>
          <View style={styles.brandContent}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="fitness-outline" size={32} color={colors.primary.yellow} />
            </View>
            <Text style={styles.brandName}>REAUX Labs</Text>
            <Text style={styles.brandTagline}>
              Your fitness community and wellness partner
            </Text>
          </View>
        </Card>

        {/* Contact Details */}
        <Text style={styles.sectionTitle}>Get in Touch</Text>

        <Card style={styles.contactCard}>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openURL(`mailto:${CONTACT_EMAIL}`)}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconCircle}>
              <Ionicons name="mail-outline" size={20} color={colors.primary.yellow} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{CONTACT_EMAIL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.light} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openURL(`tel:${CONTACT_PHONE.replace(/\s/g, '')}`)}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconCircle}>
              <Ionicons name="call-outline" size={20} color={colors.primary.yellow} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{CONTACT_PHONE}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.light} />
          </TouchableOpacity>

          <View style={styles.separator} />

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openURL(WEBSITE_URL)}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconCircle}>
              <Ionicons name="globe-outline" size={20} color={colors.primary.yellow} />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactLabel}>Website</Text>
              <Text style={styles.contactValue}>{WEBSITE_URL}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text.light} />
          </TouchableOpacity>
        </Card>

        {/* Social Media */}
        <Text style={styles.sectionTitle}>Follow Us</Text>

        <Card style={styles.socialCard}>
          {SOCIAL_LINKS.map((social, index) => (
            <React.Fragment key={social.name}>
              {index > 0 && <View style={styles.separator} />}
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => openURL(social.url)}
                activeOpacity={0.7}
              >
                <View style={[styles.contactIconCircle, { backgroundColor: `${social.color}15` }]}>
                  <Ionicons name={social.icon} size={20} color={social.color} />
                </View>
                <View style={styles.contactText}>
                  <Text style={styles.contactLabel}>{social.name}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={colors.text.light} />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </Card>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 40,
  },
  brandCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  brandContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  brandIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandName: {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  brandTagline: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  contactCard: {
    marginBottom: spacing.xxl,
  },
  socialCard: {
    marginBottom: spacing.xxl,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary.yellow}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  contactValue: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginLeft: 52,
  },
});
