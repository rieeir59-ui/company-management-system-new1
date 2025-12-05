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
import { doc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useCurrentUser();
  const { auth, firestore } = useFirebase();

  const handleSuccessfulLogin = async (firebaseUser: any, employeeDetails: any) => {
    // Save/update user data in Firestore 'users' collection
    const userRef = doc(firestore, "users", firebaseUser.uid);
    await setDoc(userRef, {
        uid: firebaseUser.uid,
        name: employeeDetails.name,
        email: employeeDetails.email,
        role: employeeDetails.department, // Security rules use 'role'
        department: employeeDetails.department,
        contact: employeeDetails.contact,
        record: employeeDetails.record,
    }, { merge: true });

    login({ ...employeeDetails, uid: firebaseUser.uid, role: employeeDetails.department });
    toast({ title: 'Login Successful', description: `Welcome back, ${employeeDetails.name}!` });

    if (['ceo', 'admin', 'software-engineer'].includes(employeeDetails.department)) {
        router.push('/dashboard');
    } else {
        router.push('/employee-dashboard');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth || !firestore) {
      toast({ variant: 'destructive', title: 'Auth service not available' });
      setIsLoading(false);
      return;
    }

    const employeeDetails = employees.find(emp => emp.email.toLowerCase() === email.toLowerCase());

    if (!employeeDetails || employeeDetails.password !== password) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Invalid email or password.',
        });
        setIsLoading(false);
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleSuccessfulLogin(userCredential.user, employeeDetails);
    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            try {
                const newUserCredential = await createUserWithEmailAndPassword(auth, email, password);
                await handleSuccessfulLogin(newUserCredential.user, employeeDetails);
            } catch (signUpError: any) {
                 toast({
                    variant: 'destructive',
                    title: 'Registration Failed',
                    description: 'Could not create a new account. Please contact support.',
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'An unexpected error occurred. Please try again.',
            });
        }
    } finally {
        setIsLoading(false);
    }
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
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
