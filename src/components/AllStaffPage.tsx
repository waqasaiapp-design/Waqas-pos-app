import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Calendar,
  DollarSign,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Trash2,
  Edit2,
  X,
  UserCheck,
  Shield,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { StaffMember, StaffSalaryPayment } from '../types/pos';
import { formatRs } from '../data/defaultProducts';
import { WaqasDualProfileCards } from './WaqasDualProfileCards';
import { FullScreenPageHeader } from './FullScreenPageHeader';

interface AllStaffPageProps {
  staffList: StaffMember[];
  onSaveStaff: (staff: StaffMember) => void;
  onDeleteStaff: (staffId: string) => void;
  onDeleteAllStaff?: () => void;
  onBackToHome?: () => void;
}

export const AllStaffPage: React.FC<AllStaffPageProps> = ({
  staffList,
  onSaveStaff,
  onDeleteStaff,
  onDeleteAllStaff,
  onBackToHome,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaySalaryModalOpen, setIsPaySalaryModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState<StaffMember['role']>('Cashier');
  const [department, setDepartment] = useState<StaffMember['department']>('Sales');
  const [joiningDate, setJoiningDate] = useState(new Date().toLocaleDateString('en-GB'));
  const [salary, setSalary] = useState('');
  const [username, setUsername] = useState('');
  const [shift, setShift] = useState<StaffMember['shift']>('Morning');
  const [accountStatus, setAccountStatus] = useState<StaffMember['accountStatus']>('active');
  const [notes, setNotes] = useState('');

  // Salary Payment State
  const [salaryPayAmount, setSalaryPayAmount] = useState('');
  const [salaryMonth, setSalaryMonth] = useState(
    new Date().toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })
  );
  const [salaryPayMethod, setSalaryPayMethod] = useState('Cash');

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) || null;

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.employeeId.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.username.toLowerCase().includes(q)
      );
    });
  }, [staffList, roleFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setName('');
    setEmployeeId(`WM-EMP-${String(staffList.length + 1).padStart(3, '0')}`);
    setPhone('');
    setAddress('');
    setRole('Cashier');
    setDepartment('Sales');
    setJoiningDate(new Date().toLocaleDateString('en-GB'));
    setSalary('');
    setUsername(`staff${staffList.length + 1}`);
    setShift('Morning');
    setAccountStatus('active');
    setNotes('');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (st: StaffMember) => {
    setEditingStaff(st);
    setName(st.name);
    setEmployeeId(st.employeeId);
    setPhone(st.phone);
    setAddress(st.address);
    setRole(st.role);
    setDepartment(st.department);
    setJoiningDate(st.joiningDate);
    setSalary(st.salary.toString());
    setUsername(st.username);
    setShift(st.shift);
    setAccountStatus(st.accountStatus);
    setNotes(st.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveStaffMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const baseSalary = parseFloat(salary) || 0;
    const updated: StaffMember = {
      id: editingStaff ? editingStaff.id : `staff-${Date.now()}`,
      employeeId: employeeId.trim() || `WM-EMP-${Date.now().toString().slice(-3)}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      role,
      department,
      joiningDate,
      salary: baseSalary,
      username: username.trim() || name.toLowerCase().replace(/\s+/g, ''),
      accountStatus,
      shift,
      notes: notes.trim() || undefined,
      permissions: editingStaff?.permissions || {
        canEditPrice: role === 'Manager',
        canGiveDiscount: role === 'Manager',
        canDeleteItems: role === 'Manager',
        canAccessReports: role === 'Manager',
        canAccessSettings: false,
        canAccessLedgers: role === 'Manager',
      },
      salaryPayments: editingStaff?.salaryPayments || [],
      attendance: editingStaff?.attendance || [],
      createdAt: editingStaff ? editingStaff.createdAt : new Date().toISOString(),
    };

    onSaveStaff(updated);
    setIsAddModalOpen(false);
    showToast(`Staff member "${updated.name}" saved successfully!`);
  };

  const handleRecordSalaryPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    const amt = parseFloat(salaryPayAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid salary amount.');
      return;
    }

    const payment: StaffSalaryPayment = {
      id: `sal-${Date.now()}`,
      date: new Date().toLocaleDateString('en-GB'),
      month: salaryMonth,
      amount: amt,
      paymentMethod: salaryPayMethod,
      notes: 'Paid monthly salary',
    };

    const updated = {
      ...selectedStaff,
      salaryPayments: [payment, ...(selectedStaff.salaryPayments || [])],
    };

    onSaveStaff(updated);
    setIsPaySalaryModalOpen(false);
    setSalaryPayAmount('');
    showToast(`Salary payment of Rs. ${amt.toFixed(0)} recorded for ${selectedStaff.name}!`);
  };

  return (
    <div className="flex-1 min-h-full w-full bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <FullScreenPageHeader
        title="All Staff Management"
        subtitle="ملازمین کی تفصیل، تنخواہیں، اوقات کار اور حاضری کا نظام"
        icon={<Users className="w-5 h-5 text-sky-600" />}
        onBackToHome={onBackToHome}
        accentColor="sky"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print List</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Add Staff (نیا ملازم)</span>
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-5 lg:p-6 w-full space-y-4 overflow-y-auto">
        {/* Toast Feedback */}
        {feedbackMsg && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* WAQAS MART Dual Profile Cards */}
        <div className="space-y-2">
          <WaqasDualProfileCards variant="sidebar" />
        </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0284c7] text-white flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              All Staff Management (ملازمین کا انتظام)
            </h2>
            <p className="text-xs text-slate-500">
              Staff profiles, roles, salaries, attendance records, and shift schedules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print List</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#0284c7] hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add Staff Member (نیا ملازم)</span>
          </button>

          {staffList.length > 0 && onDeleteAllStaff && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete all ${staffList.length} staff records?`)) {
                  onDeleteAllStaff();
                }
              }}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-xs transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>All Delete ({staffList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff</span>
          <span className="text-xl font-black text-slate-900 tabular-nums">
            {staffList.length} employees
          </span>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Active On Duty</span>
          <span className="text-xl font-black text-emerald-950 tabular-nums">
            {staffList.filter((s) => s.accountStatus === 'active').length}
          </span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Total Monthly Payroll</span>
          <span className="text-xl font-black text-blue-950 tabular-nums">
            {formatRs(staffList.reduce((acc, s) => acc + (s.salary || 0), 0))}
          </span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-800 block">Cashiers & Sales</span>
          <span className="text-xl font-black text-amber-950 tabular-nums">
            {staffList.filter((s) => s.role === 'Cashier' || s.role === 'Sales Staff').length}
          </span>
        </div>
      </div>

      {/* Detail View vs Master List */}
      {selectedStaffId && selectedStaff ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <button
              onClick={() => setSelectedStaffId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <span>← Back to All Staff List</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSalaryPayAmount(selectedStaff.salary.toString());
                  setIsPaySalaryModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pay Salary (تنخواہ ادا کریں)</span>
              </button>
              <button
                onClick={() => handleOpenEdit(selectedStaff)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-sky-400 flex items-center justify-center text-xl font-black text-white">
                {selectedStaff.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-sky-300">
                  {selectedStaff.employeeId} • {selectedStaff.role}
                </span>
                <h3 className="text-xl font-black text-white">{selectedStaff.name}</h3>
                <p className="text-xs text-slate-300">
                  Phone: {selectedStaff.phone} • Shift: {selectedStaff.shift}
                </p>
              </div>
            </div>

            <div className="bg-white/10 border border-white/20 p-3 rounded-xl text-right">
              <span className="text-[10px] font-bold text-slate-300 uppercase block">Monthly Base Salary</span>
              <span className="text-2xl font-black text-emerald-400">
                Rs. {selectedStaff.salary.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Salary History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-800">Salary Payment History (تنخواہ کی ادائیگی کا ریکارڈ)</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Month</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!selectedStaff.salaryPayments || selectedStaff.salaryPayments.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No salary payments recorded for this employee yet.
                      </td>
                    </tr>
                  ) : (
                    selectedStaff.salaryPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-mono">{p.date}</td>
                        <td className="py-2.5 px-3 font-bold">{p.month}</td>
                        <td className="py-2.5 px-3 uppercase text-[10px]">{p.paymentMethod}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">
                          Rs. {p.amount.toFixed(0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Staff Master Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff by name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-sky-500"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              {filteredStaff.length} employees registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f8fafc] text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Employee ID</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Shift</th>
                  <th className="py-3 px-3 text-right">Salary</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-14 text-center text-slate-400">
                      <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No staff members found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click "+ Add Staff Member" above to register store staff and cashiers.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((st) => (
                    <tr
                      key={st.id}
                      onClick={() => setSelectedStaffId(st.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3.5 font-mono font-bold text-sky-700">
                        {st.employeeId}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{st.name}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                          {st.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{st.department}</td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">{st.phone}</td>
                      <td className="py-3 px-3 text-slate-600">{st.shift}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        Rs. {st.salary.toFixed(0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            st.accountStatus === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {st.accountStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStaffId(st.id);
                          }}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg text-xs font-bold"
                        >
                          View Profile 👉
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  {editingStaff ? 'ملازم کا پروفائل تبدیل کریں' : 'نیا ملازم شامل کریں (Add Staff Member)'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffMember} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Asad Ali"
                    className="w-full font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="WM-EMP-001"
                    className="w-full font-mono font-bold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role / عہدہ</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="Cashier">Cashier (کاؤنٹر کیشیئر)</option>
                    <option value="Manager">Store Manager (مینیجر)</option>
                    <option value="Sales Staff">Sales Staff (سیلزمین)</option>
                    <option value="Stock Keeper">Stock Keeper (اسٹاک انچارج)</option>
                    <option value="Security">Security Guard (سیکیورٹی)</option>
                    <option value="Cleaner">Cleaner / Helper</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shift / شفٹ</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  >
                    <option value="Morning">Morning Shift (صبح)</option>
                    <option value="Evening">Evening Shift (شام)</option>
                    <option value="Full Day">Full Day (مکمل دن)</option>
                    <option value="Night">Night Shift (رات)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full font-semibold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Monthly Salary (Rs.) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="25000"
                    className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street / Colony / City"
                  className="w-full font-medium px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-[#0284c7] hover:bg-sky-700 text-white rounded-xl shadow-sm"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Salary Modal */}
      {isPaySalaryModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Pay Staff Salary</h3>
              </div>
              <button
                onClick={() => setIsPaySalaryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl text-xs mb-3">
              <div>Employee: <strong>{selectedStaff.name}</strong></div>
              <div>Base Salary: <strong>Rs. {selectedStaff.salary.toFixed(0)}</strong></div>
            </div>

            <form onSubmit={handleRecordSalaryPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Month *</label>
                <input
                  type="text"
                  required
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  placeholder="October 2026"
                  className="w-full font-bold px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Amount Paid (Rs.) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={salaryPayAmount}
                  onChange={(e) => setSalaryPayAmount(e.target.value)}
                  className="w-full font-black text-sm px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaySalaryModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
