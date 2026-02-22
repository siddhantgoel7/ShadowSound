import { usePathname, useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Activity, Settings } from "lucide-react-native";

const TABS = [
  { route: "/(tabs)", label: "Monitor", Icon: Activity },
  { route: "/(tabs)/settings", label: "Settings", Icon: Settings },
] as const;

export function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === "/(tabs)") {
      return pathname === "/" || pathname === "/(tabs)";
    }
    return pathname === route || pathname === `/(tabs)${route.replace("/(tabs)", "")}`;
  };

  // ── Web — top bar ──────────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={styles.webContainer}>
        <Pressable onPress={() => router.push("/(tabs)")}>
          <Text style={styles.logo}>🔊 ShadowSound</Text>
        </Pressable>

        <View style={styles.webNav}>
          {TABS.map(({ route, label, Icon }) => {
            const active = isActive(route);
            return (
              <Pressable
                key={route}
                accessibilityRole="link"
                accessibilityLabel={label}
                onPress={() => router.push(route as any)}
                style={[styles.webNavItem, active && styles.webNavItemActive]}
              >
                <Icon
                  size={16}
                  color={active ? "#00CC66" : "#aaa"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.webNavLink,
                    active && styles.webNavLinkActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // ── Mobile — bottom bar ────────────────────────────────────────────
  return (
    <View style={styles.mobileContainer}>
      {TABS.map(({ route, label, Icon }) => {
        const active = isActive(route);
        return (
          <Pressable
            key={route}
            accessibilityRole="link"
            accessibilityLabel={label}
            style={styles.navItem}
            onPress={() => router.push(route as any)}
          >
            <Icon
              size={22}
              color={active ? "#00CC66" : "#555"}
              strokeWidth={active ? 2.5 : 1.8}
            />
            <Text
              style={[
                styles.navLabel,
                active && styles.navLabelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Web ─────────────────────────
  webContainer: {
    height: 60,
    backgroundColor: "#000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  logo: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  webNav: {
    flexDirection: "row",
    gap: 8,
  },
  webNavItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  webNavItemActive: {
    backgroundColor: "#00CC6615",
  },
  webNavLink: {
    color: "#aaa",
    fontSize: 14,
    fontWeight: "500",
  },
  webNavLinkActive: {
    color: "#00CC66",
    fontWeight: "700",
  },

  // ── Mobile ──────────────────────
  mobileContainer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    height: 72,
    backgroundColor: "#111",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#222",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  navLabel: {
    fontSize: 11,
    color: "#555",
    marginTop: 4,
    fontWeight: "600",
  },
  navLabelActive: {
    color: "#00CC66",
  },
});
