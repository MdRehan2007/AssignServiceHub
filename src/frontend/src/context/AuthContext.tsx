import { getAdminAccount, loginAsCustomerApi } from "@/services/api";
import type { User, UserRole } from "@/types";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isAdmin: boolean;
  isHeadAdmin: boolean;
  isCollegeAdmin: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  loginAsCustomer: (
    name: string,
    email: string,
    isValidated?: boolean,
    registeredCollegeId?: string,
  ) => boolean;
  logout: () => void;
  loading: boolean;
  mustChangePassword: boolean;
  dismissPasswordChange: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hardcoded head admin — cannot be replaced dynamically
const HEAD_ADMIN_ACCOUNTS: Record<
  string,
  {
    password: string;
    role: UserRole;
    name: string;
    college?: string;
    collegeId?: string;
  }
> = {
  "mhdrihan2007@gmail.com": {
    password: "Rehan@2007",
    role: "headAdmin",
    name: "Database Administrator",
  },
  "college@assignflow.com": {
    password: "college123",
    role: "collegeAdmin",
    name: "SRMAP Admin",
    college: "SRMAP",
    collegeId: "col_1",
  },
  "srmap2@assignflow.com": {
    password: "srmap2123",
    role: "collegeAdmin",
    name: "SRMAP Admin 2",
    college: "SRMAP",
    collegeId: "col_1",
  },
};

function getRegisteredCustomers(): Array<{
  name: string;
  email: string;
  college?: string;
}> {
  try {
    const raw = localStorage.getItem("assignflow_customers");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("assignflow_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
        if (parsed.mustChangePassword) setMustChangePassword(true);
      } catch {
        localStorage.removeItem("assignflow_user");
      }
    }
    setLoading(false);
  }, []);

  const loginAsAdmin = async (
    email: string,
    password: string,
  ): Promise<boolean> => {
    const lowerEmail = email.toLowerCase();

    // Check hardcoded head admin accounts first
    const hardcoded = HEAD_ADMIN_ACCOUNTS[lowerEmail];
    if (hardcoded && hardcoded.password === password) {
      const adminUser: User = {
        id: `admin_${lowerEmail.replace(/[^a-z0-9]/g, "_")}`,
        name: hardcoded.name,
        email,
        role: hardcoded.role,
        college: hardcoded.college,
        createdAt: Date.now(),
        lastLogin: Date.now(),
        mustChangePassword: false,
      };
      setUser(adminUser);
      setMustChangePassword(false);
      localStorage.setItem("assignflow_user", JSON.stringify(adminUser));
      return true;
    }

    // Check dynamically created admin accounts (approved writers)
    const dynamicAccount = await getAdminAccount(lowerEmail);
    if (dynamicAccount && dynamicAccount.passwordHash === password) {
      const adminUser: User = {
        id: `admin_${lowerEmail.replace(/[^a-z0-9]/g, "_")}`,
        name: dynamicAccount.name,
        email,
        role: dynamicAccount.role,
        college: dynamicAccount.college,
        createdAt: dynamicAccount.createdAt,
        lastLogin: Date.now(),
        mustChangePassword: dynamicAccount.mustChangePassword,
        dateOfBirth: dynamicAccount.dateOfBirth,
      };
      setUser(adminUser);
      setMustChangePassword(dynamicAccount.mustChangePassword);
      localStorage.setItem("assignflow_user", JSON.stringify(adminUser));
      return true;
    }

    return false;
  };

  const loginAsCustomer = (
    name: string,
    email: string,
    isValidated?: boolean,
    registeredCollegeId?: string,
  ): boolean => {
    if (!isValidated) {
      const customers = getRegisteredCustomers();
      const found = customers.find(
        (c) => c.email.toLowerCase() === email.toLowerCase(),
      );
      if (!found) return false;
    }
    const customerUser: User = {
      id: `cust_${Date.now()}`,
      name,
      email,
      role: "customer",
      registeredCollegeId: registeredCollegeId ?? "col_1",
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
    setUser(customerUser);
    localStorage.setItem("assignflow_user", JSON.stringify(customerUser));
    return true;
  };

  const dismissPasswordChange = () => {
    setMustChangePassword(false);
    if (user) {
      const updated = { ...user, mustChangePassword: false };
      setUser(updated);
      localStorage.setItem("assignflow_user", JSON.stringify(updated));
    }
  };

  const logout = () => {
    setUser(null);
    setMustChangePassword(false);
    localStorage.removeItem("assignflow_user");
  };

  const role = user?.role ?? null;
  const isAuthenticated = !!user;
  const isCustomer = role === "customer";
  const isAdmin = role === "headAdmin" || role === "collegeAdmin";
  const isHeadAdmin = role === "headAdmin";
  const isCollegeAdmin = role === "collegeAdmin";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isCustomer,
        isAdmin,
        isHeadAdmin,
        isCollegeAdmin,
        loginAsAdmin,
        loginAsCustomer,
        logout,
        loading,
        mustChangePassword,
        dismissPasswordChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
