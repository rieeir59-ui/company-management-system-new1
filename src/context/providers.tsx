'use client';

import React, { type ReactNode } from 'react';
import { UserProvider } from '@/context/UserContext';
import { FileProvider } from '@/context/FileContext';
import { RecordProvider } from '@/context/RecordContext';
import { FirebaseProvider } from '@/firebase/provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseProvider>
      <UserProvider>
        <FileProvider>
          <RecordProvider>
            {children}
          </RecordProvider>
        </FileProvider>
      </UserProvider>
    </FirebaseProvider>
  );
}
