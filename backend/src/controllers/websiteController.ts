import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../utils/prisma';
import { CONFIG } from '../config';

// Configure Multer for Website Media Uploads
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(CONFIG.UPLOAD_DIR, 'media');
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
    } catch (e) {
      console.warn('Notice creating media upload directory:', e);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${uniqueSuffix}${ext}`);
  },
});

export const mediaUploadMiddleware = multer({
  storage: mediaStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WEBP image files are allowed.'));
    }
  },
});

// Helper for Indian phone validation (10 to 12 digits)
export const validateIndianPhone = (phone: string): boolean => {
  if (!phone || phone.trim() === '') return true; // empty allowed for dynamic removal
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 12;
};

// Global In-Memory Caching for Instant (<15ms) Public API Responses
let isSeeded = false;
let cachedPublicData: any = null;

export const clearPublicWebsiteCache = () => {
  cachedPublicData = null;
};

// Seed default content & gallery media if DB is empty
const seedDefaultsIfEmpty = async () => {
  if (isSeeded) return;
  try {
    const contentCount = await prisma.websiteContent.count();
    if (contentCount === 0) {
      const defaultContents = [
        { section: 'HERO', key: 'hero_title', label: 'Hero Title', draftValue: 'Empowering Your Financial Growth with Trust & Integrity', publishedValue: 'Empowering Your Financial Growth with Trust & Integrity' },
        { section: 'HERO', key: 'hero_subtitle', label: 'Hero Subtitle', draftValue: 'Your one-stop destination for Loans, Insurance, and Smart Investment Solutions.', publishedValue: 'Your one-stop destination for Loans, Insurance, and Smart Investment Solutions.' },
        { section: 'HERO', key: 'hero_cta', label: 'Hero Button Text', draftValue: 'Get Started Now', publishedValue: 'Get Started Now' },
        { section: 'SERVICES', key: 'loan_desc', label: 'Loan Services Description', draftValue: 'Flexible personal, home, and commercial loans with competitive interest rates.', publishedValue: 'Flexible personal, home, and commercial loans with competitive interest rates.' },
        { section: 'SERVICES', key: 'insurance_desc', label: 'Insurance Services Description', draftValue: 'Comprehensive life, health, property, and business coverage to protect what matters.', publishedValue: 'Comprehensive life, health, property, and business coverage to protect what matters.' },
        { section: 'SERVICES', key: 'investment_desc', label: 'Investment Services Description', draftValue: 'High-yield mutual funds, fixed deposits, and wealth management solutions.', publishedValue: 'High-yield mutual funds, fixed deposits, and wealth management solutions.' },
        { section: 'ABOUT', key: 'about_title', label: 'About Us Title', draftValue: 'About Greetwell Financial Services', publishedValue: 'About Greetwell Financial Services' },
        { section: 'ABOUT', key: 'about_body', label: 'About Us Story', draftValue: 'Greetwell Financial Services is a trusted leader in providing tailored financial products. We bring together loans, insurance, and investments under one secure digital portal.', publishedValue: 'Greetwell Financial Services is a trusted leader in providing tailored financial products. We bring together loans, insurance, and investments under one secure digital portal.' },
        { section: 'ABOUT', key: 'about_mission', label: 'Our Mission', draftValue: 'To empower individuals and businesses with accessible, transparent, and innovative financial services.', publishedValue: 'To empower individuals and businesses with accessible, transparent, and innovative financial services.' },
        { section: 'ABOUT', key: 'about_vision', label: 'Our Vision', draftValue: "To be India's most client-centric and technologically advanced financial service portal.", publishedValue: "To be India's most client-centric and technologically advanced financial service portal." },
        { section: 'FOOTER', key: 'footer_copyright', label: 'Footer Copyright Text', draftValue: '© 2026 Greetwell Financial Services. All rights reserved.', publishedValue: '© 2026 Greetwell Financial Services. All rights reserved.' },
        { section: 'FOOTER', key: 'footer_disclaimer', label: 'Footer Disclaimer Text', draftValue: 'Greetwell Financial Services is a licensed distributor of loans, insurance, and investment products. All financial investments are subject to market risks.', publishedValue: 'Greetwell Financial Services is a licensed distributor of loans, insurance, and investment products. All financial investments are subject to market risks.' }
      ];

      for (const c of defaultContents) {
        await prisma.websiteContent.create({ data: c });
      }
    }
    isSeeded = true;
  } catch (e) {
    console.warn('Seeding check notice:', e);
  }
};

// GET /api/website/public (Public - Returns active published content, contact, socials, media grouped by section)
export const getPublicWebsiteContent = async (req: Request, res: Response) => {
  try {
    if (cachedPublicData) {
      return res.status(200).json(cachedPublicData);
    }

    await seedDefaultsIfEmpty();

    const contents = await prisma.websiteContent.findMany();
    const contacts = await prisma.contactInfo.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    const socials = await prisma.socialMediaAcc.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });

    const mediaItems = await prisma.websiteMedia.findMany({
      where: { isActive: true, status: 'PUBLISHED' },
      orderBy: { displayOrder: 'asc' }
    });

    // Map content & contacts to key-value records
    const contentMap: Record<string, string> = {};
    contents.forEach((c) => {
      contentMap[c.key] = c.publishedValue;
    });

    const contactMap: Record<string, any> = {};
    contacts.forEach((c) => {
      if (c.publishedValue && c.publishedValue.trim() !== '') {
        contactMap[c.key] = {
          title: c.title,
          value: c.publishedValue
        };
      }
    });

    // Group media by section and category
    const mediaMap: Record<string, any> = {};
    const csrActivities: any[] = [];
    const recognition: any[] = [];

    mediaItems.forEach((m) => {
      if (m.key) {
        mediaMap[m.key] = {
          title: m.title,
          url: m.publishedUrl,
          altText: m.altText
        };
      }

      const itemData = {
        id: m.id,
        title: m.title,
        description: m.description,
        section: m.section,
        category: m.category,
        url: m.publishedUrl,
        altText: m.altText,
        displayType: m.displayType,
        displayOrder: m.displayOrder,
        createdAt: m.createdAt
      };

      if (m.section === 'CSR Activities' || m.category === 'CSR ACTIVITIES') {
        csrActivities.push(itemData);
      } else if (m.section === 'Recognition' || m.category === 'RECOGNITION') {
        recognition.push(itemData);
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        content: contentMap,
        contact: contactMap,
        socials: socials.filter((s) => s.url && s.url.trim() !== '').map((s) => ({
          platform: s.platform,
          url: s.url,
          icon: s.icon
        })),
        media: mediaMap,
        allMedia: mediaItems.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          section: m.section,
          category: m.category,
          url: m.publishedUrl,
          altText: m.altText,
          displayType: m.displayType,
          displayOrder: m.displayOrder,
          createdAt: m.createdAt
        })),
        csrActivities,
        recognition
      }
    });
  } catch (error: any) {
    console.error('Error fetching public website content:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve website content',
      error: error.message
    });
  }
};

// GET /api/website/admin (Super Admin only - Returns full draft & published configuration)
export const getAdminWebsiteContent = async (req: Request, res: Response) => {
  try {
    await seedDefaultsIfEmpty();

    const contents = await prisma.websiteContent.findMany();
    const contacts = await prisma.contactInfo.findMany({ orderBy: { displayOrder: 'asc' } });
    const socials = await prisma.socialMediaAcc.findMany({ orderBy: { displayOrder: 'asc' } });
    const media = await prisma.websiteMedia.findMany({ orderBy: [{ section: 'asc' }, { displayOrder: 'asc' }] });

    const hasUnpublishedDrafts =
      contents.some((c) => c.draftValue !== c.publishedValue) ||
      contacts.some((c) => c.draftValue !== c.publishedValue) ||
      socials.some((s) => (s.draftUrl ?? s.url) !== s.url || s.draftIsActive !== s.isActive) ||
      media.some((m) =>
        m.draftUrl !== m.publishedUrl ||
        (m.draftTitle ?? m.title) !== m.title ||
        (m.draftDescription ?? m.description) !== m.description ||
        m.status === 'DRAFT'
      );

    const lastLog = await prisma.websiteChangeHistory.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const lastUpdated = lastLog
      ? {
          date: lastLog.createdAt,
          by: lastLog.actorName || lastLog.actorEmail || 'Super Admin',
          role: lastLog.actorRole || 'SUPER_ADMIN',
          action: lastLog.action,
          section: lastLog.section
        }
      : null;

    return res.status(200).json({
      success: true,
      data: {
        hasUnpublishedDrafts,
        lastUpdated,
        contents,
        contacts,
        socials,
        media
      }
    });
  } catch (error: any) {
    console.error('Error fetching admin website content:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin website content',
      error: error.message
    });
  }
};

// POST /api/website/admin/upload-image (Super Admin - File Upload Handler)
export const uploadWebsiteImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please select a valid JPG, PNG, or WEBP file.'
      });
    }

    const fileUrl = `/uploads/media/${file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: fileUrl,
      fileName: file.originalname,
      size: file.size
    });
  } catch (error: any) {
    console.error('Error uploading website image file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image file',
      error: error.message
    });
  }
};

