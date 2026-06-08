import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/logout-button';

export default async function SuperAdminPortal() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-semibold text-zinc-900">Super Admin Portal</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">{session.user.name}</span>
              <LogoutButton redirectTo="/admin" size="sm" className="text-xs" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Total Users */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-500 mb-2">Total Users</h2>
            <div className="text-3xl font-semibold text-zinc-900">2,456</div>
            <div className="text-xs text-zinc-500 mt-1">Across all clinics</div>
          </div>

          {/* Active Clinics */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-500 mb-2">Active Clinics</h2>
            <div className="text-3xl font-semibold text-zinc-900">24</div>
            <div className="text-xs text-zinc-500 mt-1">+3 this month</div>
          </div>

          {/* Total Appointments */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-500 mb-2">Total Appointments</h2>
            <div className="text-3xl font-semibold text-zinc-900">12,345</div>
            <div className="text-xs text-zinc-500 mt-1">This month</div>
          </div>

          {/* Medical Records */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-500 mb-2">Medical Records</h2>
            <div className="text-3xl font-semibold text-zinc-900">45,678</div>
            <div className="text-xs text-zinc-500 mt-1">Stored securely</div>
          </div>

          {/* Tenant Onboarding */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Onboard New Clinic</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Clinic Name"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <input
                type="text"
                placeholder="Timezone"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              <button className="w-full px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
                Onboard Clinic
              </button>
            </div>
          </div>

          {/* Platform Metrics */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Platform Metrics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="text-sm text-zinc-500">Patient Growth</div>
                <div className="text-xl font-semibold text-zinc-900">+15%</div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="text-sm text-zinc-500">Doctor Growth</div>
                <div className="text-xl font-semibold text-zinc-900">+8%</div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="text-sm text-zinc-500">Appointment Rate</div>
                <div className="text-xl font-semibold text-zinc-900">92%</div>
              </div>
              <div className="bg-zinc-50 rounded-lg p-4 border border-zinc-200">
                <div className="text-sm text-zinc-500">System Uptime</div>
                <div className="text-xl font-semibold text-zinc-900">99.9%</div>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-lg border border-zinc-200 p-6 shadow-sm md:col-span-2 lg:col-span-4">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent Audit Logs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left py-2 px-4 text-zinc-600">Timestamp</th>
                    <th className="text-left py-2 px-4 text-zinc-600">User</th>
                    <th className="text-left py-2 px-4 text-zinc-600">Action</th>
                    <th className="text-left py-2 px-4 text-zinc-600">Resource</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 px-4 text-zinc-900">2026-06-08 10:30</td>
                    <td className="py-2 px-4 text-zinc-600">admin@unimeds.com</td>
                    <td className="py-2 px-4 text-zinc-600">TENANT_ONBOARDED</td>
                    <td className="py-2 px-4 text-zinc-600">clinics:uuid</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 px-4 text-zinc-900">2026-06-08 09:15</td>
                    <td className="py-2 px-4 text-zinc-600">doctor@clinic.com</td>
                    <td className="py-2 px-4 text-zinc-600">APPOINTMENT_BOOK</td>
                    <td className="py-2 px-4 text-zinc-600">appointments:uuid</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-2 px-4 text-zinc-900">2026-06-08 08:45</td>
                    <td className="py-2 px-4 text-zinc-600">patient@gmail.com</td>
                    <td className="py-2 px-4 text-zinc-600">RECORD_UPLOAD</td>
                    <td className="py-2 px-4 text-zinc-600">records:uuid</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
