import React from 'react';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';

export const SysAdminUsersPage: React.FC = () => {
  const users = [
    { login: 'campus001', name: 'Aarav Raman', dept: 'Electronics & Communication', role: 'STUDENT', status: 'ACTIVE' },
    { login: 'campus017', name: 'Dr. Kavitha Menon', dept: 'Computer Science & Engineering', role: 'FACULTY', status: 'ACTIVE' },
    { login: 'campus031', name: 'Manoj Kumar', dept: 'Electrical Maintenance', role: 'TECHNICIAN', status: 'ACTIVE' },
    { login: 'campus030', name: 'Mr. Dinesh I', dept: 'Central Procurement', role: 'PROCUREMENT_MANAGER', status: 'ACTIVE' },
    { login: 'campus028', name: 'Mr. Joseph Thomas', dept: 'Campus Estate & Facilities', role: 'FACILITIES_ADMIN', status: 'ACTIVE' },
    { login: 'campus024', name: 'Dr. Suresh Balan', dept: 'Computer Science & Engineering', role: 'DEPARTMENT_MANAGER', status: 'ACTIVE' },
    { login: 'campus029', name: 'Ms. Aisha Rahman', dept: 'IT Services', role: 'SYSTEM_ADMIN', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <Breadcrumbs items={[{ label: 'CAMPUSOPS', path: '/' }, { label: 'SYSTEM ADMIN', path: '/app/sysadmin/overview' }, { label: 'USERS & ROLES' }]} />

      <div className="border-b border-[#2A2A2A] pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-brandCream">
          Campus Identity &amp; RBAC Directory
        </h1>
        <p className="text-xs sm:text-sm font-sans text-neutral-400 mt-1">
          Catalog of 38 seeded campus identities with bcrypt-hashed credentials and backend-enforced RBAC.
        </p>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-[#1C1C1C] border-b border-[#2A2A2A] font-mono text-[10px] text-neutral-400 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Login ID</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Primary Assigned Role</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2A2A]">
            {users.map((u) => (
              <tr key={u.login} className="hover:bg-[#1A1A1A] transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-brandLime">
                  {u.login}
                </td>
                <td className="py-3.5 px-4 font-semibold text-brandCream">
                  {u.name}
                </td>
                <td className="py-3.5 px-4 font-mono text-neutral-300">
                  {u.dept}
                </td>
                <td className="py-3.5 px-4 font-mono text-brandLime font-bold">
                  {u.role}
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold uppercase">
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
