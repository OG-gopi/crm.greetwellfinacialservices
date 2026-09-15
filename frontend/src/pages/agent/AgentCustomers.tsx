import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Mail, Phone, ShieldCheck, Settings, Check, X, PlusCircle } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { InviteCustomerModal } from '../../components/common/InviteCustomerModal';
import { LazyLoadTrigger } from '../../components/common/LazyLoadTrigger';
import { Modal } from '../../components/common/Modal';

export const AgentCustomers: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Manage Services Modal State for Super Admin
  const [selectedCustForServices, setSelectedCustForServices] = useState<User | null>(null);
  const [modalServices, setModalServices] = useState<string[]>([]);
  const [savingServices, setSavingServices] = useState(false);
  const [serviceModalError, setServiceModalError] = useState('');

  const handleCreateAppForCustomer = (cust: User) => {
    const targetId = cust.customerIdCode || cust.id;
    if (currentUser?.role === 'SUPER_ADMIN') {
      navigate(`/superadmin/applications/create?customerId=${targetId}`);
    } else if (currentUser?.role === 'LOAN_AGENT') {
      navigate(`/loan-agent/applications/create?customerId=${targetId}&type=LOAN`);
    } else if (currentUser?.role === 'INSURANCE_AGENT') {
      navigate(`/insurance-agent/applications/create?customerId=${targetId}&type=INSURANCE`);
    } else if (currentUser?.role === 'INVESTMENT_AGENT') {
      navigate(`/investment-agent/applications/create?customerId=${targetId}&type=INVESTMENT`);
    } else {
      navigate(`/customer/applications/create?customerId=${targetId}`);
    }
  };

  const fetchCustomers = async (pageToFetch = 1, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/users?role=CUSTOMER&page=${pageToFetch}&limit=15`);
      if (res.data.success) {
        const fetchedList = res.data.data || [];
        if (isInitial) {
          setCustomers(fetchedList);
        } else {
          setCustomers((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const newUnique = fetchedList.filter((c: User) => !existingIds.has(c.id));
            return [...prev, ...newUnique];
          });
        }
        if (res.data.pagination) {
          setHasMore(pageToFetch < (res.data.pagination.totalPages || 1));
        } else {
          setHasMore(fetchedList.length === 15);
        }
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCustomers(1, true);
  }, []);

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCustomers(nextPage, false);
    }
  };

  const openManageServices = (cust: User) => {
    setSelectedCustForServices(cust);
    const existing = Array.isArray(cust.serviceTypes)
      ? cust.serviceTypes.map((s) => s.toUpperCase())
      : ['LOANS'];
    setModalServices(existing);
    setServiceModalError('');
  };

  const toggleModalService = (srv: string) => {
    if (modalServices.includes(srv)) {
      if (modalServices.length > 1) {
        setModalServices(modalServices.filter((s) => s !== srv));
      }
    } else {
      setModalServices([...modalServices, srv]);
    }
  };

  const handleSaveServices = async () => {
    if (!selectedCustForServices) return;
    setSavingServices(true);
    setServiceModalError('');
    try {
      const res = await api.put(`/users/${selectedCustForServices.id}/services`, {
        serviceTypes: modalServices,
      });
      if (res.data.success) {
        setSelectedCustForServices(null);
        fetchCustomers();
      }
    } catch (err: any) {
      setServiceModalError(err.response?.data?.message || 'Failed to update customer services.');
    } finally {
      setSavingServices(false);
    }
  };

  return (
    <div className="space-y-6 font-['Inter',sans-serif]">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentUser?.role === 'SUPER_ADMIN' ? 'All System Customers' : 'Assigned Customers'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">Customer directory, profiles, and customer invitation engine</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 self-start transition-all cursor-pointer"
        >
          <UserPlus className="h-4 w-4" /> Invite Customer
        </button>
      </div>

      {/* CUSTOMERS TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-extrabold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-5">CUSTOMER ID</th>
                <th className="py-4 px-5">CUSTOMER NAME</th>
                <th className="py-4 px-5">EMAIL</th>
                <th className="py-4 px-5">PHONE</th>
                <th className="py-4 px-5">SERVICE TYPES</th>
                <th className="py-4 px-5">STATUS</th>
                <th className="py-4 px-5">JOINED DATE</th>
                <th className="py-4 px-5 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    No customers found. Click "Invite Customer" to onboard your first client.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      {cust.customerIdCode ? (
                        <span className="font-bold text-[#10233F] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg text-[11px]">
                          {cust.customerIdCode}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900 text-xs sm:text-sm">
                      {cust.firstName} {cust.lastName}
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-normal">{cust.email}</td>
                    <td className="py-4 px-5 text-slate-600 font-semibold">{cust.phone || 'N/A'}</td>
                    <td className="py-4 px-5">
                      {cust.serviceTypes && cust.serviceTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cust.serviceTypes.map((s) => (
                            <span key={s} className="px-2.5 py-0.5 rounded-full bg-blue-100/90 text-blue-700 font-bold text-[10px] uppercase">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          cust.status === 'ACTIVE'
                            ? 'bg-emerald-100/90 text-emerald-700 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-600 border border-slate-200/80'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cust.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {cust.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-500 font-medium">
                      {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-5 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleCreateAppForCustomer(cust)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> + Create App
                      </button>
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <button
                          onClick={() => openManageServices(cust)}
                          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-500" /> Services
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <LazyLoadTrigger
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoading={loadingMore}
          totalItems={customers.length}
          endMessage="You're all caught up."
        />
      </div>

      {/* INVITE CUSTOMER MODAL */}
      <InviteCustomerModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={fetchCustomers}
      />

      {/* MANAGE SERVICES MODAL */}
      {selectedCustForServices && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustForServices(null)}
          title={`Manage Services: ${selectedCustForServices.firstName} ${selectedCustForServices.lastName}`}
        >
          <div className="space-y-4 text-xs font-['Inter',sans-serif]">
            <p className="text-slate-600 font-medium">
              Select enabled CRM financial services for <strong className="text-slate-900">{selectedCustForServices.email}</strong>:
            </p>

            {serviceModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-semibold text-xs">
                {serviceModalError}
              </div>
            )}

            <div className="space-y-2">
              {[
                { id: 'LOANS', label: 'Loans Services', desc: 'Personal, Home, Business,LAP, Vehicle, Education Loans' },
                { id: 'INSURANCE', label: 'Insurance Services', desc: 'Health, Life, Vehicle, Property & Commercial Insurance' },
                { id: 'INVESTMENT', label: 'Investment Services', desc: 'Chit Investments, Mutual Funds, Stocks & Fixed Deposits' },
              ].map((srv) => {
                const isSelected = modalServices.includes(srv.id);
                return (
                  <div
                    key={srv.id}
                    onClick={() => toggleModalService(srv.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{srv.label}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{srv.desc}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCustForServices(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveServices}
                disabled={savingServices}
                className="px-5 py-2 bg-blue-600 text-white font-extrabold rounded-xl hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                {savingServices ? 'Saving...' : 'Save Allowed Services'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
