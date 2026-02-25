'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      user_type: 'trucker',
    },
  });

  const selectedUserType = watch('user_type');

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);

    try {
      const result = await authApi.register({
        email: data.email,
        password: data.password,
        user_type: data.user_type,
        profile_data: {},
      });

      setUser({
        id: result.user.id,
        email: result.user.email,
        user_type: result.user.user_type,
        full_name: result.user.email,
      });

      // Set cookie for middleware auth check
      document.cookie = `auth-token=${result.tokens.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errors?: Array<{ message: string }> } } };
      if (err.response?.data?.errors?.length) {
        setServerError(err.response.data.errors[0].message);
      } else {
        setServerError('Unable to connect to the server. Please try again later.');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Account type</Label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex cursor-pointer items-center justify-center rounded-md border-2 p-3 text-sm font-medium transition-colors ${
                    selectedUserType === 'trucker'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <input
                    type="radio"
                    value="trucker"
                    className="sr-only"
                    {...register('user_type')}
                  />
                  Trucker
                </label>
                <label
                  className={`flex cursor-pointer items-center justify-center rounded-md border-2 p-3 text-sm font-medium transition-colors ${
                    selectedUserType === 'business'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <input
                    type="radio"
                    value="business"
                    className="sr-only"
                    {...register('user_type')}
                  />
                  Business
                </label>
              </div>
              {errors.user_type && (
                <p className="text-sm text-destructive">{errors.user_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be 8+ characters with uppercase, lowercase, and a number.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex-col space-y-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="underline hover:text-primary">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
