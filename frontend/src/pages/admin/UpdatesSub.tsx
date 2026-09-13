import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, ShieldCheck, Tag, Calendar, Eye, Send } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { SearchableSelect } from '../../components/common/SearchableSelect';

export const UpdatesSub: React.FC = () => {
  const [data, setData] = useState<{ currentVersion: string; releaseNotes: any[] }>({
    currentVersion: '1.0.0',
    releaseNotes: [],
  });
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    version: '',
    title: '',
    description: '',
    updateType: 'NEW_FEATURE',
    visibility: 'ALL_USERS',
  });
  const [publishing, setPublishing] = useState(false);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/updates/release-notes');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load updates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      await api.post('/updates/release-notes', form);
      setIsModalOpen(false);
      fetchUpdates();
    } catch (err) {
      alert('Failed to publish release note.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Updates & Application Versions</h2>
          <p className="text-slate-500">Publish release notes, manage system versions, and control role update visibility</p>
        </div>
        <button
          onClick={() => {
            setForm({
              version: `1.0.${data.releaseNotes.length + 1}`,
              title: '',
              description: '',
              updateType: 'NEW_FEATURE',
              visibility: 'ALL_USERS',
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 self-start"
        >
          <Plus className="h-4 w-4" /> Publish New Version Release Note
        </button>
      </div>

      {/* Current Version Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between shadow-xl">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-blue-300 tracking-wider">Active Platform Release</span>
          <h3 className="text-3xl font-black text-white mt-0.5">Version {data.currentVersion}</h3>
          <p className="text-xs text-slate-300 mt-1">Central configuration version served across all portal dashboards & login pages.</p>
        </div>
        <div className="p-3 bg-blue-600/30 rounded-2xl border border-blue-400/30">
          <RefreshCw className="h-8 w-8 text-blue-300" />
        </div>
      </div>

      {/* Release Notes Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-extrabold text-slate-900 text-sm border-b pb-3">Version Release Notes History</h3>

        <div className="space-y-4">
          {loading ? (
            <p className="py-6 text-center text-slate-500">Loading release notes...</p>
          ) : data.releaseNotes.length === 0 ? (
            <p className="py-6 text-center text-slate-500">No release notes published yet.</p>
          ) : (
            data.releaseNotes.map((note) => (
              <div key={note.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full font-mono font-black text-xs bg-blue-600 text-white">
                      v{note.version}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{note.title}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold uppercase">
                      {note.updateType.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold uppercase">
                      Visibility: {note.visibility.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400">
                      {new Date(note.releaseDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed pt-1">{note.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Release Note Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publish System Release Note">
        <form onSubmit={handlePublish} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Version Number</label>
              <input
                type="text"
                required
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full p-2.5 border rounded-lg font-mono font-bold"
                placeholder="1.0.1"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Update Category</label>
              <SearchableSelect
                options={[
                  { value: 'NEW_FEATURE', label: 'NEW FEATURE' },
                  { value: 'IMPROVEMENT', label: 'IMPROVEMENT' },
                  { value: 'BUG_FIX', label: 'BUG FIX' },
                  { value: 'SECURITY_UPDATE', label: 'SECURITY UPDATE' },
                  { value: 'MAINTENANCE', label: 'MAINTENANCE' },
                ]}
                value={form.updateType}
                onChange={(val) => setForm({ ...form, updateType: val })}
                placeholder="Select category..."
                searchPlaceholder="Search category..."
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Update Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full p-2.5 border rounded-lg font-bold"
              placeholder="e.g. Method-Level API Authorization & Performance Improvements"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Role Visibility Access</label>
            <SearchableSelect
              options={[
                { value: 'ALL_USERS', label: 'ALL PORTAL USERS (Super Admin, Agents, Customers)' },
                { value: 'AGENTS_AND_CUSTOMERS', label: 'AGENTS & CUSTOMERS ONLY' },
                { value: 'SUPER_ADMIN_ONLY', label: 'SUPER ADMIN ONLY (Internal Release)' },
              ]}
              value={form.visibility}
              onChange={(val) => setForm({ ...form, visibility: val })}
              placeholder="Select visibility..."
              searchPlaceholder="Search visibility..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Release Note Description</label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-2.5 border rounded-lg"
              placeholder="Detail the improvements, fixes, or new features in this release..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={publishing}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 flex items-center gap-1"
            >
              <Send className="h-3.5 w-3.5" /> Publish Release Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
