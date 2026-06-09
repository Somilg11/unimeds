'use client';

import { Button } from '@/components/ui/button';
import { Calendar, Users, FileText, Activity, ArrowRight } from 'lucide-react';
import { BentoCard } from '@/app/user/_components/bento-card';
import Link from 'next/link';

interface DoctorDashboardClientProps {
  userName: string;
}

export function DoctorDashboardClient({ userName }: DoctorDashboardClientProps) {
  return (
    <div className="bg-zinc-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-0.5">
                Welcome back, {userName}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Quick Actions Card */}
          <BentoCard 
            title="Quick Actions"
            icon={<Activity className="w-5 h-5" />}
          >
            <div className="space-y-2">
              <Link href="/doctor/appointments">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  View Appointments
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/doctor/patients">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <Users className="w-4 h-4 mr-3" />
                  Manage Patients
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
              <Link href="/doctor/records">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm h-10 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-3" />
                  View Records
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </BentoCard>

          {/* Stats Card */}
          <BentoCard 
            title="Overview"
            icon={<Activity className="w-5 h-5" />}
            className="md:col-span-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="text-2xl font-bold text-zinc-900">0</div>
                <div className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-1">
                  Today&apos;s Appointments
                </div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="text-2xl font-bold text-zinc-900">0</div>
                <div className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-1">
                  Total Patients
                </div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="text-2xl font-bold text-zinc-900">0</div>
                <div className="text-xs text-zinc-600 tracking-widest uppercase font-bold mt-1">
                  Pending Requests
                </div>
              </div>
            </div>
          </BentoCard>

        </div>
      </main>
    </div>
  );
}
