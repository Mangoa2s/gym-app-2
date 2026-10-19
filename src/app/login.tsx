import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArrowLeftIcon, ArrowRightIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '@/components/berkk/icons';
import { GlassSurface } from '@/components/berkk/glass-surface';
import { AnimatedGlowBlob } from '@/components/berkk/glow-blob';
import { RoundIconButton } from '@/components/berkk/round-icon-button';
import { TextField } from '@/components/berkk/text-field';
import { Berkk, BerkkFonts } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    // Placeholder — wire up to real auth once a backend exists.
    setTimeout(() => {
      setSubmitting(false);
      router.replace('/(tabs)');
    }, 600);
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#121016' }}>
      <LinearGradient
        colors={Berkk.backgroundGradient}
        locations={Berkk.backgroundGradientLocations}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <AnimatedGlowBlob
        color={Berkk.glowOrange}
        size={280}
        opacity={0.42}
        style={{ top: -60, left: -70 }}
        duration={10000}
      />
      <AnimatedGlowBlob
        color={Berkk.glowPurple}
        size={320}
        opacity={0.4}
        style={{ bottom: -80, right: -60 }}
        duration={11000}
        delay={1600}
      />
      <AnimatedGlowBlob
        color={Berkk.glowBlue}
        size={220}
        opacity={0.32}
        style={{ bottom: 220, left: -80 }}
        duration={12500}
        delay={2600}
      />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={12}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <RoundIconButton accessibilityLabel="Zurück" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
              <ArrowLeftIcon color={Berkk.ink} />
            </RoundIconButton>

            <View className="flex-1 justify-center" style={{ gap: 28 }}>
              <View>
                <Text
                  style={{
                    fontFamily: BerkkFonts.black,
                    color: Berkk.ink,
                    fontSize: 42,
                    letterSpacing: -2.1,
                    lineHeight: 42,
                  }}>
                  Willkommen zurück
                </Text>
                <Text
                  style={{
                    fontFamily: BerkkFonts.regular,
                    color: Berkk.inkSecondary,
                    fontSize: 15,
                    marginTop: 10,
                    lineHeight: 21,
                  }}>
                  Melde dich an, um dein Training fortzusetzen.
                </Text>
              </View>

              <GlassSurface radius={26} className="p-5 gap-[18px]">
                <View className="flex-row items-center gap-[10px]">
                  <LockIcon size={20} color={Berkk.inkSecondary} />
                  <Text style={{ fontFamily: BerkkFonts.semibold, color: Berkk.ink, fontSize: 16.5, letterSpacing: -0.15 }}>
                    Anmelden
                  </Text>
                </View>

                <TextField
                  label="E-Mail"
                  icon={<MailIcon size={18} color={Berkk.inkMuted} />}
                  placeholder="du@beispiel.de"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                />

                <TextField
                  label="Passwort"
                  icon={<LockIcon size={18} color={Berkk.inkMuted} />}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  trailing={
                    <Pressable
                      onPress={() => setShowPassword((s) => !s)}
                      hitSlop={10}
                      accessibilityLabel={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}>
                      {showPassword ? (
                        <EyeOffIcon size={18} color={Berkk.inkMuted} />
                      ) : (
                        <EyeIcon size={18} color={Berkk.inkMuted} />
                      )}
                    </Pressable>
                  }
                />

                <Pressable onPress={() => {}} hitSlop={6} style={{ alignSelf: 'flex-end' }}>
                  {({ pressed }) => (
                    <Text
                      style={{
                        fontFamily: BerkkFonts.medium,
                        color: pressed ? Berkk.linkPressed : Berkk.link,
                        fontSize: 13.5,
                      }}>
                      Passwort vergessen?
                    </Text>
                  )}
                </Pressable>
              </GlassSurface>

              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={({ pressed }) => ({ opacity: canSubmit ? 1 : 0.5, transform: [{ scale: pressed ? 0.975 : 1 }] })}>
                <LinearGradient
                  colors={Berkk.ctaGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.35 }}
                  className="h-20 flex-row items-center justify-center gap-3.5 px-[26px] overflow-hidden"
                  style={{ borderRadius: 26 }}>
                  {submitting && <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />}
                  <Text
                    style={{
                      fontFamily: BerkkFonts.black,
                      color: Berkk.ctaInk,
                      fontSize: 22,
                      letterSpacing: -0.9,
                    }}>
                    {submitting ? 'Wird angemeldet…' : 'Anmelden'}
                  </Text>
                  {!submitting && <ArrowRightIcon size={22} color={Berkk.ctaInk} />}
                </LinearGradient>
              </Pressable>

              <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
                <Text style={{ fontFamily: BerkkFonts.regular, color: Berkk.inkSecondary, fontSize: 14 }}>
                  Neu bei BERKK?
                </Text>
                <Pressable onPress={() => {}} hitSlop={6}>
                  {({ pressed }) => (
                    <Text
                      style={{
                        fontFamily: BerkkFonts.semibold,
                        color: pressed ? Berkk.linkPressed : Berkk.link,
                        fontSize: 14,
                      }}>
                      Registrieren
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
