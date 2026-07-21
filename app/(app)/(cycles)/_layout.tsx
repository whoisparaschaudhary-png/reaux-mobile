import { Stack } from 'expo-router';

export default function CyclesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
