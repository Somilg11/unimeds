import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Stethoscope, Building2, LayoutDashboard, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-foreground rounded-md"></div>
              <span className="text-sm font-semibold text-foreground">UniMeds</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/auth/signin" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Button asChild size="sm" className="text-xs">
                <Link href="/auth/signin">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-12 sm:py-16 lg:py-20">
        <div className="text-center max-w-3xl mx-auto animate-subtle">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground mb-4 sm:mb-6 tracking-tight">
            Modern Healthcare Management
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
            Streamline patient care, appointments, and medical records with our intelligent healthcare platform.
          </p>
          <div className="flex gap-2 sm:gap-4 justify-center">
            <Button asChild size="sm" className="text-xs sm:text-sm">
              <Link href="/auth/signin">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm">
              <Link href="/user">View Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Patient Portal */}
          <Link href="/user" className="group">
            <Card className="hover-lift cursor-pointer border-border/50 hover:border-border transition-all">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg mb-3 sm:mb-4 flex items-center justify-center">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                </div>
                <CardTitle className="text-base sm:text-lg">Patient Portal</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Manage your health timeline, upload records, and book appointments.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Doctor Dashboard */}
          <Link href="/doctor" className="group">
            <Card className="hover-lift cursor-pointer border-border/50 hover:border-border transition-all">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg mb-3 sm:mb-4 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                </div>
                <CardTitle className="text-base sm:text-lg">Doctor Dashboard</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Access patient records, clinical context, and manage appointments.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          {/* Clinic Admin */}
          <Link href="/clinic" className="group">
            <Card className="hover-lift cursor-pointer border-border/50 hover:border-border transition-all">
              <CardHeader className="p-4 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted rounded-lg mb-3 sm:mb-4 flex items-center justify-center">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                </div>
                <CardTitle className="text-base sm:text-lg">Clinic Admin</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monitor analytics, appointment queues, and clinic operations.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {/* Dashboard Access Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
        <Card className="bg-foreground text-background border-foreground">
          <CardHeader className="p-4 sm:p-6 lg:p-8">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-background mb-2">Access Your Dashboard</CardTitle>
            <CardDescription className="text-background/70 text-sm sm:text-base">
              Choose your role to access the appropriate dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <Button asChild variant="secondary" size="sm" className="text-xs sm:text-sm">
                <Link href="/user" className="flex items-center justify-center gap-2">
                  <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4" />
                  Patient Portal
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm bg-background/10 text-background border-background/20 hover:bg-background/20">
                <Link href="/doctor" className="flex items-center justify-center gap-2">
                  <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4" />
                  Doctor Dashboard
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm bg-background/10 text-background border-background/20 hover:bg-background/20">
                <Link href="/clinic" className="flex items-center justify-center gap-2">
                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Clinic Admin
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs sm:text-sm bg-background/10 text-background border-background/20 hover:bg-background/20">
                <Link href="/admin" className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                  Super Admin
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border mt-8 sm:mt-12 lg:mt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
          <div className="text-center text-xs sm:text-sm text-muted-foreground">
            © 2026 UniMeds. Modern Healthcare Management.
          </div>
        </div>
      </footer>
    </div>
  );
}
