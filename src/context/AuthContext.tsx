"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

export type Role = "manager" | "trainer";

interface User {
    username: string;
    role: Role;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, role: Role) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null); // Default null = not logged in
    const router = useRouter();

    const login = (username: string, role: Role) => {
        setUser({ username, role });
        router.push("/");
    };

    const logout = () => {
        setUser(null);
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
