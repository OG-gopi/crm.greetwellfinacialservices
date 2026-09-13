import React, { useState, useEffect } from 'react';
import { Upload, FolderOpen, FileText, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import { Application, DocumentItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { LazyLoadTrigger } from '../../components/common/LazyLoadTrigger';
import { SearchableSelect } from '../../components/common/SearchableSelect';

export const CustomerDocuments: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedDocTypeId, setSelectedDocTypeId] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const getPageHeader = () => {
    if (user?.role === 'LOAN_AGENT') {
      return {
        title: 'Loan Verification Documents',
        desc: 'Manage loan agreement files, bank statements, and income verification proofs',
      };
    }
    if (user?.role === 'INSURANCE_AGENT') {
      return {
        title: 'Insurance Policy Documents',
        desc: 'Manage policy copies, vehicle RC records, and medical verification documents',
      };
    }
    if (user?.role === 'INVESTMENT_AGENT') {
      return {
        title: 'Investment & KYC Documents',
        desc: 'Manage investor KYC documents, bank passbooks, and scheme agreement records',
      };
    }
    return {
      title: 'My Uploaded Verification Documents',
      desc: 'Upload identity verification files, paystubs, and bank statements for active applications',
    };
  };

  const headerInfo = getPageHeader();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, dtRes] = await Promise.all([
        api.get('/applications'),
        api.get('/settings/doc-types'),
      ]);
      setApplications(appRes.data.data || []);
      setDocTypes(dtRes.data.data || []);
      if (appRes.data.data?.length > 0) {
        setSelectedAppId(appRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedAppId) {
      alert('Please select an application and file.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', selectedAppId);
      if (selectedDocTypeId) formData.append('documentTypeId', selectedDocTypeId);
      formData.append('title', docTitle || file.name);

      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setIsUploadModalOpen(false);
        setFile(null);
        setDocTitle('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const allUploadedDocs: DocumentItem[] = applications.flatMap((a) => a.documents || []);
  const [visibleCount, setVisibleCount] = useState(20);
  const visibleDocs = allUploadedDocs.slice(0, visibleCount);
  const hasMore = visibleCount < allUploadedDocs.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 20);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{headerInfo.title}</h2>
          <p className="text-xs text-slate-500">{headerInfo.desc}</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 self-start"
        >
          <Upload className="h-4 w-4" /> Upload Verification Document
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <th className="py-3.5 px-4">Document Title</th>
                <th className="py-3.5 px-4">Application ID</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Verification Status</th>
                <th className="py-3.5 px-4">Upload Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Loading documents...</td>
                </tr>
              ) : visibleDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No documents uploaded yet.</td>
                </tr>
              ) : (
                visibleDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{doc.title}</td>
                    <td className="py-3.5 px-4 font-extrabold text-blue-700">{doc.applicationId}</td>
                    <td className="py-3.5 px-4 text-slate-600">{doc.documentType?.name || 'General'}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={doc.status} />
                      {doc.rejectionReason && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{doc.rejectionReason}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={`${api.defaults.baseURL?.replace('/api', '')}${doc.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 border rounded hover:bg-slate-100 inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> View Document
                      </a>
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
          isLoading={false}
          totalItems={allUploadedDocs.length}
          endMessage="You're all caught up."
        />
      </div>

      {/* Upload Document Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Required Document">
        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Application</label>
            <SearchableSelect
              options={applications.map((app) => ({
                value: app.id,
                label: `${app.id} (${app.type} - ${app.purpose})`,
              }))}
              value={selectedAppId}
              onChange={setSelectedAppId}
              placeholder="Select target application..."
              searchPlaceholder="Search application..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Document Category</label>
            <SearchableSelect
              options={[
                { value: '', label: '-- General Document --' },
                ...docTypes.map((dt) => ({ value: dt.id, label: dt.name })),
              ]}
              value={selectedDocTypeId}
              onChange={setSelectedDocTypeId}
              placeholder="Select document category..."
              searchPlaceholder="Search category..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Document Title</label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="e.g. Passport_Copy_John_Doe.pdf"
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Select File (PDF, PNG, JPG up to 10MB)</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full p-2 border rounded-lg bg-slate-50 text-slate-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 border rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 flex items-center gap-1"
            >
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
