'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch (err: any) {
      setError('Unable to send reset instructions. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Subtle Luxury Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#B5915F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#3E2C1E]/5 rounded-full blur-3xl pointer-events-none" />

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
            Reset Password
          </h1>
          <p className="text-xs text-[#7A6858] max-w-xs font-sans">
            Enter your verified spa staff email to receive recovery instructions
          </p>
        </div>

        <Card className="border-slate-200/90 bg-white shadow-xl">
          <CardContent className="p-6">
            {submitted ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Instructions Sent</h3>
                <p className="text-xs text-slate-500">
                  If an account exists for <span className="text-slate-800 font-semibold">{email}</span>, you will receive password reset instructions shortly.
                </p>
                <div className="pt-2">
                  <Link href="/login">
                    <Button variant="secondary" className="w-full">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
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
                    label="Staff Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@blish-spa.com"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  variant="gold"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-amber-700 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Back to Sign In
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
