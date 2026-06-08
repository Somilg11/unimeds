import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, FileText, User, Stethoscope } from 'lucide-react';
import { LogoutButton } from '@/components/logout-button';

export default async function DoctorDashboard() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/doctor');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Doctor Dashboard</h1>
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:flex">
                ⌘K Search Patients
              </Badge>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {session.user.name}
              </Badge>
              <LogoutButton redirectTo="/doctor" size="sm" className="text-xs" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          
          {/* Patient Search Card */}
          <Card className="hover-lift border-border/50 sm:col-span-2">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                Patient Search
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by name, phone, or ID..."
                  className="text-xs sm:text-sm"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] sm:text-xs text-muted-foreground bg-muted rounded hidden sm:block">⌘K</kbd>
              </div>
            </CardContent>
          </Card>

          {/* Today's Schedule Card */}
          <Card className="hover-lift border-border/50">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                Today&apos;s Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="space-y-2 sm:space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border border-border">
                  <div className="text-[10px] sm:text-xs text-muted-foreground">10:00 AM</div>
                  <div className="text-xs sm:text-sm text-foreground font-medium">John Doe</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">General Checkup</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 sm:p-4 border border-border">
                  <div className="text-[10px] sm:text-xs text-muted-foreground">11:30 AM</div>
                  <div className="text-xs sm:text-sm text-foreground font-medium">Jane Smith</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Follow-up</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Context Card */}
          <Card className="hover-lift border-border/50 sm:col-span-2 lg:col-span-3">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="text-sm sm:text-base lg:text-lg flex items-center gap-2">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
                Clinical Context
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                {/* Patient Demographics */}
                <Card className="bg-muted/30 border-border">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      Patient Demographics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="text-foreground">John Doe</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="text-foreground">35</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="text-foreground">Male</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* OCR Summary */}
                <Card className="bg-muted/30 border-border">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                      Recent Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs">
                      <div className="text-muted-foreground">Blood work - Normal</div>
                      <div className="text-muted-foreground">X-Ray - Clear</div>
                      <div className="text-muted-foreground">Prescription - Updated</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Consultation Notes */}
                <Card className="bg-muted/30 border-border">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
                      <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                      Consultation Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <Textarea
                      placeholder="Add consultation notes..."
                      className="text-[10px] sm:text-xs min-h-20 sm:min-h-24"
                    />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