// POST /api/website/admin/media (Super Admin - Create New Media Record)
export const createWebsiteMedia = async (req: Request, res: Response) => {
  try {
    const { title, description, section, category, displayType, imageUrl, publishNow } = req.body;
    const actorUser = (req as any).user;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Image Title is required.' });
    }
    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Image File or URL is required.' });
    }
    if (!section || !section.trim()) {
      return res.status(400).json({ success: false, message: 'Website Location / Section is required.' });
    }

    const isDirectPublish = Boolean(publishNow);
    const newMedia = await prisma.websiteMedia.create({
      data: {
        title: title.trim(),
        draftTitle: title.trim(),
        description: description ? description.trim() : null,
        draftDescription: description ? description.trim() : null,
        section: section.trim(),
        category: category ? category.trim() : (section === 'CSR Activities' ? 'CSR ACTIVITIES' : section === 'Recognition' ? 'RECOGNITION' : 'GENERAL'),
        draftCategory: category ? category.trim() : (section === 'CSR Activities' ? 'CSR ACTIVITIES' : section === 'Recognition' ? 'RECOGNITION' : 'GENERAL'),
        displayType: displayType || 'CARD',
        draftDisplayType: displayType || 'CARD',
        publishedUrl: isDirectPublish ? imageUrl.trim() : '',
        draftUrl: imageUrl.trim(),
        altText: title.trim(),
        draftAltText: title.trim(),
        status: isDirectPublish ? 'PUBLISHED' : 'DRAFT',
        createdByUserId: actorUser?.id,
        createdByName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim()
      }
    });

    await prisma.websiteChangeHistory.create({
      data: {
        section: section.trim(),
        fieldName: title.trim(),
        previousVal: 'None (New Item)',
        newVal: isDirectPublish ? `Published: ${imageUrl.trim()}` : `Draft: ${imageUrl.trim()}`,
        action: isDirectPublish ? 'PUBLISH' : 'SAVE_DRAFT',
        actorUserId: actorUser?.id,
        actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
        actorEmail: actorUser?.email,
        actorRole: actorUser?.role
      }
    });

    return res.status(201).json({
      success: true,
      message: isDirectPublish ? 'New image created and published to live website.' : 'New image saved as draft.',
      data: newMedia
    });
  } catch (error: any) {
    console.error('Error creating website media record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create website media record',
      error: error.message
    });
  }
};

