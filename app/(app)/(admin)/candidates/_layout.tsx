import { Stack } from 'expo-router';

export default function CandidatesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="confirmation" />
    </Stack>
  );
}
