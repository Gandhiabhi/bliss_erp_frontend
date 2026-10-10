import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading records...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-3 shadow-sm shadow-amber-600/10">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-slate-600">{message}</p>
    </div>
  );
}