// PUT /api/website/admin/media/:id (Super Admin - Update / Replace Media Record)
export const updateWebsiteMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, section, category, displayType, imageUrl, publishNow, isActive } = req.body;
    const actorUser = (req as any).user;

    const existing = await prisma.websiteMedia.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Website media record not found.' });
    }

    const nextDraftUrl = imageUrl !== undefined ? imageUrl.trim() : existing.draftUrl;
    const nextDraftTitle = title !== undefined ? title.trim() : (existing.draftTitle || existing.title);
    const nextDraftDesc = description !== undefined ? description.trim() : (existing.draftDescription || existing.description);
    const nextSection = section !== undefined ? section.trim() : existing.section;
    const nextCategory = category !== undefined ? category.trim() : (existing.draftCategory || existing.category);
    const isDirectPublish = Boolean(publishNow);

    const updatedMedia = await prisma.websiteMedia.update({
      where: { id },
      data: {
        title: isDirectPublish ? nextDraftTitle : existing.title,
        draftTitle: nextDraftTitle,
        description: isDirectPublish ? nextDraftDesc : existing.description,
        draftDescription: nextDraftDesc,
        section: nextSection,
        category: isDirectPublish ? nextCategory : existing.category,
        draftCategory: nextCategory,
        displayType: displayType || existing.displayType,
        draftDisplayType: displayType || existing.draftDisplayType || existing.displayType,
        draftUrl: nextDraftUrl,
        publishedUrl: isDirectPublish ? nextDraftUrl : existing.publishedUrl,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        draftIsActive: isActive !== undefined ? isActive : existing.draftIsActive,
        status: isDirectPublish ? 'PUBLISHED' : (nextDraftUrl !== existing.publishedUrl ? 'DRAFT' : existing.status)
      }
    });

    await prisma.websiteChangeHistory.create({
      data: {
        section: nextSection,
        fieldName: nextDraftTitle,
        previousVal: existing.draftUrl || existing.publishedUrl,
        newVal: nextDraftUrl,
        action: isDirectPublish ? 'PUBLISH' : 'SAVE_DRAFT',
        actorUserId: actorUser?.id,
        actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
        actorEmail: actorUser?.email,
        actorRole: actorUser?.role
      }
    });

    return res.status(200).json({
      success: true,
      message: isDirectPublish ? 'Media record updated and published live.' : 'Media record draft updated.',
      data: updatedMedia
    });
  } catch (error: any) {
    console.error('Error updating website media record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update website media record',
      error: error.message
    });
  }
};

