import { StyleSheet, Text, View } from "react-native";

interface PermissionGateProps {
    /** Current permission status: null = pending, true = granted, false = denied */
    status: boolean | null;
    /** Content to render when permission is granted */
    children: React.ReactNode;
    /** Message shown when permission is denied */
    deniedMessage?: string;
    /** Message shown while permission is being requested */
    pendingMessage?: string;
}

/**
 * Conditionally renders children based on permission status.
 * Shows appropriate messaging for pending/denied states.
 */
export default function PermissionGate({
    status,
    children,
    deniedMessage = "Permission denied. Please enable it in your device settings.",
    pendingMessage = "Requesting permission…",
}: PermissionGateProps) {
    if (status === null) {
        return (
            <View style={styles.container}>
                <Text style={styles.pendingText}>{pendingMessage}</Text>
            </View>
        );
    }

    if (!status) {
        return (
            <View style={styles.container}>
                <Text style={styles.deniedText}>{deniedMessage}</Text>
            </View>
        );
    }

    return <>{children}</>;
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        paddingHorizontal: 24,
    },
    pendingText: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
    },
    deniedText: {
        fontSize: 14,
        color: "#FF8888",
        textAlign: "center",
        marginTop: 16,
    },
});
