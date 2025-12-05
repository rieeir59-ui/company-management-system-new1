'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/context/UserContext';
import Header from '@/components/layout/header';
import { employees } from '@/lib/employees';
import { useFirebase } from '@/firebase/provider';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login, user: currentUser } = useCurrentUser();
  const { auth } = useFirebase();
  const isDeveloper = currentUser?.department === 'software-engineer';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({ variant: 'destructive', title: 'Auth service not available' });
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // After successful Firebase Auth, find the employee in the local list
        const employee = employees.find(emp => emp.email.toLowerCase() === user.email?.toLowerCase());

        if (employee) {
            login({ ...employee, uid: user.uid }); // Pass the actual Firebase UID
            toast({
                title: 'Login Successful',
                description: `Welcome back, ${employee.name}!`,
            });
            // Redirect based on department
            if (['ceo', 'admin', 'software-engineer'].includes(employee.department)) {
                router.push('/dashboard');
            } else {
                router.push('/employee-dashboard');
            }
        } else {
            // This case should ideally not happen if all employees are in Firebase Auth
            await auth.signOut();
            toast({ variant: 'destructive', title: 'Login Failed', description: 'Employee details not found in the local employee list.' });
        }
    } catch (error: any) {
        let errorMessage = 'An unknown error occurred.';
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid email or password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'The email address is not valid.';
                    break;
                default:
                    errorMessage = 'Login failed. Please try again.';
            }
        }
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: errorMessage,
        });
    }
  };

  const handleSignUpAll = async () => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Auth service not available' });
      return;
    }
    setIsSigningUp(true);
    toast({ title: 'Registration Started', description: 'Registering all employees in Firebase Auth...' });

    let successCount = 0;
    let failCount = 0;

    for (const emp of employees) {
      if (!emp.email || !emp.password) {
        failCount++;
        continue;
      }
      try {
        await createUserWithEmailAndPassword(auth, emp.email, emp.password);
        successCount++;
      } catch (error: any) {
        if (error.code !== 'auth/email-already-in-use') {
            failCount++;
            console.error(`Failed to create user ${emp.email}:`, error);
        } else {
            // If user already exists, we count it as a success for this operation's purpose.
            successCount++;
        }
      }
    }
    
    setIsSigningUp(false);
    toast({
      title: 'Registration Complete',
      description: `${successCount} employees registered/verified. ${failCount} failed.`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit">Login</Button>
               {isDeveloper && (
                 <Button className="w-full" variant="secondary" type="button" onClick={handleSignUpAll} disabled={isSigningUp}>
                    {isSigningUp ? 'Registering...' : 'Sign Up All Employees'}
                </Button>
               )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
