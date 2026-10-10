'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Sparkles, Shield, Building2, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const fillCredentials = (em = 'bhairaram@gmail.com', pw = 'Bhairaram@123') => {
    setEmail(em);
    setPassword(pw);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#fbf9f5] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative luxury ambient glow matching Image 3 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#b5915f]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#3e2c1e]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand Logo with High Contrast Luxury Espresso Badge */}
      <div className="text-center mb-6 z-10 flex flex-col items-center">
        <div className="relative mb-4 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#b5915f] via-[#e2c792] to-[#b5915f] rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative px-7 py-4.5 bg-gradient-to-b from-[#3e2c1e] via-[#4a3525] to-[#2d1e13] rounded-2xl border border-[#b5915f]/60 shadow-2xl flex items-center justify-center">
            <img
              src="/brand-logo.png"
              alt="The Bliss International Spa"
              className="h-20 sm:h-24 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(224,200,150,0.6)] brightness-115 contrast-125 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold tracking-tight text-[#2d231c]">
          THE BLISS <span className="gold-gradient-text">INTERNATIONAL SPA</span>
        </h1>
        <p className="text-xs text-[#705f52] mt-1 max-w-sm mx-auto font-medium tracking-wide">
          Enterprise Spa Management & Reception Suite • India
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md bg-white border-[#e8e0d5] shadow-xl z-10">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-serif-luxury font-bold text-[#2d231c]">Sign in to your account</CardTitle>
          <CardDescription className="text-[#705f52] text-xs">
            Enter your Super Admin credentials or click Fast Fill below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Admin Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bhairaram@gmail.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <Button
              type="submit"
              variant="gold"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Super Admin Fast-Fill Section */}
          <div className="mt-6 pt-5 border-t border-[#f0e8dc]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#705f52] mb-2.5 text-center">
              Super Administrator Access
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('bhairaram@gmail.com', 'Bhairaram@123')}
                className="flex items-center justify-between p-3 rounded-xl bg-[#fcfbf8] border border-[#e8e0d5] hover:border-[#b5915f] hover:bg-[#fbf7f0] text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[#b5915f] shrink-0" />
                  <div>
                    <span className="font-bold text-[#2d231c] block">Super Admin (bhairaram@gmail.com)</span>
                    <span className="text-[10px] text-[#705f52]">Full Global Network Access</span>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#b5915f] bg-[#f7f0e4] px-2 py-0.5 rounded-md">
                  Click to fill
                </span>
              </button>
            </div>
            <p className="text-[10px] text-[#705f52] mt-3 text-center">
              Super Admin: <code className="text-[#3e2c1e] font-bold font-mono">bhairaram@gmail.com</code> | Pass: <code className="text-[#3e2c1e] font-bold font-mono">Bhairaram@123</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
