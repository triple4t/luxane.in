import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
// Get all site settings
export const getSiteSettings = async (req, res) => {
    try {
        const settings = await prisma.siteSettings.findMany();
        const settingsObj = {};
        settings.forEach(setting => {
            try {
                settingsObj[setting.key] = setting.type === 'json'
                    ? JSON.parse(setting.value)
                    : setting.value;
            }
            catch {
                settingsObj[setting.key] = setting.value;
            }
        });
        res.json({ success: true, data: settingsObj });
    }
    catch (error) {
        throw new AppError('Failed to fetch site settings', 500);
    }
};
// Update site setting
export const updateSiteSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value, type, category, description } = req.body;
        const settingValue = type === 'json' ? JSON.stringify(value) : String(value);
        const setting = await prisma.siteSettings.upsert({
            where: { key },
            update: {
                value: settingValue,
                type: type || 'text',
                category: category || 'general',
                description,
            },
            create: {
                key,
                value: settingValue,
                type: type || 'text',
                category: category || 'general',
                description,
            },
        });
        res.json({ success: true, data: setting });
    }
    catch (error) {
        throw new AppError('Failed to update site setting', 500);
    }
};
// Navigation Links
export const getNavigationLinks = async (req, res) => {
    try {
        const links = await prisma.navigationLink.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: links });
    }
    catch (error) {
        throw new AppError('Failed to fetch navigation links', 500);
    }
};
export const getAllNavigationLinks = async (req, res) => {
    try {
        const links = await prisma.navigationLink.findMany({
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: links });
    }
    catch (error) {
        throw new AppError('Failed to fetch navigation links', 500);
    }
};
export const createNavigationLink = async (req, res) => {
    try {
        const link = await prisma.navigationLink.create({
            data: req.body,
        });
        res.json({ success: true, data: link });
    }
    catch (error) {
        throw new AppError('Failed to create navigation link', 500);
    }
};
export const updateNavigationLink = async (req, res) => {
    try {
        const { id } = req.params;
        const link = await prisma.navigationLink.update({
            where: { id },
            data: req.body,
        });
        res.json({ success: true, data: link });
    }
    catch (error) {
        throw new AppError('Failed to update navigation link', 500);
    }
};
export const deleteNavigationLink = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.navigationLink.delete({ where: { id } });
        res.json({ success: true, message: 'Link deleted' });
    }
    catch (error) {
        throw new AppError('Failed to delete navigation link', 500);
    }
};
// Announcements
export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: announcements });
    }
    catch (error) {
        throw new AppError('Failed to fetch announcements', 500);
    }
};
export const getAllAnnouncements = async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: announcements });
    }
    catch (error) {
        throw new AppError('Failed to fetch announcements', 500);
    }
};
export const createAnnouncement = async (req, res) => {
    try {
        const announcement = await prisma.announcement.create({
            data: req.body,
        });
        res.json({ success: true, data: announcement });
    }
    catch (error) {
        throw new AppError('Failed to create announcement', 500);
    }
};
export const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await prisma.announcement.update({
            where: { id },
            data: req.body,
        });
        res.json({ success: true, data: announcement });
    }
    catch (error) {
        throw new AppError('Failed to update announcement', 500);
    }
};
export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.announcement.delete({ where: { id } });
        res.json({ success: true, message: 'Announcement deleted' });
    }
    catch (error) {
        throw new AppError('Failed to delete announcement', 500);
    }
};
// Hero Section
export const getHeroSection = async (req, res) => {
    try {
        const hero = await prisma.heroSection.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: hero });
    }
    catch (error) {
        throw new AppError('Failed to fetch hero section', 500);
    }
};
export const getAllHeroSections = async (req, res) => {
    try {
        const heroes = await prisma.heroSection.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data: heroes });
    }
    catch (error) {
        throw new AppError('Failed to fetch hero sections', 500);
    }
};
export const createHeroSection = async (req, res) => {
    try {
        // Deactivate all other hero sections if this one is active
        if (req.body.isActive !== false) {
            await prisma.heroSection.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });
        }
        const hero = await prisma.heroSection.create({
            data: req.body,
        });
        res.json({ success: true, data: hero });
    }
    catch (error) {
        throw new AppError('Failed to create hero section', 500);
    }
};
export const updateHeroSection = async (req, res) => {
    try {
        const { id } = req.params;
        // If activating this hero, deactivate others
        if (req.body.isActive === true) {
            await prisma.heroSection.updateMany({
                where: {
                    isActive: true,
                    NOT: { id },
                },
                data: { isActive: false },
            });
        }
        const hero = await prisma.heroSection.update({
            where: { id },
            data: req.body,
        });
        res.json({ success: true, data: hero });
    }
    catch (error) {
        throw new AppError('Failed to update hero section', 500);
    }
};
export const deleteHeroSection = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.heroSection.delete({ where: { id } });
        res.json({ success: true, message: 'Hero section deleted' });
    }
    catch (error) {
        throw new AppError('Failed to delete hero section', 500);
    }
};
// Footer Sections
export const getFooterSections = async (req, res) => {
    try {
        const sections = await prisma.footerSection.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        const sectionsWithLinks = sections.map(section => ({
            ...section,
            links: JSON.parse(section.links || '[]'),
        }));
        res.json({ success: true, data: sectionsWithLinks });
    }
    catch (error) {
        throw new AppError('Failed to fetch footer sections', 500);
    }
};
export const getAllFooterSections = async (req, res) => {
    try {
        const sections = await prisma.footerSection.findMany({
            orderBy: { order: 'asc' },
        });
        const sectionsWithLinks = sections.map(section => ({
            ...section,
            links: JSON.parse(section.links || '[]'),
        }));
        res.json({ success: true, data: sectionsWithLinks });
    }
    catch (error) {
        throw new AppError('Failed to fetch footer sections', 500);
    }
};
export const createFooterSection = async (req, res) => {
    try {
        const section = await prisma.footerSection.create({
            data: {
                ...req.body,
                links: JSON.stringify(req.body.links || []),
            },
        });
        res.json({ success: true, data: { ...section, links: req.body.links || [] } });
    }
    catch (error) {
        throw new AppError('Failed to create footer section', 500);
    }
};
export const updateFooterSection = async (req, res) => {
    try {
        const { id } = req.params;
        const section = await prisma.footerSection.update({
            where: { id },
            data: {
                ...req.body,
                links: req.body.links ? JSON.stringify(req.body.links) : undefined,
            },
        });
        res.json({
            success: true,
            data: {
                ...section,
                links: req.body.links ? req.body.links : JSON.parse(section.links || '[]')
            }
        });
    }
    catch (error) {
        throw new AppError('Failed to update footer section', 500);
    }
};
export const deleteFooterSection = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.footerSection.delete({ where: { id } });
        res.json({ success: true, message: 'Footer section deleted' });
    }
    catch (error) {
        throw new AppError('Failed to delete footer section', 500);
    }
};
// Social Links
export const getSocialLinks = async (req, res) => {
    try {
        const links = await prisma.socialLink.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: links });
    }
    catch (error) {
        throw new AppError('Failed to fetch social links', 500);
    }
};
export const getAllSocialLinks = async (req, res) => {
    try {
        const links = await prisma.socialLink.findMany({
            orderBy: { order: 'asc' },
        });
        res.json({ success: true, data: links });
    }
    catch (error) {
        throw new AppError('Failed to fetch social links', 500);
    }
};
export const createSocialLink = async (req, res) => {
    try {
        const link = await prisma.socialLink.create({
            data: req.body,
        });
        res.json({ success: true, data: link });
    }
    catch (error) {
        throw new AppError('Failed to create social link', 500);
    }
};
export const updateSocialLink = async (req, res) => {
    try {
        const { id } = req.params;
        const link = await prisma.socialLink.update({
            where: { id },
            data: req.body,
        });
        res.json({ success: true, data: link });
    }
    catch (error) {
        throw new AppError('Failed to update social link', 500);
    }
};
export const deleteSocialLink = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.socialLink.delete({ where: { id } });
        res.json({ success: true, message: 'Social link deleted' });
    }
    catch (error) {
        throw new AppError('Failed to delete social link', 500);
    }
};
// Homepage Sections
export const getHomepageSections = async (req, res) => {
    try {
        const sections = await prisma.homepageSection.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        const sectionsWithConfig = sections.map(section => ({
            ...section,
            config: JSON.parse(section.config || '{}'),
        }));
        res.json({ success: true, data: sectionsWithConfig });
    }
    catch (error) {
        throw new AppError('Failed to fetch homepage sections', 500);
    }
};
export const getAllHomepageSections = async (req, res) => {
    try {
        const sections = await prisma.homepageSection.findMany({
            orderBy: { order: 'asc' },
        });
        const sectionsWithConfig = sections.map(section => ({
            ...section,
            config: JSON.parse(section.config || '{}'),
        }));
        res.json({ success: true, data: sectionsWithConfig });
    }
    catch (error) {
        throw new AppError('Failed to fetch homepage sections', 500);
    }
};
export const createHomepageSection = async (req, res) => {
    try {
        const section = await prisma.homepageSection.create({
            data: {
                ...req.body,
                config: JSON.stringify(req.body.config || {}),
            },
        });
        res.json({ success: true, data: { ...section, config: req.body.config || {} } });
    }
    catch (error) {
        throw new AppError('Failed to create homepage section', 500);
    }
};
export const updateHomepageSection = async (req, res) => {
    try {
        const { id } = req.params;
        const section = await prisma.homepageSection.update({
            where: { id },
            data: {
                ...req.body,
                config: req.body.config ? JSON.stringify(req.body.config) : undefined,
            },
        });
        res.json({
            success: true,
            data: {
                ...section,
                config: req.body.config ? req.body.config : JSON.parse(section.config || '{}')
            }
        });
    }
    catch (error) {
        throw new AppError('Failed to update homepage section', 500);
    }
};
export const deleteHomepageSection = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.homepageSection.delete({ where: { id } });
        res.json({ success: true, message: 'Homepage section deleted' });
    }
    catch (error) {
        throw new AppError('Failed to delete homepage section', 500);
    }
};
