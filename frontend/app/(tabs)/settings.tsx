import { StyleSheet, Text, View, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";

// ── Sound categories (matches backend) ───────────────────────────────────

const SOUND_CATEGORIES = [
    { key: "emergency_siren", label: "Emergency Siren", icon: "🚨", default: true },
    { key: "vehicle_approaching", label: "Vehicle Approaching", icon: "🚗", default: true },
    { key: "horn", label: "Car Horn", icon: "📯", default: true },
    { key: "tire_screech", label: "Tire Screech", icon: "⚠️", default: true },
    { key: "glass_breaking", label: "Glass Breaking", icon: "💥", default: true },
    { key: "car_alarm", label: "Car Alarm", icon: "🚨", default: true },
    { key: "shouting", label: "Shouting", icon: "🗣️", default: true },
    { key: "bicycle_bell", label: "Bicycle Bell", icon: "🔔", default: false },
    { key: "dog_barking", label: "Dog Barking", icon: "🐕", default: false },
    { key: "construction_noise", label: "Construction", icon: "🔨", default: false },
    { key: "door_slam", label: "Door Slam", icon: "🚪", default: false },
    { key: "train", label: "Train", icon: "🚂", default: false },
    { key: "aircraft", label: "Aircraft", icon: "✈️", default: false },
    { key: "footsteps_running", label: "Footsteps", icon: "👟", default: false },
];

const ENVIRONMENTS = ["Urban", "Suburban", "Indoor"];

export default function SettingsScreen() {
    // Sound toggles
    const [enabledSounds, setEnabledSounds] = useState<Record<string, boolean>>(
        () => Object.fromEntries(SOUND_CATEGORIES.map((c) => [c.key, c.default]))
    );

    // Sensitivity (0–100)
    const [sensitivity, setSensitivity] = useState(85);

    // Environment profile
    const [environment, setEnvironment] = useState("Urban");

    // Haptic intensity (1–10)
    const [hapticIntensity, setHapticIntensity] = useState(5);

    const toggleSound = (key: string) => {
        setEnabledSounds((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Text style={styles.screenTitle}>Settings</Text>

                {/* ── Sound Categories ────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sound Categories</Text>
                    <Text style={styles.sectionSubtitle}>
                        Choose which sounds to monitor
                    </Text>
                    <View style={styles.card}>
                        {SOUND_CATEGORIES.map((cat, idx) => (
                            <View
                                key={cat.key}
                                style={[
                                    styles.toggleRow,
                                    idx < SOUND_CATEGORIES.length - 1 && styles.toggleRowBorder,
                                ]}
                            >
                                <Text style={styles.toggleIcon}>{cat.icon}</Text>
                                <Text style={styles.toggleLabel}>{cat.label}</Text>
                                <Switch
                                    value={enabledSounds[cat.key]}
                                    onValueChange={() => toggleSound(cat.key)}
                                    trackColor={{ false: "#333", true: "#00CC6644" }}
                                    thumbColor={enabledSounds[cat.key] ? "#00CC66" : "#666"}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Sensitivity ─────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sensitivity</Text>
                    <Text style={styles.sectionSubtitle}>
                        Higher = fewer false alerts ({sensitivity}%)
                    </Text>
                    <View style={styles.card}>
                        <View style={styles.sliderRow}>
                            <Text style={styles.sliderLabel}>Low</Text>
                            <View style={styles.sliderTrack}>
                                <View
                                    style={[
                                        styles.sliderFill,
                                        { width: `${sensitivity}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.sliderLabel}>High</Text>
                        </View>
                        <View style={styles.sliderButtons}>
                            {[50, 70, 85, 95].map((val) => (
                                <Text
                                    key={val}
                                    style={[
                                        styles.sliderPreset,
                                        sensitivity === val && styles.sliderPresetActive,
                                    ]}
                                    onPress={() => setSensitivity(val)}
                                >
                                    {val}%
                                </Text>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ── Environment Profile ─────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Environment</Text>
                    <Text style={styles.sectionSubtitle}>
                        Optimize detection for your surroundings
                    </Text>
                    <View style={styles.pillRow}>
                        {ENVIRONMENTS.map((env) => (
                            <Text
                                key={env}
                                style={[
                                    styles.pill,
                                    environment === env && styles.pillActive,
                                ]}
                                onPress={() => setEnvironment(env)}
                            >
                                {env}
                            </Text>
                        ))}
                    </View>
                </View>

                {/* ── Vibration Intensity ─────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Vibration Intensity</Text>
                    <Text style={styles.sectionSubtitle}>
                        How strong haptic feedback feels ({hapticIntensity}/10)
                    </Text>
                    <View style={styles.card}>
                        <View style={styles.sliderRow}>
                            <Text style={styles.sliderLabel}>Soft</Text>
                            <View style={styles.sliderTrack}>
                                <View
                                    style={[
                                        styles.sliderFill,
                                        { width: `${hapticIntensity * 10}%` },
                                    ]}
                                />
                            </View>
                            <Text style={styles.sliderLabel}>Strong</Text>
                        </View>
                        <View style={styles.sliderButtons}>
                            {[2, 5, 7, 10].map((val) => (
                                <Text
                                    key={val}
                                    style={[
                                        styles.sliderPreset,
                                        hapticIntensity === val && styles.sliderPresetActive,
                                    ]}
                                    onPress={() => setHapticIntensity(val)}
                                >
                                    {val}
                                </Text>
                            ))}
                        </View>
                    </View>
                </View>

                {/* ── About ───────────────────────────────────────────── */}
                <View style={[styles.section, { marginBottom: 40 }]}>
                    <View style={styles.aboutCard}>
                        <Text style={styles.aboutTitle}>🔊 ShadowSound</Text>
                        <Text style={styles.aboutVersion}>v1.0.0</Text>
                        <Text style={styles.aboutDesc}>
                            Real-time safety sound detection for deaf and hard-of-hearing users.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#000",
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: "800",
        color: "#fff",
        marginBottom: 24,
    },

    // Section
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: "#888",
        marginBottom: 12,
    },

    // Card
    card: {
        backgroundColor: "#111",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },

    // Toggle rows
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },
    toggleRowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#222",
    },
    toggleIcon: {
        fontSize: 22,
        marginRight: 12,
    },
    toggleLabel: {
        flex: 1,
        fontSize: 15,
        color: "#ddd",
        fontWeight: "500",
    },

    // Slider
    sliderRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        gap: 10,
    },
    sliderLabel: {
        fontSize: 12,
        color: "#888",
        width: 40,
        textAlign: "center",
    },
    sliderTrack: {
        flex: 1,
        height: 6,
        backgroundColor: "#333",
        borderRadius: 3,
        overflow: "hidden",
    },
    sliderFill: {
        height: "100%",
        backgroundColor: "#00CC66",
        borderRadius: 3,
    },
    sliderButtons: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingBottom: 12,
    },
    sliderPreset: {
        fontSize: 13,
        color: "#666",
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 14,
        overflow: "hidden",
        fontWeight: "600",
    },
    sliderPresetActive: {
        backgroundColor: "#00CC6622",
        color: "#00CC66",
    },

    // Pills
    pillRow: {
        flexDirection: "row",
        gap: 10,
    },
    pill: {
        fontSize: 14,
        color: "#888",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: "#111",
        overflow: "hidden",
        fontWeight: "600",
    },
    pillActive: {
        backgroundColor: "#00CC6622",
        color: "#00CC66",
    },

    // About
    aboutCard: {
        backgroundColor: "#111",
        borderRadius: 14,
        padding: 20,
        alignItems: "center",
    },
    aboutTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 4,
    },
    aboutVersion: {
        fontSize: 12,
        color: "#666",
        marginBottom: 8,
    },
    aboutDesc: {
        fontSize: 13,
        color: "#888",
        textAlign: "center",
        lineHeight: 18,
    },
});
