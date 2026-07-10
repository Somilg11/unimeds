// 'use client';

// import Link from 'next/link';
// import { useState, useEffect } from 'react';
// import { Menu, X, User, Stethoscope, Building2, Shield, HeadphonesIcon, Mail, LayoutDashboard, FileText, ClipboardList, Calendar, Clock, Users, Settings } from 'lucide-react';
// import { useSession, signOut } from 'next-auth/react';
// import { usePathname } from 'next/navigation';
// import { cn } from '@/lib/utils';

// const roleNavItems = {
//   patient: [
//     { href: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//     { href: '/user/records', label: 'Records', icon: FileText },
//     { href: '/user/medical-history', label: 'Medical History', icon: ClipboardList },
//     { href: '/user/book', label: 'Book Appointment', icon: Calendar },
//     { href: '/user/profile', label: 'Profile', icon: User },
//   ],
//   doctor: [
//     { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//     { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
//     { href: '/doctor/availability', label: 'Availability', icon: Clock },
//     { href: '/doctor/patients', label: 'Patients', icon: Users },
//     { href: '/doctor/records', label: 'Records', icon: FileText },
//   ],
//   admin: [
//     { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//     { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
//     { href: '/admin/clinics', label: 'Clinics', icon: Building2 },
//     { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
//   ],
//   clinic: [
//     { href: '/clinic/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//     { href: '/clinic/doctors', label: 'Doctors', icon: Stethoscope },
//     { href: '/clinic/appointments', label: 'Appointments', icon: Calendar },
//     { href: '/clinic/settings', label: 'Settings', icon: Settings },
//   ],
// };

// const roleLabels = {
//   patient: 'Patient',
//   doctor: 'Doctor',
//   admin: 'Administrator',
//   clinic: 'Clinic Admin',
// };

// const guestNavItems = [
//   { href: '/user', label: 'Patients', icon: User },
//   { href: '/doctor', label: 'Doctors', icon: Stethoscope },
//   { href: '/clinic', label: 'Clinics', icon: Building2 },
//   { href: '/admin', label: 'Admin', icon: Shield },
// ];

// export function LandingNav() {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const pathname = usePathname();
//   const { data: session, status } = useSession();
//   const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'admin' | 'clinic' | null>(null);
//   const [userName, setUserName] = useState('');
//   const [checking, setChecking] = useState(true);

//   useEffect(() => {
//     // 1. Check doctor token
//     const doctorToken = localStorage.getItem('doctor_token');
//     if (doctorToken) {
//       setUserRole('doctor');
//       try {
//         const user = JSON.parse(localStorage.getItem('doctor_user') || '{}');
//         setUserName(user.name || 'Doctor');
//       } catch {
//         setUserName('Doctor');
//       }
//       setChecking(false);
//       return;
//     }

//     // 2. Check admin token
//     const adminToken = localStorage.getItem('admin_token');
//     if (adminToken) {
//       setUserRole('admin');
//       try {
//         const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
//         setUserName(user.name || 'Admin');
//       } catch {
//         setUserName('Admin');
//       }
//       setChecking(false);
//       return;
//     }

//     // 3. Check clinic admin via API
//     async function checkClinicAuth() {
//       try {
//         const res = await fetch('/api/clinic-admin/settings');
//         if (res.ok) {
//           const data = await res.json();
//           setUserRole('clinic');
//           setUserName(data?.clinic?.name || 'Clinic Admin');
//           setChecking(false);
//           return true;
//         }
//       } catch {
//         // ignore
//       }
//       return false;
//     }

//     // 4. Check NextAuth session (patient)
//     if (status === 'authenticated' && session?.user) {
//       setUserRole('patient');
//       setUserName(session.user.name || 'Patient');
//       setChecking(false);
//       return;
//     }

//     if (status === 'unauthenticated') {
//       checkClinicAuth().then((isClinic) => {
//         if (!isClinic) {
//           setUserRole(null);
//           setUserName('');
//           setChecking(false);
//         }
//       });
//     } else if (status !== 'loading') {
//       setChecking(false);
//     }
//   }, [status, session]);

