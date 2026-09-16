import React, { useState, useEffect } from 'react';
import { Settings, Mail, Database, Layers, CheckCircle2, Shield, Play } from 'lucide-react';
import { api } from '../../services/api';
import { GFSLogo } from '../../components/common/GFSLogo';
import { EmailLogs } from './EmailLogs';

export const SystemSub: React.FC<{ subPage?: string }> = ({ subPage = 'configurations' }) => {
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [emRes, fRes, bRes] = await Promise.all([
        api.get('/system/email-templates'),
        api.get('/system/fields'),
        api.get('/system/backups'),
      ]);
      setEmailTemplates(emRes.data.data || []);
      setCustomFields(fRes.data.data || []);
      setBackups(bRes.data.data || []);
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subPage]);

  const handleTriggerBackup = async () => {
    try {
      await api.post('/system/backups/trigger');
      fetchData();
      alert('Database backup successfully generated.');
    } catch (err) {
      alert('Backup creation failed.');
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Management</h2>
          <p className="text-slate-500">Configure email templates, dynamic custom fields, integrations, and database backups</p>
        </div>

        {subPage === 'backup' && (
          <button
            onClick={handleTriggerBackup}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 self-start"
          >
            <Play className="h-4 w-4" /> Trigger Database Backup Now
          </button>
        )}
      </div>

      {subPage === 'backup' ? (
        <div className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-sm border-b pb-3">Database Backup History</h3>
          <div className="space-y-2">
            {backups.length === 0 ? (
              <p className="py-6 text-center text-slate-500">No backup records generated yet.</p>
            ) : (
              backups.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl border bg-slate-50 flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold text-slate-900">{b.fileName}</p>
                    <p className="text-[10px] text-slate-500">Size: {(b.fileSize / 1024).toFixed(1)} KB • {new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    {b.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : subPage === 'email-templates' || subPage === 'email-logs' ? (
        <EmailLogs />
      ) : (
        <div className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-sm border-b pb-3">Global Portal Configurations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-bold text-slate-900">Portal Branding</h4>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">Official Logo Active</span>
              </div>
              <div className="p-3 bg-[#091526] rounded-xl flex items-center justify-center">
                <GFSLogo size="lg" variant="dark" />
              </div>
              <div className="space-y-1 pt-1">
                <p>Company Name: <strong>Greetwell Financial Services</strong></p>
                <p>Short Name: <strong>GFS</strong></p>
                <p>Tagline: <strong>EMPOWERING DREAMS, SECURING FUTURES</strong></p>
                <p>Services: <strong>LOANS | INSURANCE | INVESTMENTS</strong></p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border space-y-2">
              <h4 className="font-bold text-slate-900">Financial Parameters</h4>
              <p>Default Currency: <strong>USD ($)</strong></p>
              <p>Default Language: <strong>English (US)</strong></p>
              <p>Session Timeout: <strong>60 Minutes</strong></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
