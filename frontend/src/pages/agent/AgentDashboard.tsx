import React, { useState, useEffect } from 'react';
import { Briefcase, FileText, CheckSquare, Clock, ShieldCheck, Activity } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

import DashboardFooter from '../../components/common/DashboardFooter';

export const AgentDashboard: React.FC = () => {

  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load agent dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const { metrics, recentActivities } = data || {};
  const roleName = user?.role.replace(/_/g, ' ') || 'Agent';

  const getApplicationsPath = () => {
    if (user?.role === 'LOAN_AGENT') return '/loan-agent/applications';
    if (user?.role === 'INSURANCE_AGENT') return '/insurance-agent/applications';
    return '/investment-agent/applications';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome, {user?.firstName} {user?.lastName}</h2>
          <p className="mt-1 text-sm text-blue-200">
            {roleName} Desk — Review assigned applications, manage customer requirements, and transition statuses.
          </p>
        </div>
        <Link
          to={getApplicationsPath()}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-colors shadow-lg flex items-center gap-1.5 self-start"
        >
          <FileText className="h-4 w-4" /> View My Assigned Applications
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Applications</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{metrics?.assignedApps || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Processing</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{metrics?.pendingApps || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Docs Requiring Review</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">{metrics?.pendingDocs || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Tasks</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics?.pendingTasks || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckSquare className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
          <Activity className="h-4 w-4 text-blue-600" /> My Recent Activity History
        </h3>
        <div className="mt-4 space-y-3">
          {recentActivities?.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No recent activities recorded.</p>
          ) : (
            recentActivities?.map((activity: any) => (
              <div key={activity.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 uppercase">{activity.action}</span>
                  <p className="text-slate-600 mt-0.5">{activity.description}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
};

