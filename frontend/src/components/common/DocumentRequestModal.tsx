import React, { useState } from 'react';
import { FileText, Calendar, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { api } from '../../services/api';

interface DocumentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  customerName?: string;
  onRequestSuccess?: () => void;
}

const COMMON_DOCUMENT_TYPES = [
  'Passport Copy',
  'Bank Statement (Last 6 Months)',
  'Salary Slips (Last 3 Months)',
  'Aadhaar / Identity Proof',
  'PAN Card Copy',
  'Address Proof (Utility Bill / Rent Agreement)',
  'Income Tax Returns (ITR / Form 16)',
  'Property / Collateral Proof',
  'Insurance Policy Documents',
  'Investment Statement',
  'Other / Custom Document',
];

export const DocumentRequestModal: React.FC<DocumentRequestModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  customerName,
  onRequestSuccess,
}) => {
  const [selectedType, setSelectedType] = useState(COMMON_DOCUMENT_TYPES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = selectedType === 'Other / Custom Document' ? customTitle.trim() : selectedType;

    if (!finalTitle) {
      setError('Please specify the document title/type required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/applications/${applicationId}/requests`, {
        title: finalTitle,
        description: description.trim(),
        isRequired,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });

      if (res.data.success) {
        if (onRequestSuccess) onRequestSuccess();
        onClose();
      } else {
        setError(res.data.message || 'Failed to submit document request.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Server error occurred while sending document request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Request Document Proof
              </h3>
              <p className="text-xs text-slate-400">
                Application: <span className="font-mono text-amber-400 font-semibold">{applicationId}</span>
                {customerName ? ` • ${customerName}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Type Select */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Document Type / Category
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-medium"
            >
              {COMMON_DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Document Name if "Other" selected */}
          {selectedType === 'Other / Custom Document' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Specify Custom Document Name
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. GST Registration Certificate"
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-medium"
              />
            </div>
          )}

          {/* Instructions / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Instructions / Requirements Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Please upload self-attested copies of bank statement for the last 6 months in PDF format."
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-medium resize-none"
            />
          </div>

          {/* Due Date & Is Required Option */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Requested Due Date (Optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs font-semibold text-slate-300">
                  Required Document
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending Request...' : 'Submit Document Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default DocumentRequestModal;
