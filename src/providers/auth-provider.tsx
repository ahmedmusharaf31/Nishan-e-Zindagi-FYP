"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  sendEmailVerification,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { auth, firestore, isDemoMode, googleProvider, githubProvider } from '@/lib/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, UserRole, AuthState } from '@/types';
import { useUserStore } from '@/store/user-store';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<User | null>;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signInWithGoogle: (role?: UserRole) => Promise<User | null>;
  signInWithGitHub: (role?: UserRole) => Promise<User | null>;
  signOut: () => Promise<void>;
  updateUserRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing without Firebase
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@demo.com': {
    password: 'admin123',
    user: {
      id: 'demo-admin-1',
      email: 'admin@demo.com',
      displayName: 'Admin User',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  },
  'rescuer@demo.com': {
    password: 'rescuer123',
    user: {
      id: 'demo-rescuer-1',
      email: 'rescuer@demo.com',
      displayName: 'Rescuer User',
      role: 'rescuer',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  },
  'public@demo.com': {
    password: 'public123',
    user: {
      id: 'demo-public-1',
      email: 'public@demo.com',
      displayName: 'Public User',
      role: 'public',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const { getUserByEmail, addUser, updateUser } = useUserStore();

  // Prevents onAuthStateChanged from overwriting state during explicit auth calls
  const isHandlingAuthRef = useRef(false);

  // Fetch user profile from Firestore by UID
  const fetchUserFromFirestore = useCallback(async (uid: string): Promise<User | null> => {
    if (!firestore) return null;
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as User;
      }
    } catch (err) {
      console.warn('Failed to fetch user from Firestore:', err);
    }
    return null;
  }, []);

  // Save user profile to Firestore
  const saveUserToFirestore = useCallback(async (user: User): Promise<void> => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'users', user.id), { ...user }, { merge: true });
    } catch (err) {
      console.warn('Failed to save user to Firestore:', err);
    }
  }, []);

  // Load user profile from local store, then Firestore fallback
  const loadUserProfile = useCallback(async (email: string, uid?: string): Promise<User | null> => {
    // First check demo users
    if (isDemoMode && DEMO_USERS[email]) {
      return DEMO_USERS[email].user;
    }
    // Then check local store
    const user = await getUserByEmail(email);
    if (user) return user;

    // Fallback: check Firestore
    if (uid) {
      const firestoreUser = await fetchUserFromFirestore(uid);
      if (firestoreUser) {
        // Cache locally for future use
        await addUser(firestoreUser);
        return firestoreUser;
      }
    }
    return null;
  }, [getUserByEmail, fetchUserFromFirestore, addUser]);

  // Handle Firebase auth state changes
  useEffect(() => {
    if (isDemoMode) {
      // In demo mode, check localStorage for persisted session
      const storedUser = localStorage.getItem('demoUser');
      if (storedUser) {
        const user = JSON.parse(storedUser) as User;
        setAuthState({
          user: { uid: user.id, email: user.email, displayName: user.displayName },
          userProfile: user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Skip if an explicit auth call (signIn/signUp/socialSignIn) is in progress
      if (isHandlingAuthRef.current) return;

      if (firebaseUser) {
        // Block unverified email users from auto-signing in
        if (!firebaseUser.emailVerified) {
          await firebaseSignOut(auth);
          setAuthState({
            user: null,
            userProfile: null,
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }

        const userProfile = await loadUserProfile(firebaseUser.email || '', firebaseUser.uid);
        setAuthState({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          },
          userProfile,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          user: null,
          userProfile: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const signIn = async (email: string, password: string): Promise<User | null> => {
    if (isDemoMode) {
      // Demo mode authentication
      const demoUser = DEMO_USERS[email.toLowerCase()];
      if (demoUser && demoUser.password === password) {
        localStorage.setItem('demoUser', JSON.stringify(demoUser.user));
        setAuthState({
          user: { uid: demoUser.user.id, email: demoUser.user.email, displayName: demoUser.user.displayName },
          userProfile: demoUser.user,
          isLoading: false,
          isAuthenticated: true,
        });
        return demoUser.user;
      }

      // Check store for custom users
      const storedUser = await getUserByEmail(email);
      if (storedUser) {
        localStorage.setItem('demoUser', JSON.stringify(storedUser));
        setAuthState({
          user: { uid: storedUser.id, email: storedUser.email, displayName: storedUser.displayName },
          userProfile: storedUser,
          isLoading: false,
          isAuthenticated: true,
        });
        return storedUser;
      }

      throw new Error('Invalid email or password');
    }

    isHandlingAuthRef.current = true;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        throw new Error('Please verify your email before signing in. Check your inbox for the verification link.');
      }

      let userProfile = await loadUserProfile(userCredential.user.email || '', userCredential.user.uid);

      // No profile found anywhere — auto-create with default role
      if (!userProfile) {
        userProfile = {
          id: userCredential.user.uid,
          email: (userCredential.user.email || '').toLowerCase(),
          displayName: userCredential.user.displayName || 'User',
          role: 'public',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        await addUser(userProfile);
        await saveUserToFirestore(userProfile);
      }

      setAuthState({
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
        },
        userProfile,
        isLoading: false,
        isAuthenticated: true,
      });

      return userProfile;
    } finally {
      isHandlingAuthRef.current = false;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
    if (isDemoMode) {
      // Demo mode registration
      const newUser: User = {
        id: `demo-${Date.now()}`,
        email: email.toLowerCase(),
        displayName,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await addUser(newUser);
      localStorage.setItem('demoUser', JSON.stringify(newUser));

      setAuthState({
        user: { uid: newUser.id, email: newUser.email, displayName: newUser.displayName },
        userProfile: newUser,
        isLoading: false,
        isAuthenticated: true,
      });
      return;
    }

    isHandlingAuthRef.current = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update Firebase profile
      await updateProfile(userCredential.user, { displayName });

      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user profile in store
      const newUser: User = {
        id: userCredential.user.uid,
        email: email.toLowerCase(),
        displayName,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await addUser(newUser);
      await saveUserToFirestore(newUser);

      // Sign out so user must verify email before accessing the app
      await firebaseSignOut(auth);
    } finally {
      isHandlingAuthRef.current = false;
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'github', role?: UserRole): Promise<User | null> => {
    if (isDemoMode) {
      throw new Error('Social sign-in is not available in demo mode');
    }

    isHandlingAuthRef.current = true;
    try {
      const authProvider = provider === 'google' ? googleProvider : githubProvider;
      const result = await signInWithPopup(auth, authProvider);
      const firebaseUser = result.user;
      const isNewFirebaseUser = getAdditionalUserInfo(result)?.isNewUser ?? false;

      // Check if user profile exists locally or in Firestore
      let userProfile = await loadUserProfile(firebaseUser.email || '', firebaseUser.uid);

      // Determine the role to assign
      const assignedRole = role || 'public';

      if (!userProfile) {
        // No profile anywhere — create one
        const newUser: User = {
          id: firebaseUser.uid,
          email: (firebaseUser.email || '').toLowerCase(),
          displayName: firebaseUser.displayName || 'User',
          role: assignedRole,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        await addUser(newUser);
        await saveUserToFirestore(newUser);
        userProfile = newUser;
      } else if (isNewFirebaseUser && !role) {
        // New Firebase account but stale local profile — reset to 'public'
        await updateUser(userProfile.id, { role: 'public' });
        await saveUserToFirestore({ ...userProfile, role: 'public' });
        userProfile = { ...userProfile, role: 'public' };
      } else if (role && userProfile.role !== role) {
        // Re-registration from register page with a different role — update it
        await updateUser(userProfile.id, { role });
        await saveUserToFirestore({ ...userProfile, role });
        userProfile = { ...userProfile, role };
      }

      setAuthState({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        },
        userProfile,
        isLoading: false,
        isAuthenticated: true,
      });

      return userProfile;
    } finally {
      isHandlingAuthRef.current = false;
    }
  };

  const signInWithGoogle = async (role?: UserRole) => handleSocialSignIn('google', role);
  const signInWithGitHub = async (role?: UserRole) => handleSocialSignIn('github', role);

  const signOut = async () => {
    if (isDemoMode) {
      localStorage.removeItem('demoUser');
      setAuthState({
        user: null,
        userProfile: null,
        isLoading: false,
        isAuthenticated: false,
      });
      return;
    }

    await firebaseSignOut(auth);
    setAuthState({
      user: null,
      userProfile: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const updateUserRole = (role: UserRole) => {
    if (authState.userProfile) {
      const updatedProfile = { ...authState.userProfile, role };
      updateUser(updatedProfile.id, { role });

      if (isDemoMode) {
        localStorage.setItem('demoUser', JSON.stringify(updatedProfile));
      }

      setAuthState(prev => ({
        ...prev,
        userProfile: updatedProfile,
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGitHub,
        signOut,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