//   const handleLogout = async () => {
//     if (userRole === 'doctor') {
//       localStorage.removeItem('doctor_token');
//       localStorage.removeItem('doctor_user');
//       window.location.href = '/doctor';
//     } else if (userRole === 'admin') {
//       localStorage.removeItem('admin_token');
//       localStorage.removeItem('admin_user');
//       window.location.href = '/admin';
//     } else if (userRole === 'clinic') {
//       signOut({ callbackUrl: '/clinic' });
//     } else if (userRole === 'patient') {
//       signOut({ callbackUrl: '/user' });
//     }
//   };

//   const navItems = userRole ? roleNavItems[userRole] : null;

//   return (
//     <header className="fixed top-0 left-0 right-0 z-50 bg-glass border-b border-gray-100/50">
//       {/* Desktop */}
//       <div className="hidden md:flex h-14 items-center max-w-[1400px] mx-auto px-6">
//         <Link
//           href="/"
//           className="h-14 flex items-center justify-center shrink-0 mr-8"
//         >
//           <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-apple border border-white/20 hover-lift">
//             <span className="text-white text-[13px] font-bold">U</span>
//           </div>
//         </Link>

//         <nav className="flex items-center gap-6 h-full">
//           {navItems ? (
//             navItems.map((item) => (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className="text-[14px] font-semibold text-primary hover:text-primary/80 transition-colors"
//               >
//                 {item.label}
//               </Link>
//             ))
//           ) : (
//             <>
//               <Link
//                 href="/user"
//                 className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
//               >
//                 Patients
//               </Link>
//               <Link
//                 href="/doctor"
//                 className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
//               >
//                 Doctors
//               </Link>
//               <Link
//                 href="/clinic"
//                 className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
//               >
//                 Clinics
//               </Link>
//               <Link
//                 href="/admin"
//                 className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
//               >
//                 Admin
//               </Link>
//             </>
//           )}
//         </nav>

//         <div className="flex-1" />

//         <div className="flex items-center gap-6 h-full">
//           {userRole ? (
//             <div className="flex items-center gap-4">
//               <span className="text-[13px] font-semibold text-gray-700">
//                 Hi, {userName}
//               </span>
//               <button
//                 onClick={handleLogout}
//                 className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[12px] font-semibold rounded-full shadow-apple hover-lift transition-all cursor-pointer"
//               >
//                 Logout
//               </button>
//             </div>
//           ) : (
//             <>
//               <Link
//                 href="/support"
//                 className="text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
//               >
//                 Support
//               </Link>
//               <Link
//                 href="/contact"
//                 className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-[13px] font-medium rounded-full shadow-apple hover-lift transition-all"
//               >
//                 Contact
//               </Link>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Mobile Top Bar */}
//       <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center justify-between px-4">
//         <Link href="/" className="flex items-center gap-2.5">
//           <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm border border-primary/20">
//             <span className="text-white text-[13px] font-bold">U</span>
//           </div>
//           <span className="text-sm font-bold text-gray-900 tracking-tight">UniMeds</span>
//         </Link>
//         <button
//           onClick={() => setMobileOpen(!mobileOpen)}
//           className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
//         >
//           {mobileOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
//         </button>
//       </div>

//       {/* Mobile Overlay */}
//       {mobileOpen && (
//         <div
//           className="md:hidden fixed inset-0 bg-black/50 z-40"
//           onClick={() => setMobileOpen(false)}
//         />
//       )}

//       {/* Mobile Slide-in Nav */}
//       {mobileOpen && (
//         <div className="md:hidden fixed top-16 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-xl rounded-b-3xl overflow-hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
//           <div className="p-4 space-y-1">
//             {(navItems || guestNavItems).map((item) => {
//               const Icon = item.icon;
//               const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
//               return (
//                 <Link
//                   key={item.href}
//                   href={item.href}
//                   onClick={() => setMobileOpen(false)}
//                   className={cn(
//                     'flex items-center gap-3 px-4 py-3.5 transition-all rounded-2xl',
//                     isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
//                   )}
//                 >
//                   <Icon className="w-4.5 h-4.5 shrink-0" />
//                   <span className="text-[14px] font-medium">{item.label}</span>
//                 </Link>
//               );
//             })}
//           </div>

