import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#08090a", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Text style={{ fontSize: 36, fontWeight: "800", color: "#C8F000", fontStyle: "italic", letterSpacing: -1 }}>
        Swing
        <Text style={{ color: "rgba(255,255,255,0.4)", fontWeight: "300" }}>Lab</Text>
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8, marginBottom: 40, textAlign: "center" }}>
        Capture. Tag. Compare.
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/compare")}
        style={{ backgroundColor: "#C8F000", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: "100%", marginBottom: 12 }}
      >
        <Text style={{ color: "#08090a", fontWeight: "700", fontSize: 16, textAlign: "center" }}>Quick Compare</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/capture")}
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: "100%", marginBottom: 12 }}
      >
        <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600", fontSize: 16, textAlign: "center" }}>Capture Swing</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/swings")}
        style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, width: "100%" }}
      >
        <Text style={{ color: "rgba(255,255,255,0.5)", fontWeight: "500", fontSize: 16, textAlign: "center" }}>Saved Swings</Text>
      </TouchableOpacity>
    </View>
  );
}
