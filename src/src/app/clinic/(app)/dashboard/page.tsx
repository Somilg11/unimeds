import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  Calendar,
  Users,
  TrendingDown,
  Activity,
  Settings,
  BarChart3,
} from 'lucide-react';
import { LogoutButton } from '@/components/logout-button';

export default async function ClinicDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect('/clinic');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">
              Clinic Dashboard
            </h1>

            <div className="flex items-center gap-2 sm:gap-4">
              <Badge
                variant="secondary"
                className="text-[10px] sm:text-xs"
              >
                {session.user.name}
              </Badge>

              <LogoutButton
                redirectTo="/clinic"
                size="sm"
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Today's Appointments */}
          <Card className="hover-lift border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                Today&apos;s Appointments
              </CardTitle>

              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                12
              </div>

              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                +3 from yesterday
              </div>
            </CardHeader>
          </Card>

          {/* Week Appointments */}
          <Card className="hover-lift border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                This Week
              </CardTitle>

              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                45
              </div>

              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                +12% vs last week
              </div>
            </CardHeader>
          </Card>

          {/* No Show Rate */}
          <Card className="hover-lift border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                No-Show Rate
              </CardTitle>

              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                8.5%
              </div>

              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                -2.3% improvement
              </div>
            </CardHeader>
          </Card>

          {/* Total Patients */}
          <Card className="hover-lift border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                Total Patients
              </CardTitle>

              <div className="text-2xl sm:text-3xl font-semibold text-foreground">
                1,234
              </div>

              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                +15 this month
              </div>
            </CardHeader>
          </Card>

          {/* Appointment Queue */}
          <Card className="hover-lift border-border/50 col-span-2 sm:col-span-2 lg:col-span-3">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                Appointment Queue
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="space-y-3">
                {[
                  {
                    patient: 'John Doe',
                    doctor: 'Dr. Smith - General Checkup',
                    time: '10:00 AM',
                    status: 'In Progress',
                    variant: 'default' as const,
                  },
                  {
                    patient: 'Jane Smith',
                    doctor: 'Dr. Johnson - Follow-up',
                    time: '10:30 AM',
                    status: 'Waiting',
                    variant: 'secondary' as const,
                  },
                  {
                    patient: 'Bob Wilson',
                    doctor: 'Dr. Smith - Lab Results',
                    time: '11:00 AM',
                    status: 'Scheduled',
                    variant: 'outline' as const,
                  },
                ].map((appointment) => (
                  <div
                    key={appointment.patient}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground font-medium truncate">
                        {appointment.patient}
                      </div>

                      <div className="text-xs text-muted-foreground truncate">
                        {appointment.doctor}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-xs text-foreground">
                        {appointment.time}
                      </div>

                      <Badge
                        variant={appointment.variant}
                        className="text-[10px]"
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover-lift border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Staff
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Clinic Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}