//           {userRole ? (
//             <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50/50">
//               <div className="flex items-center gap-3 px-2 py-1">
//                 <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
//                   <span className="text-primary text-sm font-bold uppercase">{userName[0] || 'U'}</span>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-[14px] font-semibold text-gray-900 truncate">{userName}</p>
//                   <p className="text-[12px] text-gray-500 font-medium">{roleLabels[userRole]}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => {
//                   setMobileOpen(false);
//                   handleLogout();
//                 }}
//                 className="w-full h-11 flex items-center justify-center text-red-600 bg-white border border-dashed border-red-400 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors shadow-sm cursor-pointer"
//               >
//                 Logout
//               </button>
//             </div>
//           ) : (
//             <div className="border-t border-gray-100 p-4 space-y-2">
//               <Link
//                 href="/support"
//                 className="flex items-center gap-3 px-4 py-3.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all rounded-2xl"
//                 onClick={() => setMobileOpen(false)}
//               >
//                 <HeadphonesIcon className="w-4.5 h-4.5 shrink-0" />
//                 <span className="text-[14px] font-medium">Support</span>
//               </Link>
//               <Link
//                 href="/contact"
//                 className="flex items-center gap-3 px-4 py-3.5 bg-primary text-white shadow-sm transition-all rounded-2xl"
//                 onClick={() => setMobileOpen(false)}
//               >
//                 <Mail className="w-4.5 h-4.5 shrink-0" />
//                 <span className="text-[14px] font-medium">Contact</span>
//               </Link>
//             </div>
//           )}
//         </div>
//       )}
//     </header>
//   );
// }
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  FileText,
  Activity,
  CalendarPlus,
  User,
  Stethoscope,
  Building2,
  ShieldCheck,
  Settings,
  Bell,
  type LucideIcon,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

type NavItem = { href: string; label: string; icon: LucideIcon };

