import AppTabs from '@/components/app-tabs';
import { DetailSheetProvider } from '@/components/berkk/detail-sheet';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useOnboarding } from '@/store/onboarding';

export default function TabsLayout() {
  const { hydrated, completed, error } = useOnboarding();
  if (error && !hydrated) return <Redirect href="/onboarding" />;
  if (!hydrated) return <View style={{ flex: 1, backgroundColor: '#171019', justifyContent: 'center' }}><ActivityIndicator color="#F5EFE6" /></View>;
  if (!completed) return <Redirect href="/onboarding" />;
  return (
    <DetailSheetProvider>
      <AppTabs />
    </DetailSheetProvider>
  );
}
