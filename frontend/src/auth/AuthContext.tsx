import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    signIn as amplifySignIn,
    signOut as amplifySignOut,
    getCurrentUser,
    fetchAuthSession,
    fetchUserAttributes,
    confirmSignIn,
} from "aws-amplify/auth";

export interface AuthUser {
    username: string;
    name: string;
    email: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    groups: string[];
    loading: boolean;
    roleName: string;
    can: {
        viewInsights: boolean;       // hr-admins + super-admins
        viewTeamDashboard: boolean;  // managers
        viewAdmin: boolean;          // super-admins
    };
    signIn: (
        username: string,
        password: string
    ) => Promise<{ needsNewPassword: boolean }>;
    confirmNewPassword: (newPassword: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Highest-privilege group wins
const GROUP_PRIORITY = ["super-admins", "hr-admins", "managers", "employees"];

const ROLE_LABELS: Record<string, string> = {
    "super-admins": "Super Admin",
    "hr-admins": "HR Admin",
    managers: "Manager",
    employees: "Employee",
};

function getPrimaryRole(groups: string[]): string {
    for (const g of GROUP_PRIORITY) {
        if (groups.includes(g)) return g;
    }
    return "employees";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [groups, setGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        try {
            await getCurrentUser();
            const [attrs, session] = await Promise.all([
                fetchUserAttributes(),
                fetchAuthSession(),
            ]);

            const idPayload = session.tokens?.idToken?.payload ?? {};
            const rawGroups = idPayload["cognito:groups"];
            const parsedGroups: string[] = Array.isArray(rawGroups)
                ? (rawGroups as string[])
                : typeof rawGroups === "string"
                    ? rawGroups.split(",").map((g) => g.trim()).filter(Boolean)
                    : [];

            setUser({
                username: attrs.email ?? "",
                name: attrs.name ?? attrs.email ?? "",
                email: attrs.email ?? "",
            });
            setGroups(parsedGroups);
        } catch {
            setUser(null);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const signIn = async (username: string, password: string) => {
        const result = await amplifySignIn({ username, password });
        if (
            result.nextStep.signInStep ===
            "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
        ) {
            return { needsNewPassword: true };
        }
        await loadUser();
        return { needsNewPassword: false };
    };

    const confirmNewPassword = async (newPassword: string) => {
        await confirmSignIn({ challengeResponse: newPassword });
        await loadUser();
    };

    const signOut = async () => {
        await amplifySignOut();
        setUser(null);
        setGroups([]);
    };

    const role = getPrimaryRole(groups);

    const can = {
        // HR Admins and Super Admins see the full org Insights page
        viewInsights: groups.includes("hr-admins") || groups.includes("super-admins"),
        // Managers see their own Team Dashboard
        viewTeamDashboard: groups.includes("managers"),
        viewAdmin: groups.includes("super-admins"),
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                groups,
                loading,
                roleName: ROLE_LABELS[role] ?? "Employee",
                can,
                signIn,
                confirmNewPassword,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