const roleNavItems: Record<'patient' | 'doctor' | 'admin' | 'clinic', NavItem[]> = {
  patient: [
    { href: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/user/records', label: 'Records', icon: FileText },
    { href: '/user/medical-history', label: 'Medical History', icon: Activity },
    { href: '/user/book', label: 'Book Appointment', icon: CalendarPlus },
    { href: '/user/profile', label: 'Profile', icon: User },
  ],
  doctor: [
    { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/doctor/appointments', label: 'Appointments', icon: Calendar },
    { href: '/doctor/availability', label: 'Availability', icon: Clock },
    { href: '/doctor/patients', label: 'Patients', icon: Users },
    { href: '/doctor/records', label: 'Records', icon: FileText },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { href: '/admin/clinics', label: 'Clinics', icon: Building2 },
    { href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  ],
  clinic: [
    { href: '/clinic/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/clinic/doctors', label: 'Doctors', icon: Stethoscope },
    { href: '/clinic/appointments', label: 'Appointments', icon: Calendar },
    { href: '/clinic/settings', label: 'Settings', icon: Settings },
  ],
};

const publicNavItems: NavItem[] = [
  { href: '/user', label: 'Patients', icon: User },
  { href: '/doctor', label: 'Doctors', icon: Stethoscope },
  { href: '/clinic', label: 'Clinics', icon: Building2 },
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
];

const roleLabels = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Administrator',
  clinic: 'Clinic Admin',
};

const roleIcons: Record<'patient' | 'doctor' | 'admin' | 'clinic', LucideIcon> = {
  patient: User,
  doctor: Stethoscope,
  admin: ShieldCheck,
  clinic: Building2,
};

export function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | 'admin' | 'clinic' | null>(null);
  const [userName, setUserName] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 1. Check doctor token
    const doctorToken = localStorage.getItem('doctor_token');
    if (doctorToken) {
      setUserRole('doctor');
      try {
        const user = JSON.parse(localStorage.getItem('doctor_user') || '{}');
        setUserName(user.name || 'Doctor');
      } catch {
        setUserName('Doctor');
      }
      setChecking(false);
      return;
    }

    // 2. Check admin token
    const adminToken = localStorage.getItem('admin_token');
    if (adminToken) {
      setUserRole('admin');
      try {
        const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
        setUserName(user.name || 'Admin');
      } catch {
        setUserName('Admin');
      }
      setChecking(false);
      return;
    }

    // 3. Check clinic admin via API
    async function checkClinicAuth() {
      try {
        const res = await fetch('/api/clinic-admin/settings');
        if (res.ok) {
          const data = await res.json();
          setUserRole('clinic');
          setUserName(data?.clinic?.name || 'Clinic Admin');
          setChecking(false);
          return true;
        }
      } catch {
        // ignore
      }
      return false;
    }

    // 4. Check NextAuth session (patient)
    if (status === 'authenticated' && session?.user) {
      setUserRole('patient');
      setUserName(session.user.name || 'Patient');
      setChecking(false);
      return;
    }

    if (status === 'unauthenticated') {
      checkClinicAuth().then((isClinic) => {
        if (!isClinic) {
          setUserRole(null);
          setUserName('');
          setChecking(false);
        }
      });
    } else if (status !== 'loading') {
      setChecking(false);
    }
  }, [status, session]);

  const handleLogout = async () => {
    if (userRole === 'doctor') {
      localStorage.removeItem('doctor_token');
      localStorage.removeItem('doctor_user');
      window.location.href = '/doctor';
    } else if (userRole === 'admin') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin';
    } else if (userRole === 'clinic') {
      signOut({ callbackUrl: '/clinic' });
    } else if (userRole === 'patient') {
      signOut({ callbackUrl: '/user' });
    }
  };

  const navItems = userRole ? roleNavItems[userRole] : publicNavItems;
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="fixed top-4 inset-x-4 md:inset-x-6 z-50">
      {/* Desktop pill */}
      <div className="hidden md:flex h-14 items-center max-w-[1200px] mx-auto px-4 rounded-full bg-white/80 backdrop-blur-xl border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <Link
          href="/"
          className="h-9 w-9 flex items-center justify-center shrink-0 ml-1 mr-6"
        >
          <img src="/unimeds_logo.png" alt="UniMeds" className="w-8 h-8 object-contain hover-lift rounded-xl" />
        </Link>

        <nav className="flex items-center gap-1 h-full">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[13px] font-semibold px-3.5 py-2 rounded-full transition-colors',
                  active
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-gray-100'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-2 h-full pr-1">
          {userRole ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-gray-700 pl-1">
                Hi, {userName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[12px] font-semibold rounded-full shadow-apple hover-lift transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/support"
                className="text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 px-3.5 py-2 rounded-full transition-colors"
              >
                Support
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-white text-[13px] font-medium rounded-full shadow-apple hover-lift transition-all"
              >
                Contact
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile pill */}
      <div className="md:hidden flex h-14 items-center justify-between px-4 rounded-full bg-white/80 backdrop-blur-xl border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <Link href="/" className="flex items-center gap-2">
          <img src="/unimeds_logo.png" alt="UniMeds" className="h-8 object-contain rounded-xl" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Card */}
      {mobileOpen && (
        <div className="md:hidden mt-2 rounded-3xl bg-white/95 backdrop-blur-xl border border-gray-100/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-subtle">
          <div className="px-2.5 py-2.5 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors',
                    active
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className={cn('w-[18px] h-[18px]', active ? 'text-white' : 'text-gray-400')} />
                  <span className="text-[14px] font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {userRole ? (
            <div className="border-t border-neutral-100 p-2.5 space-y-2">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-gray-50/80">
                <div className="w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center shrink-0">
                  {(() => {
                    const RoleIcon = roleIcons[userRole];
                    return <RoleIcon className="w-4 h-4 text-primary" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-[11.5px] text-gray-500 font-medium">{roleLabels[userRole]}</p>
                </div>
                <Bell className="w-[18px] h-[18px] text-gray-400 shrink-0" />
              </div>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center px-4 py-3 rounded-2xl text-red-600 bg-primary/5 hover:bg-primary/10 text-[14px] font-semibold transition-colors cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="border-t border-neutral-100 p-2.5 space-y-2">
              <Link
                href="/support"
                className="flex items-center justify-center h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[14px] font-semibold rounded-2xl transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Support
              </Link>
              <Link
                href="/contact"
                className="flex items-center justify-center h-11 bg-primary hover:bg-primary/90 text-white text-[14px] font-semibold rounded-2xl transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}