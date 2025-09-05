import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "@react-navigation/native";

interface Props {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: Props) => {
  const { user } = useAuth();
  const navigation = useNavigation();

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>You must be logged in to access this page.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Login" as never)}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  message: { fontSize: 16, marginBottom: 16, textAlign: "center" },
  button: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});

export default AuthGuard;
