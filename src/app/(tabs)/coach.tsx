import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Berkk, BerkkFonts } from '@/constants/theme';

export default function CoachScreen() {
  return (
    <LinearGradient colors={Berkk.backgroundGradient} className="flex-1">
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text style={{ fontFamily: BerkkFonts.bold, color: Berkk.ink, fontSize: 20 }}>
          Coach — coming soon
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}
