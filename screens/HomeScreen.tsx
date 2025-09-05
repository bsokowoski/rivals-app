// /workspaces/rivals-app/rivals-app/screens/HomeScreen.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.hero}>
        <Text style={styles.title}>RIVALS TCG</Text>
        <Text style={styles.subtitle}>Buy & sell trading cards—fast, clean, simple.</Text>
      </View>

      {/* Primary CTAs */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.cta, styles.ctaPrimary]}
          onPress={() => navigation.navigate("Inventory")} // marketplace entry
        >
          <Text style={styles.ctaEmoji}>🛒</Text>
          <Text style={styles.ctaTitle}>Browse Marketplace</Text>
          <Text style={styles.ctaSub}>Search sets, cards & more</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cta, styles.ctaSecondary]}
          onPress={() => navigation.navigate("Profile")} // placeholder for a future Sell flow
        >
          <Text style={styles.ctaEmoji}>💳</Text>
          <Text style={styles.ctaTitle}>Sell Your Cards</Text>
          <Text style={styles.ctaSub}>List items from your profile</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Links */}
      <View style={styles.quickRow}>
        <QuickLink label="Cart" emoji="🧺" onPress={() => navigation.navigate("Cart")} />
        <QuickLink label="Favorites" emoji="⭐️" onPress={() => navigation.navigate("Favorites")} />
        <QuickLink label="Profile" emoji="👤" onPress={() => navigation.navigate("Profile")} />
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>How it works</Text>
        <Text style={styles.bullet}>• Browse the marketplace to find cards you love.</Text>
        <Text style={styles.bullet}>• Tap an item for pricing details and options.</Text>
        <Text style={styles.bullet}>• Use Cart to check out securely.</Text>
        <Text style={styles.bullet}>• Ready to sell? Head to Profile to manage listings.</Text>
      </View>
    </ScrollView>
  );
}

/* ---------- Small helper component ---------- */
function QuickLink({
  label,
  emoji,
  onPress
}: {
  label: string;
  emoji: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quick} onPress={onPress}>
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 32
  },
  hero: {
    marginTop: 10,
    marginBottom: 16
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#4b5563"
  },
  ctaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 16
  },
  cta: {
    flex: 1,
    borderRadius: 14,
    padding: 16
  },
  ctaPrimary: {
    backgroundColor: "#111827"
  },
  ctaSecondary: {
    backgroundColor: "#1f2937"
  },
  ctaEmoji: {
    fontSize: 22,
    marginBottom: 6
  },
  ctaTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800"
  },
  ctaSub: {
    color: "#d1d5db",
    marginTop: 4,
    fontSize: 12
  },
  quickRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16
  },
  quick: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 12
  },
  quickEmoji: {
    fontSize: 18
  },
  quickLabel: {
    marginTop: 6,
    fontWeight: "700"
  },
  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8
  },
  bullet: {
    color: "#374151",
    marginTop: 4
  }
});
