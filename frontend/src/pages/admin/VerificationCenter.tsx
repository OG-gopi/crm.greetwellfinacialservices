import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, FileText, ExternalLink, MessageSquare, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';

export const VerificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [verificationData, setVerificationData] = useState<any>({ documents: [], applications: [] });
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<{ type: 'DOC' | 'APP'; item: any } | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/settings/verification-center?status=${activeTab}`);
      if (res.data.success) {
        setVerificationData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load verification data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleVerifyAction = async (action: 'VERIFY' | 'REJECT' | 'REQUEST_CHANGES') => {
    if (!selectedItem) return;
    setSubmitting(true);

    try {
      if (selectedItem.type === 'DOC') {
        const docStatus = action === 'VERIFY' ? 'VERIFIED' : action === 'REJECT' ? 'REJECTED' : 'REPLACEMENT_REQUIRED';
        await api.put(`/documents/${selectedItem.item.id}/verify`, {
          status: docStatus,
          rejectionReason: comment,
        });
      } else {
        await api.post(`/applications/${selectedItem.item.id}/verify`, {
          action,
          comment,
        });
      }

      setSelectedItem(null);
      setComment('');
      fetchData();
    } catch (err: any) {
      alert('Verification action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Data Verification Center</h2>
          <p className="text-xs text-slate-500">Review, verify, or reject submitted documents, customer data, and applications</p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
          {(['PENDING', 'VERIFIED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'PENDING' ? 'Pending Review' : tab === 'VERIFIED' ? 'Verified Items' : 'Rejected Items'}
            </button>
          ))}
        </div>
      </div>

      {/* Verification Items List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between border-b pb-3">
            <span>Documents ({verificationData.documents?.length || 0})</span>
            <span className="text-[11px] text-slate-500 font-normal">Customer File Uploads</span>
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-center py-6 text-xs text-slate-500">Loading documents...</p>
            ) : verificationData.documents?.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">No documents in {activeTab.toLowerCase()} status.</p>
            ) : (
              verificationData.documents?.map((doc: any) => (
                <div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{doc.title}</p>
                      <p className="text-[11px] text-slate-500">App ID: {doc.application?.id || doc.applicationId}</p>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <p>Uploaded By: <strong>{doc.uploadedByUser?.firstName} {doc.uploadedByUser?.lastName}</strong> ({doc.uploadedByUser?.email})</p>
                    <p>File Size: {(doc.fileSize / 1024).toFixed(1)} KB</p>
                  </div>

                  {doc.rejectionReason && (
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                      <strong>Rejection Reason:</strong> {doc.rejectionReason}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <a
                      href={`${api.defaults.baseURL?.replace('/api', '')}${doc.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Inspect Document File
                    </a>

                    {activeTab === 'PENDING' && (
                      <button
                        onClick={() => setSelectedItem({ type: 'DOC', item: doc })}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                      >
                        Verify / Reject
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Applications Verification Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between border-b pb-3">
            <span>Applications ({verificationData.applications?.length || 0})</span>
            <span className="text-[11px] text-slate-500 font-normal">Workflow Validation</span>
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-center py-6 text-xs text-slate-500">Loading applications...</p>
            ) : verificationData.applications?.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-500">No applications in {activeTab.toLowerCase()} status.</p>
            ) : (
              verificationData.applications?.map((app: any) => (
                <div key={app.id} className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-extrabold text-blue-700">{app.id}</p>
                      <p className="text-[11px] text-slate-500">{app.type} Application - {app.purpose}</p>
                    </div>
                    <StatusBadge status={app.verificationStatus || app.status} />
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <p>Customer: <strong>{app.customer?.firstName} {app.customer?.lastName}</strong> ({app.customer?.email})</p>
                    <p>Amount: {app.amount ? `$${app.amount.toLocaleString()}` : 'N/A'}</p>
                  </div>

                  {app.verificationComment && (
                    <div className="p-2 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[11px]">
                      <strong>Verification Comment:</strong> {app.verificationComment}
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-2 border-t border-slate-200">
                    {activeTab === 'PENDING' && (
                      <button
                        onClick={() => setSelectedItem({ type: 'APP', item: app })}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                      >
                        Perform Verification
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Verification Decision Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`Audit Verification Decision - ${selectedItem?.item?.title || selectedItem?.item?.id}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Reviewing item: <strong>{selectedItem?.item?.title || selectedItem?.item?.id}</strong>
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Verification Comments / Rejection Reason (Required if rejecting):
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-2.5 border rounded-lg bg-slate-50 text-xs focus:ring-2 focus:ring-blue-500"
              placeholder="Provide verification feedback or explicit rejection reasons..."
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t">
            <button
              onClick={() => handleVerifyAction('VERIFY')}
              disabled={submitting}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" /> Approve / Verify
            </button>
            <button
              onClick={() => handleVerifyAction('REQUEST_CHANGES')}
              disabled={submitting}
              className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center justify-center gap-1"
            >
              <AlertCircle className="h-4 w-4" /> Request Changes
            </button>
            <button
              onClick={() => handleVerifyAction('REJECT')}
              disabled={submitting}
              className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center justify-center gap-1"
            >
              <XCircle className="h-4 w-4" /> Reject Item
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
