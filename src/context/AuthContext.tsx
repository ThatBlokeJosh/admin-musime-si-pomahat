'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import Login from '@/components/AdminLogin';
import { GovLoading } from '@gov-design-system-ce/react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  const signIn = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logOut = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  function IntefaceSwitcher(user: User | null, loading: boolean): ReactNode {
    if (loading) {
      return (<div className="w-screen h-screen grid justify-center items-center">
        <GovLoading size="l"></GovLoading>
      </div>
      )
    } else if (!user) {
      return (<Login></Login>)
    } else if (user) {
      return children
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, logOut }}>
      {/* <button className='z-[100]' onClick={async () => { await logOut() }}>log out</button> */}
      {IntefaceSwitcher(user, loading)}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthContextProvider');
  return context;
};
