'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 z-10">
        <div className="text-center space-y-3 flex flex-col items-center">
          <div className="px-6 py-4 bg-gradient-to-b from-[#3E2C1E] to-[#24170E] rounded-2xl shadow-xl border-2 border-[#B5915F]/60 flex items-center justify-center">
            <img
              src="/brand-logo.svg"
              alt="The Bliss International Spa"
              className="h-16 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(255,225,160,0.6)]"
            />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#3E2C1E] tracking-wide">
            Create New Password
          </h1>
          <p className="text-xs text-slate-500">
            Set a secure password for your The Bliss Spa ERP staff credentials
          </p>
        </div>

        <Card className="border-slate-200/90 bg-white shadow-xl">
          <CardContent className="p-6">
            {success ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Password Updated</h3>
                <p className="text-xs text-slate-500">
                  Your credentials have been securely updated. Redirecting to sign in...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <Input
                    label="New Password (min 8 chars)"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  variant="gold"
                  className="w-full"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-xs font-semibold text-slate-500 hover:text-amber-700 transition-colors"
                  >
                    Cancel and Return to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
