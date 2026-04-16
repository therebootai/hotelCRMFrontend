import React from 'react';
import { Wrench } from 'lucide-react';

export default function ComingSoon({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-card border border-border rounded-xl mt-6 shadow-card">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
        <Wrench size={32} />
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">{moduleName}</h2>
      <p className="text-text-secondary text-sm">This settings module is currently under development.</p>
    </div>
  );
}