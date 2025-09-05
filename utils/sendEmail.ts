import { Linking } from 'react-native';

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const supported = await Linking.canOpenURL(mailto);
  if (!supported) throw new Error('No mail client available');
  await Linking.openURL(mailto);
}
