import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, ShieldCheck, Tag, Calendar, Eye, Send, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { useVersion } from '../../context/VersionContext';

export const UpdatesSub: React.FC = () => {
  const { refreshVersion, setVersionState } = useVersion();
  const [data, setData] = useState<{ currentVersion: string; releaseNotes: any[] }>({
    currentVersion: '1.0.0',
    releaseNotes: [],
  });
  const [loading, setLoading] = useState(true);

  // Quick Direct Version Editing State
  const [quickVersion, setQuickVersion] = useState('');
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);

  // Publish / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
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
        setQuickVersion(res.data.data.currentVersion);
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

  const handleQuickVersionSave = async () => {
    if (!quickVersion.trim()) return;
    setSavingVersion(true);
    try {
      const res = await api.put('/updates/version', { version: quickVersion.trim() });
      if (res.data.success) {
        setData((prev) => ({ ...prev, currentVersion: quickVersion.trim() }));
        setVersionState(quickVersion.trim());
        await refreshVersion();
        setIsEditingVersion(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update system version.');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingNoteId(null);
    setForm({
      version: `1.0.${data.releaseNotes.length + 1}`,
      title: '',
      description: '',
      updateType: 'NEW_FEATURE',
      visibility: 'ALL_USERS',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note: any) => {
    setEditingNoteId(note.id);
    setForm({
      version: note.version,
      title: note.title,
      description: note.description,
      updateType: note.updateType,
      visibility: note.visibility,
    });
    setIsModalOpen(true);
  };

  const handleDeleteNote = async (noteId: string, versionStr: string) => {
    if (!window.confirm(`Are you sure you want to delete release note v${versionStr}?`)) return;
    try {
      await api.delete(`/updates/release-notes/${noteId}`);
      await fetchUpdates();
      await refreshVersion();
    } catch (err) {
      alert('Failed to delete release note.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      if (editingNoteId) {
        await api.put(`/updates/release-notes/${editingNoteId}`, form);
      } else {
        await api.post('/updates/release-notes', form);
      }
      setIsModalOpen(false);
      await fetchUpdates();
      await refreshVersion();
    } catch (err) {
      alert(editingNoteId ? 'Failed to update release note.' : 'Failed to publish release note.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Updates & Application Versions</h2>
          <p className="text-slate-500">Publish release notes, manage system versions, and control role update visibility across website and portal</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Publish New Version Release Note
        </button>
      </div>

      {/* Current Active Version Card with Quick Edit */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-slate-900 to-slate-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl border border-blue-900/50">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-blue-300 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Active Platform Release Version
          </span>
          <div className="flex items-center gap-3 pt-1">
            {isEditingVersion ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickVersion}
                  onChange={(e) => setQuickVersion(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-blue-400 text-white font-mono text-xl font-black rounded-lg outline-none w-36"
                  placeholder="e.g. 2.0.0"
                  autoFocus
                />
                <button
                  onClick={handleQuickVersionSave}
                  disabled={savingVersion}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => {
                    setQuickVersion(data.currentVersion);
                    setIsEditingVersion(false);
                  }}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h3 className="text-3xl font-black text-white font-mono">
                  GFS Portal v{data.currentVersion}
                </h3>
                <button
                  onClick={() => setIsEditingVersion(true)}
                  className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Quick Change Version
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-300 pt-1">
            Central active version dynamically served across all portal dashboards, login/registration pages, and public website endpoints.
          </p>
        </div>

        <div className="p-3.5 bg-blue-600/20 rounded-2xl border border-blue-400/30 shrink-0">
          <RefreshCw className="h-8 w-8 text-blue-300" />
        </div>
      </div>

      {/* Release Notes Timeline & History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Version Release Notes & Changelog History</h3>
            <p className="text-[11px] text-slate-500">Manage, update, or delete feature update announcements across roles</p>
          </div>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-extrabold font-mono text-[11px] rounded-lg">
            Total Notes: {data.releaseNotes.length}
          </span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="py-8 text-center text-slate-500">Loading release notes...</p>
          ) : data.releaseNotes.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No release notes published yet.</p>
          ) : (
            data.releaseNotes.map((note) => (
              <div key={note.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 space-y-2 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full font-mono font-black text-xs bg-blue-600 text-white">
                      v{note.version}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{note.title}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold uppercase">
                      {note.updateType.replace(/_/g, ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold uppercase">
                      Visibility: {note.visibility.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400">
                      {new Date(note.releaseDate).toLocaleDateString()}
                    </span>

                    {/* Action buttons for Edit & Delete */}
                    <button
                      onClick={() => handleOpenEditModal(note)}
                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit Release Note"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id, note.version)}
                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Delete Release Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed pt-1 whitespace-pre-line">{note.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Release Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNoteId ? 'Edit System Release Note' : 'Publish System Release Note'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Version Number</label>
              <input
                type="text"
                required
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                className="w-full p-2.5 border rounded-lg font-mono font-bold"
                placeholder="e.g. 1.0.1"
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
              <Send className="h-3.5 w-3.5" />
              <span>{editingNoteId ? 'Update Release Note' : 'Publish Release Note'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UpdatesSub;
