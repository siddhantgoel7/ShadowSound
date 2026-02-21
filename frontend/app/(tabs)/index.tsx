import { StyleSheet, Text, View } from "react-native";
import { PageContainer } from "@/components/page-container";

export default function HomeScreen() {
  return (
    <PageContainer>
      <View style={styles.container}>
        <Text style={styles.text}>Home</Text>
        <Text style={styles.subtext}>Welcome to ShadowSound</Text>
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: "#999",
  },
});
