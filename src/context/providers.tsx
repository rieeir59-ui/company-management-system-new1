
'use client';

import React, { type ReactNode } from 'react';
import { UserProvider } from '@/context/UserContext';
import { FileProvider } from '@/context/FileContext';
import { RecordProvider } from '@/context/RecordContext';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <UserProvider>
        <FileProvider>
          <RecordProvider>
            {children}
          </RecordProvider>
        </FileProvider>
      </UserProvider>
    </FirebaseClientProvider>
  );
}
