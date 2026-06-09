'use client';

import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import { BentoCard } from '@/app/user/_components/bento-card';

interface PatientsClientProps {
  userName: string;
}

export function PatientsClient({ userName }: PatientsClientProps) {
  return (
    <div className="bg-zinc-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Patients
              </h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">
                Manage your patients
              </p>
            </div>
            <Button variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <BentoCard 
          title="Patient List"
          icon={<Users className="w-5 h-5" />}
        >
          <div className="text-center py-12 border-2 border-dashed border-zinc-300 rounded-lg">
            <Users className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
            <p className="text-sm text-zinc-600 font-medium">No patients yet</p>
            <p className="text-xs text-zinc-500 mt-2">Patients will appear here when registered</p>
          </div>
        </BentoCard>
      </main>
    </div>
  );
}
