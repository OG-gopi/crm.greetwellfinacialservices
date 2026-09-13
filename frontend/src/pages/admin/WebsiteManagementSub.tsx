import React, { useState, useEffect } from 'react';
import {
  Globe,
  Save,
  Send,
  RotateCcw,
  Phone,
  Mail,
  MapPin,
  Clock,
  Share2,
  Image as ImageIcon,
  Eye,
  History,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Tablet,
  Smartphone,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  X,
  Filter,
  Tag,
  ZoomIn,
  Edit3,
  Search,
  Award,
  HeartHandshake,
  User,
  AlertTriangle,
  Building2,
  Check
} from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/common/Modal';
import { SearchableSelect } from '../../components/common/SearchableSelect';
import { useToast } from '../../context/ToastContext';

interface WebsiteManagementSubProps {
  subPage?: 'content' | 'contact' | 'social' | 'media' | 'preview' | 'history';
}

const SECTION_OPTIONS = [
  'ALL',
  'CSR Activities',
  'Recognition',
  'Hero Banner',
  'Company Logo',
  'About Us',
  'Loans',
  'Insurance',
  'Investments',
  'Contact Us',
  'Footer',
  'Custom Section'
];

export const WebsiteManagementSub: React.FC<WebsiteManagementSubProps> = ({ subPage = 'content' }) => {
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<'content' | 'contact' | 'social' | 'media' | 'preview' | 'history'>(subPage);

  // Unsaved changes tracking
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTab, setPendingTab] = useState<'content' | 'contact' | 'social' | 'media' | 'preview' | 'history' | null>(null);

  useEffect(() => {
    if (subPage && subPage !== activeTab) {
      if (isDirty) {
        setPendingTab(subPage);
        setShowUnsavedModal(true);
      } else {
        setActiveTab(subPage);
      }
    }
  }, [subPage]);

  const handleTabChange = (targetTab: 'content' | 'contact' | 'social' | 'media' | 'preview' | 'history') => {
    if (targetTab === activeTab) return;
    if (isDirty) {
      setPendingTab(targetTab);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(targetTab);
    }
  };

  const confirmLeaveWithoutSaving = () => {
    setIsDirty(false);
    setShowUnsavedModal(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    fetchData(); // Reload clean data
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSection, setSavingSection] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const [hasUnpublishedDrafts, setHasUnpublishedDrafts] = useState(false);
  const [lastUpdatedInfo, setLastUpdatedInfo] = useState<any | null>(null);
  const [contents, setContents] = useState<any[]>([]);
  
  // Pre-fill real GFS details into initial contact state
  const [contacts, setContacts] = useState<any[]>([
    { key: 'primary_phone', title: 'Primary Phone', draftValue: '+91 91211 47777', publishedValue: '+91 91211 47777', isActive: true, displayOrder: 1 },
    { key: 'whatsapp', title: 'WhatsApp Number', draftValue: '+91 91211 47777', publishedValue: '+91 91211 47777', isActive: true, displayOrder: 2 },
    { key: 'email_general', title: 'General Enquiries Email', draftValue: 'gfsgreetwell@gmail.com', publishedValue: 'gfsgreetwell@gmail.com', isActive: true, displayOrder: 3 },
    { key: 'email_support', title: 'Customer Support Email', draftValue: 'gfsgreetwell@gmail.com', publishedValue: 'gfsgreetwell@gmail.com', isActive: true, displayOrder: 4 },
    { key: 'office_address', title: 'Corporate Headquarters', draftValue: 'PNO 71, Hno 1-36/1/2/6/A/P-71, Road No 6, Jawahar Colony, Chandanagar, Near Yelamma Temple, 500050', publishedValue: 'PNO 71, Hno 1-36/1/2/6/A/P-71, Road No 6, Jawahar Colony, Chandanagar, Near Yelamma Temple, 500050', isActive: true, displayOrder: 5 },
    { key: 'business_hours', title: 'Business Operating Hours', draftValue: 'Mon - Sat: 9:30 AM - 6:30 PM (Sun Closed)', publishedValue: 'Mon - Sat: 9:30 AM - 6:30 PM (Sun Closed)', isActive: true, displayOrder: 6 }
  ]);

  // Pre-fill real GFS social accounts into initial state
  const [socials, setSocials] = useState<any[]>([
    { id: 'soc_1', platform: 'WhatsApp', url: 'https://wa.me/919121147777', draftUrl: 'https://wa.me/919121147777', isActive: true, draftIsActive: true, displayOrder: 1, icon: 'MessageCircle' },
    { id: 'soc_2', platform: 'Facebook', url: 'https://facebook.com/greetwellfs', draftUrl: 'https://facebook.com/greetwellfs', isActive: true, draftIsActive: true, displayOrder: 2, icon: 'Facebook' },
    { id: 'soc_3', platform: 'Instagram', url: 'https://instagram.com/greetwellfs', draftUrl: 'https://instagram.com/greetwellfs', isActive: true, draftIsActive: true, displayOrder: 3, icon: 'Instagram' },
    { id: 'soc_4', platform: 'YouTube', url: 'https://youtube.com/@greetwellfs', draftUrl: 'https://youtube.com/@greetwellfs', isActive: true, draftIsActive: true, displayOrder: 4, icon: 'Youtube' }
  ]);

  const [media, setMedia] = useState<any[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  // Media Tab Filters & Search
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showAddSocialModal, setShowAddSocialModal] = useState(false);

  const [lightboxItem, setLightboxItem] = useState<any | null>(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState<any | null>(null);

  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadSection, setUploadSection] = useState('CSR Activities');
  const [uploadCategory, setUploadCategory] = useState('CSR ACTIVITIES');
  const [uploadDisplayType, setUploadDisplayType] = useState<'CARD' | 'BANNER'>('CARD');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>('');
  const [uploadUrlInput, setUploadUrlInput] = useState<string>('');
  const [isSubmittingMedia, setIsSubmittingMedia] = useState(false);

  // Edit Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSection, setEditSection] = useState('CSR Activities');
  const [editCategory, setEditCategory] = useState('');
  const [editDisplayType, setEditDisplayType] = useState<'CARD' | 'BANNER'>('CARD');

  // Add Contact Form State
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactKey, setNewContactKey] = useState('');
  const [newContactVal, setNewContactVal] = useState('');

  // Add Social Form State
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  // Preview state
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'draft' | 'published'>('draft');

  // Broken images tracker
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const validateIndianPhone = (phone: string): boolean => {
    if (!phone || phone.trim() === '') return true;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 12;
  };

  const isValidUrl = (url: string): boolean => {
    if (!url || url.trim() === '') return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/website/admin');
      if (res.data.success) {
        setHasUnpublishedDrafts(res.data.data.hasUnpublishedDrafts);
        setLastUpdatedInfo(res.data.data.lastUpdated || null);
        if (res.data.data.contents && res.data.data.contents.length > 0) {
          setContents(res.data.data.contents);
        }
        if (res.data.data.contacts && res.data.data.contacts.length > 0) {
          setContacts(res.data.data.contacts);
        }
        if (res.data.data.socials && res.data.data.socials.length > 0) {
          setSocials(res.data.data.socials);
        }
        if (res.data.data.media) {
          setMedia(res.data.data.media);
        }
        setIsDirty(false);
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Unable to load website settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/website/admin/history');
      if (res.data.success) {
        setHistoryLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch history logs:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHistory();
  }, []);

  const getMediaUrl = (url?: string) => {
    if (!url || !url.trim()) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `/uploads/media${url}`;
    }
    return `/uploads/media/${url}`;
  };

  // Form Field Handlers with dirty tracking
  const handleContentChange = (key: string, value: string) => {
    setIsDirty(true);
    setContents((prev) =>
      prev.map((c) => (c.key === key ? { ...c, draftValue: value } : c))
    );
  };

  const handleContactChange = (key: string, field: 'draftValue' | 'isActive', value: any) => {
    setIsDirty(true);
    setContacts((prev) =>
      prev.map((c) => (c.key === key ? { ...c, [field]: value } : c))
    );
  };

  const handleSocialChange = (id: string, field: 'draftUrl' | 'draftIsActive', value: any) => {
    setIsDirty(true);
    setSocials((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  // Section-Level Save Handlers
  const handleSaveContentSection = async () => {
    try {
      setSavingSection(true);
      const res = await api.post('/website/admin/draft', { contents });
      if (res.data.success) {
        showSuccess('Website Content saved successfully to database.');
        setIsDirty(false);
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Unable to save website content.');
    } finally {
      setSavingSection(false);
    }
  };

  const handleSaveContactSection = async () => {
    for (const item of contacts) {
      if (item.key && (item.key.includes('phone') || item.key === 'toll_free' || item.key === 'whatsapp')) {
        if (item.draftValue && !validateIndianPhone(item.draftValue)) {
          showError(`Invalid Indian phone number for '${item.title || item.key}'. Must contain 10 to 12 digits.`);
          return;
        }
      }
    }

    try {
      setSavingSection(true);
      const res = await api.post('/website/admin/draft', { contacts });
      if (res.data.success) {
        showSuccess('Contact Information saved successfully.');
        setIsDirty(false);
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Unable to save contact details.');
    } finally {
      setSavingSection(false);
    }
  };

  const handleSaveSocialSection = async () => {
    for (const item of socials) {
      const url = item.draftUrl !== undefined ? item.draftUrl : item.url;
      if (url && url.trim() !== '' && !isValidUrl(url)) {
        showError(`Invalid URL format for ${item.platform}. Must start with http:// or https://`);
        return;
      }
    }

    try {
      setSavingSection(true);
      const res = await api.post('/website/admin/draft', { socials });
      if (res.data.success) {
        showSuccess('Social Media Accounts saved successfully.');
        setIsDirty(false);
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Unable to save social media links.');
    } finally {
      setSavingSection(false);
    }
  };

  // Global Save All / Publish / Discard
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      const res = await api.post('/website/admin/draft', {
        contents,
        contacts,
        socials,
        media,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Draft changes saved successfully.');
        setIsDirty(false);
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Unable to save draft changes.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const res = await api.post('/website/admin/publish');
      if (res.data.success) {
        showSuccess('Website content published live successfully!');
        setIsDirty(false);
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to publish changes to live website.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscard = async () => {
    if (!window.confirm('Are you sure you want to discard all draft changes and revert to the published live version?')) {
      return;
    }
    try {
      setDiscarding(true);
      const res = await api.post('/website/admin/discard');
      if (res.data.success) {
        showSuccess('Draft changes discarded. Reverted to live published content.');
        setIsDirty(false);
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to discard draft changes.');
    } finally {
      setDiscarding(false);
    }
  };

  // Add Contact Detail Submission
  const handleAddContactSubmit = () => {
    if (!newContactTitle.trim()) {
      showError('Please enter a Contact Field Title.');
      return;
    }
    const key = newContactKey.trim() || newContactTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const isPhone = key.includes('phone') || key.includes('mobile') || key.includes('whatsapp') || key.includes('toll');

    if (isPhone && newContactVal && !validateIndianPhone(newContactVal)) {
      showError('Invalid Indian phone number. Must contain 10 to 12 digits.');
      return;
    }

    const newItem = {
      key,
      title: newContactTitle.trim(),
      draftValue: newContactVal.trim(),
      publishedValue: '',
      isActive: true,
      displayOrder: contacts.length + 1
    };

    setContacts((prev) => [...prev, newItem]);
    setIsDirty(true);
    setShowAddContactModal(false);
    setNewContactTitle('');
    setNewContactKey('');
    setNewContactVal('');
    showSuccess(`Added new contact field '${newContactTitle}'. Click Save Contact Information to save.`);
  };

  const handleRemoveContact = (key: string) => {
    if (!window.confirm('Are you sure you want to remove this contact detail?')) return;
    setContacts((prev) => prev.filter((c) => c.key !== key));
    setIsDirty(true);
    showSuccess('Contact detail removed. Click Save Contact Information to save changes.');
  };

  // Add Social Account Submission
  const handleAddSocialSubmit = () => {
    if (!newSocialPlatform.trim()) {
      showError('Please enter Platform Name.');
      return;
    }
    if (newSocialUrl && !isValidUrl(newSocialUrl)) {
      showError('Invalid URL format. Must start with http:// or https://');
      return;
    }

    const newItem = {
      id: `custom_${Date.now()}`,
      platform: newSocialPlatform.trim(),
      url: newSocialUrl.trim(),
      draftUrl: newSocialUrl.trim(),
      isActive: true,
      draftIsActive: true,
      displayOrder: socials.length + 1,
      icon: 'Share2'
    };

    setSocials((prev) => [...prev, newItem]);
    setIsDirty(true);
    setShowAddSocialModal(false);
    setNewSocialPlatform('');
    setNewSocialUrl('');
    showSuccess(`Added social media account '${newSocialPlatform}'. Click Save Social Media Accounts to save.`);
  };

  const handleRemoveSocial = (id: string) => {
    if (!window.confirm('Are you sure you want to remove this social media account?')) return;
    setSocials((prev) => prev.filter((s) => s.id !== id));
    setIsDirty(true);
    showSuccess('Social media account removed. Click Save Social Media Accounts to save changes.');
  };

  // Upload File Selection Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showError('File size exceeds maximum limit of 5MB. Please select a smaller image file.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showError('Invalid file format. Only JPG, JPEG, PNG, and WEBP files are allowed.');
      return;
    }

    setUploadFile(file);
    const localUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(localUrl);
  };

  // Submit Upload Image Modal
  const handleCreateMediaSubmit = async (publishNow: boolean = false) => {
    if (!uploadTitle.trim()) {
      showError('Please provide an Image Title.');
      return;
    }
    if (!uploadFile && !uploadUrlInput.trim()) {
      showError('Please select an image file to upload or enter an image URL.');
      return;
    }

    try {
      setIsSubmittingMedia(true);
      let finalImageUrl = uploadUrlInput.trim();

      if (uploadFile) {
        const formData = new FormData();
        formData.append('image', uploadFile);

        const uploadRes = await api.post('/website/admin/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data.success) {
          finalImageUrl = uploadRes.data.url;
        } else {
          throw new Error('Image upload failed.');
        }
      }

      const res = await api.post('/website/admin/media', {
        title: uploadTitle,
        description: uploadDesc,
        section: uploadSection,
        category: uploadCategory || (uploadSection === 'CSR Activities' ? 'CSR ACTIVITIES' : uploadSection === 'Recognition' ? 'RECOGNITION' : 'GENERAL'),
        displayType: uploadDisplayType,
        imageUrl: finalImageUrl,
        publishNow,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Image uploaded successfully.');
        setShowUploadModal(false);
        setUploadTitle('');
        setUploadDesc('');
        setUploadFile(null);
        setUploadPreviewUrl('');
        setUploadUrlInput('');
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || err.message || 'Failed to upload and save image.');
    } finally {
      setIsSubmittingMedia(false);
    }
  };

  // Edit Modal Submission
  const handleOpenEditModal = (item: any) => {
    setSelectedMediaItem(item);
    setEditTitle(item.draftTitle || item.title || '');
    setEditDesc(item.draftDescription || item.description || '');
    setEditSection(item.section || 'CSR Activities');
    setEditCategory(item.draftCategory || item.category || '');
    setEditDisplayType(item.draftDisplayType || item.displayType || 'CARD');
    setShowEditModal(true);
  };

  const handleEditMediaSubmit = async (publishNow: boolean = false) => {
    if (!selectedMediaItem) return;
    try {
      setIsSubmittingMedia(true);
      const res = await api.put(`/website/admin/media/${selectedMediaItem.id}`, {
        title: editTitle,
        description: editDesc,
        section: editSection,
        category: editCategory,
        displayType: editDisplayType,
        publishNow,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Image details updated successfully.');
        setShowEditModal(false);
        setSelectedMediaItem(null);
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update image details.');
    } finally {
      setIsSubmittingMedia(false);
    }
  };

  // Replace Image Submission
  const handleReplaceImageSubmit = async (publishNow: boolean = false) => {
    if (!selectedMediaItem) return;
    if (!uploadFile && !uploadUrlInput.trim()) {
      showError('Please select a new image file or enter a new Image URL.');
      return;
    }

    try {
      setIsSubmittingMedia(true);
      let newImageUrl = uploadUrlInput.trim();

      if (uploadFile) {
        const formData = new FormData();
        formData.append('image', uploadFile);

        const uploadRes = await api.post('/website/admin/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data.success) {
          newImageUrl = uploadRes.data.url;
        } else {
          throw new Error('Image upload failed.');
        }
      }

      const res = await api.put(`/website/admin/media/${selectedMediaItem.id}`, {
        imageUrl: newImageUrl,
        publishNow,
      });

      if (res.data.success) {
        showSuccess(res.data.message || 'Image replaced successfully.');
        setShowReplaceModal(false);
        setSelectedMediaItem(null);
        setUploadFile(null);
        setUploadPreviewUrl('');
        setUploadUrlInput('');
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to replace image file.');
    } finally {
      setIsSubmittingMedia(false);
    }
  };

  // Delete Media Item
  const handleDeleteMediaConfirm = async () => {
    if (!selectedMediaItem) return;
    try {
      setIsSubmittingMedia(true);
      const res = await api.delete(`/website/admin/media/${selectedMediaItem.id}`);
      if (res.data.success) {
        showSuccess(res.data.message || 'Image removed successfully.');
        setShowDeleteModal(false);
        setSelectedMediaItem(null);
        fetchData();
        fetchHistory();
      }
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to remove media record.');
    } finally {
      setIsSubmittingMedia(false);
    }
  };

  // Filtered media items
  const filteredMedia = media.filter((item) => {
    const matchesSection =
      selectedSectionFilter === 'ALL' || item.section === selectedSectionFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.section?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q);
    return matchesSection && matchesSearch;
  });

  const heroContent = contents.filter((c) => c.section === 'HERO');
  const servicesContent = contents.filter((c) => c.section === 'SERVICES');
  const aboutContent = contents.filter((c) => c.section === 'ABOUT');
  const footerContent = contents.filter((c) => c.section === 'FOOTER');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C99A3E] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* PAGE HERO HEADER (Light theme styling) */}
      <div 
        className="relative overflow-hidden rounded-2xl p-7 text-slate-900 shadow-sm border border-slate-200/90 mb-6 bg-gradient-to-br from-white via-slate-50 to-[#F6F4EF]"
      >
        {/* Glow accent */}
        <div 
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full pointer-events-none opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(201,154,62,0.2) 0%, rgba(201,154,62,0) 70%)' }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-[#B4690E] bg-[#C99A3E]/15 border border-[#C99A3E]/30">
              <span className="w-2 h-2 rounded-full bg-[#B4690E] animate-pulse" />
              Website & Portal Management
            </div>

            {/* Global Header Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {hasUnpublishedDrafts ? (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unpublished Draft Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Published & Live Up-to-Date
                </span>
              )}

              <button
                onClick={handleDiscard}
                disabled={discarding || !hasUnpublishedDrafts}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-40 transition-all cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                Discard
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#10233F] hover:bg-[#0A1830] text-white disabled:opacity-40 transition-all cursor-pointer shadow-sm whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={handlePublish}
                disabled={publishing}
                className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-[#C99A3E] hover:bg-[#d8aa4a] text-[#0A1830] disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-[#C99A3E]/20 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                {publishing ? 'Publish Live' : 'Publish Live'}
              </button>
            </div>
          </div>

          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#10233F] m-0">
              Greetwell Financial Services · Content & Media CMS
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl mt-1.5 leading-relaxed font-medium">
              Manage landing page messaging, corporate contact details, social media handles, original image assets, live previews, and CMS audit history.
            </p>
          </div>

          {/* Last Updated Footer Strip */}
          {lastUpdatedInfo && (
            <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium gap-3 bg-white/70 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span><strong>Last Updated:</strong> {new Date(lastUpdatedInfo.date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span><strong>Updated By:</strong> {lastUpdatedInfo.by} ({lastUpdatedInfo.role || 'Super Admin'})</span>
              </div>
              {lastUpdatedInfo.section && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {lastUpdatedInfo.section}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION BAR (Styled pill container) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => handleTabChange('content')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'content'
              ? 'bg-[#10233F] text-white shadow-md'
              : 'text-slate-600 hover:text-[#10233F] hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" />
          Website Content
        </button>

        <button
          onClick={() => handleTabChange('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'contact'
              ? 'bg-[#10233F] text-white shadow-md'
              : 'text-slate-600 hover:text-[#10233F] hover:bg-slate-100'
          }`}
        >
          <Phone className="w-4 h-4" />
          Contact Information
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'contact' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {contacts.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('social')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'social'
              ? 'bg-[#10233F] text-white shadow-md'
              : 'text-slate-600 hover:text-[#10233F] hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Social Media
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'social' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {socials.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('media')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'media'
              ? 'bg-[#10233F] text-white shadow-md'
              : 'text-slate-600 hover:text-[#10233F] hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Images & Media
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'media' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {media.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-[#10233F] text-white shadow-md'
              : 'text-slate-600 hover:text-[#10233F] hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4" />
          Preview Changes
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#10233F] text-white shadow-md'
              : 'text-slate-600 hover:text-[#10233F] hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          Change History
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {historyLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: WEBSITE CONTENT */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Top Save Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-[#10233F]">Website Content Sections</h2>
              <p className="text-xs text-slate-500">Edit hero banner, services descriptions, about story, mission, and footer disclaimer.</p>
            </div>
            <button
              onClick={handleSaveContentSection}
              disabled={savingSection}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#10233F] hover:bg-[#0A1830] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection ? 'Saving Changes...' : 'Save Content Changes'}
            </button>
          </div>

          {/* Hero Section Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#10233F] flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#10233F] m-0">Hero Banner Section</h2>
                  <p className="text-xs text-slate-500 m-0">Primary heading and subtitle displayed at top of landing page</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {heroContent.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#10233F] uppercase tracking-wider">
                    {item.label}
                  </label>
                  {item.key === 'hero_subtitle' ? (
                    <textarea
                      rows={2}
                      value={item.draftValue}
                      onChange={(e) => handleContentChange(item.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none transition-all"
                    />
                  ) : (
                    <input
                      type="text"
                      value={item.draftValue}
                      onChange={(e) => handleContentChange(item.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Service Descriptions Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#C99A3E] flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-[#C99A3E]" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#10233F] m-0">Service Descriptions</h2>
                  <p className="text-xs text-slate-500 m-0">Overview texts for Loans, Insurance, and Wealth Investments</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {servicesContent.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#10233F] uppercase tracking-wider">
                    {item.label}
                  </label>
                  <textarea
                    rows={3}
                    value={item.draftValue}
                    onChange={(e) => handleContentChange(item.key, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* About Us, Mission & Vision */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <HeartHandshake className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#10233F] m-0">Company Story, Mission & Vision</h2>
                  <p className="text-xs text-slate-500 m-0">Brand values and organizational mission statements</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {aboutContent.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#10233F] uppercase tracking-wider">
                    {item.label}
                  </label>
                  {item.key === 'about_body' ? (
                    <textarea
                      rows={4}
                      value={item.draftValue}
                      onChange={(e) => handleContentChange(item.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none transition-all"
                    />
                  ) : (
                    <input
                      type="text"
                      value={item.draftValue}
                      onChange={(e) => handleContentChange(item.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#10233F] m-0">Footer Copyright & Legal Text</h2>
                  <p className="text-xs text-slate-500 m-0">Disclaimer notice and copyright statement</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {footerContent.map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#10233F] uppercase tracking-wider">
                    {item.label}
                  </label>
                  <textarea
                    rows={2}
                    value={item.draftValue}
                    onChange={(e) => handleContentChange(item.key, e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex justify-end bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={handleSaveContentSection}
              disabled={savingSection}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10233F] hover:bg-[#0A1830] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection ? 'Saving...' : 'Save Content Changes'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: CONTACT INFORMATION */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#10233F]">Contact Details & Corporate Headquarters</h2>
              <p className="text-xs text-slate-500 mt-1">
                Real GFS office address, support email, and phone numbers. Active items appear immediately on public landing pages.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowAddContactModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Field
              </button>
              <button
                onClick={handleSaveContactSection}
                disabled={savingSection}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#10233F] hover:bg-[#0A1830] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {savingSection ? 'Saving...' : 'Save Contact Info'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {contacts.map((item) => (
              <div
                key={item.key}
                className={`p-4 rounded-xl border transition-all ${
                  item.isActive ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#10233F] uppercase tracking-wider flex items-center gap-1.5">
                    {item.key.includes('phone') || item.key === 'whatsapp' ? (
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                    ) : item.key.includes('email') ? (
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    ) : item.key.includes('address') ? (
                      <MapPin className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {item.title || item.key}
                  </span>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={item.isActive}
                        onChange={(e) => handleContactChange(item.key, 'isActive', e.target.checked)}
                        className="w-4 h-4 text-[#10233F] rounded border-slate-300 focus:ring-[#C99A3E]"
                      />
                      <span>Active</span>
                    </label>

                    <button
                      onClick={() => handleRemoveContact(item.key)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                      title="Remove Field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {item.key === 'office_address' ? (
                  <textarea
                    rows={3}
                    value={item.draftValue}
                    onChange={(e) => handleContactChange(item.key, 'draftValue', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={item.draftValue}
                    onChange={(e) => handleContactChange(item.key, 'draftValue', e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveContactSection}
              disabled={savingSection}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10233F] hover:bg-[#0A1830] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection ? 'Saving...' : 'Save Contact Information'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SOCIAL MEDIA */}
      {activeTab === 'social' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#10233F]">Social Media Accounts & Links</h2>
              <p className="text-xs text-slate-500 mt-1">
                Official GFS social profiles (WhatsApp, Facebook, Instagram, YouTube). Toggle visibility or add new links.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowAddSocialModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Platform
              </button>
              <button
                onClick={handleSaveSocialSection}
                disabled={savingSection}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#10233F] hover:bg-[#0A1830] text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {savingSection ? 'Saving...' : 'Save Social Links'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {socials.map((item) => {
              const currentUrl = item.draftUrl !== undefined ? item.draftUrl : item.url;
              const isEnabled = item.draftIsActive !== undefined ? item.draftIsActive : item.isActive;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isEnabled ? 'border-slate-200 bg-white hover:border-slate-300 shadow-sm' : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#10233F] flex items-center justify-center font-bold border border-slate-200">
                        <Share2 className="w-5 h-5 text-[#10233F]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#10233F] m-0">{item.platform}</h3>
                        <span className="text-[11px] text-slate-400">Order #{item.displayOrder}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => handleSocialChange(item.id, 'draftIsActive', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10233F]"></div>
                      </label>

                      <button
                        onClick={() => handleRemoveSocial(item.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Remove Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">
                      Profile URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentUrl}
                        onChange={(e) => handleSocialChange(item.id, 'draftUrl', e.target.value)}
                        placeholder="https://"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none"
                      />
                      {currentUrl && isValidUrl(currentUrl) && (
                        <a
                          href={currentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-600 hover:text-[#10233F] hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                          title="Open Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleSaveSocialSection}
              disabled={savingSection}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#10233F] hover:bg-[#0A1830] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {savingSection ? 'Saving...' : 'Save Social Media Accounts'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: IMAGES & MEDIA */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search media assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#C99A3E] focus:border-[#C99A3E] outline-none"
                />
              </div>

              <div className="w-48">
                <SearchableSelect
                  options={SECTION_OPTIONS.map((sec) => ({ value: sec, label: sec }))}
                  value={selectedSectionFilter}
                  onChange={(val) => setSelectedSectionFilter(val)}
                  placeholder="Filter Section"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setUploadTitle('');
                setUploadDesc('');
                setUploadFile(null);
                setUploadPreviewUrl('');
                setUploadUrlInput('');
                setShowUploadModal(true);
              }}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10233F] hover:bg-[#0A1830] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Upload New Media
            </button>
          </div>

          {/* Media Grid */}
          {filteredMedia.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-[#10233F]">No Media Items Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No images matched your current filter criteria. Upload a new image or clear the filter parameters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredMedia.map((item) => {
                const currentImgUrl = getMediaUrl(item.draftUrl || item.imageUrl || item.publishedUrl);
                const isBroken = brokenImages[item.id];

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="relative group bg-slate-100 aspect-video overflow-hidden">
                      {isBroken ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
                          <AlertTriangle className="w-8 h-8 mb-1 text-amber-500" />
                          <span className="text-[11px] font-semibold text-slate-600">Image Asset Missing</span>
                        </div>
                      ) : (
                        <img
                          src={currentImgUrl}
                          alt={item.title}
                          onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10233F]/80 text-white backdrop-blur-sm">
                          {item.section || 'General'}
                        </span>
                        {item.status === 'DRAFT' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white backdrop-blur-sm">
                            Draft
                          </span>
                        )}
                      </div>

                      {/* Overlay action buttons */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => setLightboxItem(item)}
                          className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white transition-all cursor-pointer"
                          title="Zoom / View Lightbox"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white transition-all cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMediaItem(item);
                            setUploadFile(null);
                            setUploadPreviewUrl('');
                            setUploadUrlInput('');
                            setShowReplaceModal(true);
                          }}
                          className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white transition-all cursor-pointer"
                          title="Replace Image File"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMediaItem(item);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer"
                          title="Delete Media"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-[#10233F] truncate m-0">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 m-0 leading-relaxed">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                        <span>{item.category || 'MEDIA'}</span>
                        <span>{item.displayType || 'CARD'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PREVIEW CHANGES */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          {/* Device and Mode Selector Bar */}
          <div className="bg-[#0A1830] text-white p-3 rounded-t-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#E8C877] uppercase tracking-wider">Device Frame:</span>
              <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-white text-[#0A1830]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDevice === 'tablet' ? 'bg-white text-[#0A1830]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" /> Tablet
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-white text-[#0A1830]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#E8C877]">Preview Version:</span>
              <div className="flex gap-1 bg-white/10 p-1 rounded-xl">
                <button
                  onClick={() => setPreviewMode('draft')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    previewMode === 'draft' ? 'bg-[#C99A3E] text-[#0A1830] font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Draft Changes
                </button>
                <button
                  onClick={() => setPreviewMode('published')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    previewMode === 'published' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Live Published
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Preview Container */}
          <div className="bg-slate-200 p-6 rounded-b-2xl min-h-[600px] flex justify-center border border-slate-300 border-t-0">
            <div
              className={`bg-white rounded-xl shadow-2xl transition-all duration-300 overflow-y-auto ${
                previewDevice === 'desktop'
                  ? 'w-full max-w-5xl h-[700px]'
                  : previewDevice === 'tablet'
                  ? 'w-[768px] h-[700px]'
                  : 'w-[375px] h-[650px]'
              }`}
            >
              {/* Header preview */}
              <div className="bg-[#10233F] text-white p-4 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-lg text-[#E8C877]">Greetwell</span>
                  <span className="text-xs text-slate-300">Financial Services</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white font-semibold">
                  {previewMode === 'draft' ? 'DRAFT MODE PREVIEW' : 'LIVE PREVIEW'}
                </span>
              </div>

              {/* Hero Banner preview */}
              <div className="bg-gradient-to-br from-[#0A1830] to-[#10233F] text-white p-8 text-center space-y-4">
                <h2 className="font-serif text-2xl font-bold text-white max-w-xl mx-auto">
                  {contents.find((c) => c.key === 'hero_title')?.draftValue || 'Empowering Your Financial Growth'}
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  {contents.find((c) => c.key === 'hero_subtitle')?.draftValue || 'Your trusted financial services portal'}
                </p>
                <button className="px-5 py-2.5 bg-[#C99A3E] text-[#0A1830] font-bold text-xs rounded-xl shadow-md">
                  {contents.find((c) => c.key === 'hero_cta')?.draftValue || 'Get Started Now'}
                </button>
              </div>

              {/* Contact Info preview section */}
              <div className="p-6 bg-slate-50 space-y-4 border-t border-slate-200">
                <h3 className="font-serif font-bold text-sm text-[#10233F]">Corporate Headquarters & Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-[#10233F] block">Address:</span>
                    <p className="m-0 leading-relaxed">
                      {contacts.find((c) => c.key === 'office_address')?.draftValue || 'PNO 71, Hno 1-36/1/2/6/A/P-71, Road No 6, Jawahar Colony, Chandanagar, Near Yelamma Temple, 500050'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-[#10233F] block">Direct Contact:</span>
                    <p className="m-0">Phone: {contacts.find((c) => c.key === 'primary_phone')?.draftValue || '+91 91211 47777'}</p>
                    <p className="m-0">Email: {contacts.find((c) => c.key === 'email_general')?.draftValue || 'gfsgreetwell@gmail.com'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CHANGE HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#10233F]">CMS Change & Audit History</h2>
            <p className="text-xs text-slate-500 mt-1">
              Detailed logs of content edits, contact updates, image uploads, and live publications.
            </p>
          </div>

          {historyLogs.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-xs">No change history logs available yet.</div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pl-6">
              {historyLogs.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#10233F] border-2 border-white ring-4 ring-slate-100" />
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#10233F] uppercase tracking-wider">{log.actionType}</span>
                      <span className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 m-0 font-medium">{log.details}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                      <span>User: {log.userEmail}</span>
                      {log.userRole && <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">{log.userRole}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: UPLOAD NEW MEDIA */}
      {showUploadModal && (
        <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload New Media Asset">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Image Title *</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Hero Banner 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#C99A3E] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Section</label>
              <SearchableSelect
                options={SECTION_OPTIONS.filter((s) => s !== 'ALL').map((s) => ({ value: s, label: s }))}
                value={uploadSection}
                onChange={(val) => setUploadSection(val)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Select File (JPG, PNG, WEBP &lt; 5MB)</label>
              <input type="file" accept="image/*" onChange={handleFileSelect} className="text-xs text-slate-600" />
              {uploadPreviewUrl && (
                <img src={uploadPreviewUrl} alt="Preview" className="mt-2 h-28 object-cover rounded-xl border border-slate-200" />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Or Image URL</label>
              <input
                type="text"
                value={uploadUrlInput}
                onChange={(e) => setUploadUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#C99A3E] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Description</label>
              <textarea
                rows={2}
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#C99A3E] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateMediaSubmit(false)}
                disabled={isSubmittingMedia}
                className="px-4 py-2 bg-[#10233F] hover:bg-[#0A1830] text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleCreateMediaSubmit(true)}
                disabled={isSubmittingMedia}
                className="px-4 py-2 bg-[#C99A3E] hover:bg-[#d8aa4a] text-[#0A1830] text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Publish Live Now
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: EDIT MEDIA DETAILS */}
      {showEditModal && selectedMediaItem && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Media Details">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Image Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Section</label>
              <SearchableSelect
                options={SECTION_OPTIONS.filter((s) => s !== 'ALL').map((s) => ({ value: s, label: s }))}
                value={editSection}
                onChange={(val) => setEditSection(val)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Description</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEditMediaSubmit(false)}
                disabled={isSubmittingMedia}
                className="px-4 py-2 bg-[#10233F] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: REPLACE IMAGE FILE */}
      {showReplaceModal && selectedMediaItem && (
        <Modal isOpen={showReplaceModal} onClose={() => setShowReplaceModal(false)} title="Replace Image Asset">
          <div className="space-y-4">
            <p className="text-xs text-slate-600 m-0">
              Replacing image for: <strong>{selectedMediaItem.title}</strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Select Replacement Image</label>
              <input type="file" accept="image/*" onChange={handleFileSelect} className="text-xs text-slate-600" />
              {uploadPreviewUrl && (
                <img src={uploadPreviewUrl} alt="Preview" className="mt-2 h-28 object-cover rounded-xl border border-slate-200" />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Or New Image URL</label>
              <input
                type="text"
                value={uploadUrlInput}
                onChange={(e) => setUploadUrlInput(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowReplaceModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReplaceImageSubmit(false)}
                disabled={isSubmittingMedia}
                className="px-4 py-2 bg-[#10233F] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Replace Asset
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: DELETE MEDIA CONFIRMATION */}
      {showDeleteModal && selectedMediaItem && (
        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Image Asset">
          <div className="space-y-4">
            <p className="text-xs text-slate-700 m-0">
              Are you sure you want to permanently delete <strong>{selectedMediaItem.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMediaConfirm}
                disabled={isSubmittingMedia}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 cursor-pointer"
              >
                Delete Image
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: ADD CONTACT FIELD */}
      {showAddContactModal && (
        <Modal isOpen={showAddContactModal} onClose={() => setShowAddContactModal(false)} title="Add Contact Field">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Field Title *</label>
              <input
                type="text"
                value={newContactTitle}
                onChange={(e) => setNewContactTitle(e.target.value)}
                placeholder="e.g. Emergency Support Line"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Field Value</label>
              <input
                type="text"
                value={newContactVal}
                onChange={(e) => setNewContactVal(e.target.value)}
                placeholder="+91 91211 47777 or info@domain.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddContactModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContactSubmit}
                className="px-4 py-2 bg-[#10233F] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Add Field
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 6: ADD SOCIAL PLATFORM */}
      {showAddSocialModal && (
        <Modal isOpen={showAddSocialModal} onClose={() => setShowAddSocialModal(false)} title="Add Social Media Account">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Platform Name *</label>
              <input
                type="text"
                value={newSocialPlatform}
                onChange={(e) => setNewSocialPlatform(e.target.value)}
                placeholder="e.g. WhatsApp, Facebook, Instagram, YouTube"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#10233F] uppercase mb-1">Profile URL</label>
              <input
                type="text"
                value={newSocialUrl}
                onChange={(e) => setNewSocialUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-[#10233F] border-t border-slate-100">
              <button
                onClick={() => setShowAddSocialModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSocialSubmit}
                className="px-4 py-2 bg-[#10233F] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Add Platform
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxItem && (
        <Modal isOpen={!!lightboxItem} onClose={() => setLightboxItem(null)} title={lightboxItem.title || 'Image Preview'}>
          <div className="space-y-3">
            <img
              src={getMediaUrl(lightboxItem.draftUrl || lightboxItem.imageUrl || lightboxItem.publishedUrl)}
              alt={lightboxItem.title}
              className="w-full max-h-[500px] object-contain rounded-xl bg-slate-900"
            />
            {lightboxItem.description && (
              <p className="text-xs text-slate-600 m-0">{lightboxItem.description}</p>
            )}
          </div>
        </Modal>
      )}

      {/* UNSAVED CHANGES MODAL */}
      {showUnsavedModal && (
        <Modal isOpen={showUnsavedModal} onClose={() => setShowUnsavedModal(false)} title="Unsaved Changes Warning">
          <div className="space-y-4">
            <p className="text-xs text-slate-700 m-0">
              You have unsaved changes in this tab. If you switch tabs now without saving, your edits will be discarded.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Stay Here
              </button>
              <button
                onClick={confirmLeaveWithoutSaving}
                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