// DELETE /api/website/admin/media/:id (Super Admin - Delete / Remove Media Record)
export const deleteWebsiteMedia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const actorUser = (req as any).user;

    const existing = await prisma.websiteMedia.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Website media record not found.' });
    }

    await prisma.websiteMedia.delete({ where: { id } });

    await prisma.websiteChangeHistory.create({
      data: {
        section: existing.section,
        fieldName: existing.title,
        previousVal: existing.publishedUrl || existing.draftUrl,
        newVal: 'Removed Item',
        action: 'DISCARD_DRAFT',
        actorUserId: actorUser?.id,
        actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
        actorEmail: actorUser?.email,
        actorRole: actorUser?.role
      }
    });

    return res.status(200).json({
      success: true,
      message: `Image '${existing.title}' removed successfully.`
    });
  } catch (error: any) {
    console.error('Error deleting website media record:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete website media record',
      error: error.message
    });
  }
};

// POST /api/website/admin/draft (Super Admin - Save Bulk Draft)
export const saveWebsiteDraft = async (req: Request, res: Response) => {
  try {
    const { contents, contacts, socials, media } = req.body;
    const actorUser = (req as any).user;

    // Validate phone numbers if contacts are provided
    if (contacts && Array.isArray(contacts)) {
      for (const item of contacts) {
        if (item.key && (item.key.includes('phone') || item.key === 'toll_free' || item.key === 'whatsapp')) {
          if (item.draftValue && !validateIndianPhone(item.draftValue)) {
            return res.status(400).json({
              success: false,
              message: `Invalid Indian phone number for '${item.title || item.key}'. Must contain 10 to 12 numeric digits.`
            });
          }
        }
      }
    }

    let changeCount = 0;

    // Process Content Updates
    if (contents && Array.isArray(contents)) {
      for (const item of contents) {
        if (item.key) {
          const existing = await prisma.websiteContent.findUnique({ where: { key: item.key } });
          if (existing && existing.draftValue !== item.draftValue) {
            await prisma.websiteContent.update({
              where: { key: item.key },
              data: { draftValue: item.draftValue }
            });
            await prisma.websiteChangeHistory.create({
              data: {
                section: 'Website Content',
                fieldName: existing.label || item.key,
                previousVal: existing.draftValue,
                newVal: item.draftValue,
                action: 'SAVE_DRAFT',
                actorUserId: actorUser?.id,
                actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
                actorEmail: actorUser?.email,
                actorRole: actorUser?.role
              }
            });
            changeCount++;
          }
        }
      }
    }

    // Process Contact Updates
    if (contacts && Array.isArray(contacts)) {
      const incomingKeys = contacts.map((c: any) => c.key).filter(Boolean);
      await prisma.contactInfo.deleteMany({
        where: { key: { notIn: incomingKeys } }
      });

      for (const item of contacts) {
        if (item.key) {
          const existing = await prisma.contactInfo.findUnique({ where: { key: item.key } });
          if (existing && (existing.draftValue !== item.draftValue || existing.isActive !== (item.isActive ?? existing.isActive))) {
            await prisma.contactInfo.update({
              where: { key: item.key },
              data: {
                draftValue: item.draftValue,
                isActive: item.isActive !== undefined ? item.isActive : existing.isActive
              }
            });
            await prisma.websiteChangeHistory.create({
              data: {
                section: 'Contact Information',
                fieldName: existing.title || item.key,
                previousVal: existing.draftValue,
                newVal: item.draftValue,
                action: 'SAVE_DRAFT',
                actorUserId: actorUser?.id,
                actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
                actorEmail: actorUser?.email,
                actorRole: actorUser?.role
              }
            });
            changeCount++;
          }
        }
      }
    }

    // Process Social Accounts
    if (socials && Array.isArray(socials)) {
      const incomingIds = socials.map((s: any) => s.id).filter(Boolean);
      await prisma.socialMediaAcc.deleteMany({
        where: { id: { notIn: incomingIds } }
      });

      for (const item of socials) {
        if (item.id) {
          const existing = await prisma.socialMediaAcc.findUnique({ where: { id: item.id } });
          if (existing) {
            const nextDraftUrl = item.draftUrl !== undefined ? item.draftUrl : item.url;
            const nextDraftIsActive = item.draftIsActive !== undefined ? item.draftIsActive : item.isActive;

            if (existing.draftUrl !== nextDraftUrl || existing.draftIsActive !== nextDraftIsActive) {
              await prisma.socialMediaAcc.update({
                where: { id: item.id },
                data: {
                  draftUrl: nextDraftUrl,
                  draftIsActive: nextDraftIsActive
                }
              });
              await prisma.websiteChangeHistory.create({
                data: {
                  section: 'Social Media',
                  fieldName: existing.platform,
                  previousVal: existing.draftUrl || existing.url,
                  newVal: nextDraftUrl,
                  action: 'SAVE_DRAFT',
                  actorUserId: actorUser?.id,
                  actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
                  actorEmail: actorUser?.email,
                  actorRole: actorUser?.role
                }
              });
              changeCount++;
            }
          }
        }
      }
    }

    // Process Media Items
    if (media && Array.isArray(media)) {
      for (const item of media) {
        if (item.id) {
          const existing = await prisma.websiteMedia.findUnique({ where: { id: item.id } });
          if (existing) {
            if (
              existing.draftUrl !== item.draftUrl ||
              existing.draftTitle !== item.draftTitle ||
              existing.draftDescription !== item.draftDescription ||
              existing.section !== item.section ||
              existing.category !== item.category
            ) {
              await prisma.websiteMedia.update({
                where: { id: item.id },
                data: {
                  draftUrl: item.draftUrl,
                  draftTitle: item.draftTitle || item.title,
                  draftDescription: item.draftDescription || item.description,
                  section: item.section || existing.section,
                  category: item.category || existing.category
                }
              });
              await prisma.websiteChangeHistory.create({
                data: {
                  section: 'Images & Media',
                  fieldName: existing.title,
                  previousVal: existing.draftUrl,
                  newVal: item.draftUrl,
                  action: 'SAVE_DRAFT',
                  actorUserId: actorUser?.id,
                  actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
                  actorEmail: actorUser?.email,
                  actorRole: actorUser?.role
                }
              });
              changeCount++;
            }
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: changeCount > 0 ? 'Draft saved successfully' : 'No changes detected to save',
      changeCount
    });
  } catch (error: any) {
    console.error('Error saving website draft:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save website draft',
      error: error.message
    });
  }
};

// POST /api/website/admin/publish (Super Admin - Publish Draft Changes to Live)
export const publishWebsiteChanges = async (req: Request, res: Response) => {
  try {
    clearPublicWebsiteCache();
    const actorUser = (req as any).user;


    const contents = await prisma.websiteContent.findMany();
    for (const c of contents) {
      if (c.draftValue !== c.publishedValue) {
        await prisma.websiteContent.update({
          where: { id: c.id },
          data: { publishedValue: c.draftValue }
        });
        await prisma.websiteChangeHistory.create({
          data: {
            section: 'Website Content',
            fieldName: c.label || c.key,
            previousVal: c.publishedValue,
            newVal: c.draftValue,
            action: 'PUBLISH',
            actorUserId: actorUser?.id,
            actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
            actorEmail: actorUser?.email,
            actorRole: actorUser?.role
          }
        });
      }
    }

    const contacts = await prisma.contactInfo.findMany();
    for (const c of contacts) {
      if (c.draftValue !== c.publishedValue) {
        await prisma.contactInfo.update({
          where: { id: c.id },
          data: { publishedValue: c.draftValue }
        });
        await prisma.websiteChangeHistory.create({
          data: {
            section: 'Contact Information',
            fieldName: c.title || c.key,
            previousVal: c.publishedValue,
            newVal: c.draftValue,
            action: 'PUBLISH',
            actorUserId: actorUser?.id,
            actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
            actorEmail: actorUser?.email,
            actorRole: actorUser?.role
          }
        });
      }
    }

    const socials = await prisma.socialMediaAcc.findMany();
    for (const s of socials) {
      const draftUrl = s.draftUrl ?? s.url;
      const draftActive = s.draftIsActive ?? s.isActive;

      if (draftUrl !== s.url || draftActive !== s.isActive) {
        await prisma.socialMediaAcc.update({
          where: { id: s.id },
          data: {
            url: draftUrl,
            isActive: draftActive
          }
        });
        await prisma.websiteChangeHistory.create({
          data: {
            section: 'Social Media',
            fieldName: s.platform,
            previousVal: s.url,
            newVal: draftUrl,
            action: 'PUBLISH',
            actorUserId: actorUser?.id,
            actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
            actorEmail: actorUser?.email,
            actorRole: actorUser?.role
          }
        });
      }
    }

    const media = await prisma.websiteMedia.findMany();
    for (const m of media) {
      const nextTitle = m.draftTitle || m.title;
      const nextDesc = m.draftDescription || m.description;
      const nextCategory = m.draftCategory || m.category;
      const nextDisplayType = m.draftDisplayType || m.displayType;

      if (
        m.draftUrl !== m.publishedUrl ||
        nextTitle !== m.title ||
        nextDesc !== m.description ||
        m.status === 'DRAFT'
      ) {
        await prisma.websiteMedia.update({
          where: { id: m.id },
          data: {
            title: nextTitle,
            description: nextDesc,
            category: nextCategory,
            displayType: nextDisplayType,
            publishedUrl: m.draftUrl,
            altText: m.draftAltText || nextTitle,
            status: 'PUBLISHED'
          }
        });
        await prisma.websiteChangeHistory.create({
          data: {
            section: m.section,
            fieldName: nextTitle,
            previousVal: m.publishedUrl,
            newVal: m.draftUrl,
            action: 'PUBLISH',
            actorUserId: actorUser?.id,
            actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
            actorEmail: actorUser?.email,
            actorRole: actorUser?.role
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'All draft changes published to live website successfully'
    });
  } catch (error: any) {
    console.error('Error publishing website changes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to publish website changes',
      error: error.message
    });
  }
};

// POST /api/website/admin/discard (Super Admin - Discard Draft Changes)
export const discardWebsiteDraft = async (req: Request, res: Response) => {
  try {
    const actorUser = (req as any).user;

    const contents = await prisma.websiteContent.findMany();
    for (const c of contents) {
      if (c.draftValue !== c.publishedValue) {
        await prisma.websiteContent.update({
          where: { id: c.id },
          data: { draftValue: c.publishedValue }
        });
      }
    }

    const contacts = await prisma.contactInfo.findMany();
    for (const c of contacts) {
      if (c.draftValue !== c.publishedValue) {
        await prisma.contactInfo.update({
          where: { id: c.id },
          data: { draftValue: c.publishedValue }
        });
      }
    }

    const socials = await prisma.socialMediaAcc.findMany();
    for (const s of socials) {
      await prisma.socialMediaAcc.update({
        where: { id: s.id },
        data: {
          draftUrl: s.url,
          draftIsActive: s.isActive
        }
      });
    }

    const media = await prisma.websiteMedia.findMany();
    for (const m of media) {
      if (m.status === 'DRAFT' && !m.publishedUrl) {
        // Remove draft-only unpublished new record
        await prisma.websiteMedia.delete({ where: { id: m.id } });
      } else {
        await prisma.websiteMedia.update({
          where: { id: m.id },
          data: {
            draftUrl: m.publishedUrl,
            draftTitle: m.title,
            draftDescription: m.description,
            draftCategory: m.category,
            draftDisplayType: m.displayType,
            status: 'PUBLISHED'
          }
        });
      }
    }

    await prisma.websiteChangeHistory.create({
      data: {
        section: 'General',
        fieldName: 'All Draft Content',
        previousVal: 'Draft state',
        newVal: 'Reverted to Live Published state',
        action: 'DISCARD_DRAFT',
        actorUserId: actorUser?.id,
        actorName: `${actorUser?.firstName || ''} ${actorUser?.lastName || ''}`.trim(),
        actorEmail: actorUser?.email,
        actorRole: actorUser?.role
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Draft changes discarded successfully. Reverted to live published content.'
    });
  } catch (error: any) {
    console.error('Error discarding website draft:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to discard website draft',
      error: error.message
    });
  }
};

// GET /api/website/admin/history (Super Admin - Audit History Log)
export const getWebsiteChangeHistory = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.websiteChangeHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error: any) {
    console.error('Error fetching website change history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch change history log',
      error: error.message
    });
  }
};
