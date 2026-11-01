const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const PROMOTIONS_FILE = path.join(__dirname, '..', 'data', 'promotions.json');

const loadPromotions = () => {
  try {
    if (fs.existsSync(PROMOTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(PROMOTIONS_FILE, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('Error loading promotions.json:', err.message);
  }
  return [];
};

const savePromotions = (data) => {
  try {
    fs.writeFileSync(PROMOTIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving promotions.json:', err.message);
    return false;
  }
};

/**
 * 1. GET /api/promotions
 * Get list of active sponsored ads (for student/public display) or all (with ?all=true for admin)
 */
router.get('/api/promotions', (req, res) => {
  try {
    const { all } = req.query;
    let list = loadPromotions();

    if (all !== 'true') {
      list = list.filter(item => item.status === 'active');
      // Increment views count on active list retrieval
      let modified = false;
      const fullList = loadPromotions();
      fullList.forEach(item => {
        if (item.status === 'active') {
          item.viewsCount = (item.viewsCount || 0) + 1;
          modified = true;
        }
      });
      if (modified) {
        savePromotions(fullList);
      }
    }

    return res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'বিজ্ঞাপন লোড করতে সমস্যা হয়েছে: ' + err.message });
  }
});

/**
 * 2. POST /api/promotions/:id/click
 * Track clicks on sponsored ads
 */
router.post('/api/promotions/:id/click', (req, res) => {
  try {
    const { id } = req.params;
    const list = loadPromotions();
    const item = list.find(p => p.id === id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'বিজ্ঞাপন ক্যাম্পেইন পাওয়া যায়নি' });
    }

    item.clicksCount = (item.clicksCount || 0) + 1;
    savePromotions(list);

    return res.json({
      success: true,
      message: 'Click counted successfully',
      targetUrl: item.targetUrl,
      clicksCount: item.clicksCount
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 3. POST /api/promotions
 * Admin create new or update sponsored ad
 */
router.post('/api/promotions', (req, res) => {
  try {
    const { id, institutionName, campaignTitle, tagline, badge, logo, programs, waiverText, targetUrl, status } = req.body;

    if (!institutionName || !campaignTitle || !targetUrl) {
      return res.status(400).json({ success: false, message: 'প্রতিষ্ঠানের নাম, ক্যাম্পেইনের টাইটেল এবং ওয়েবসাইট লিংক আবশ্যক।' });
    }

    const list = loadPromotions();
    const existingIndex = list.findIndex(p => p.id === id);

    if (existingIndex !== -1) {
      // Update
      list[existingIndex] = {
        ...list[existingIndex],
        institutionName,
        campaignTitle,
        tagline: tagline || '',
        badge: badge || '⭐ Sponsored Listing',
        logo: logo || '🏛️',
        programs: Array.isArray(programs) ? programs : (typeof programs === 'string' ? programs.split(',').map(s => s.trim()) : []),
        waiverText: waiverText || '',
        targetUrl,
        status: status || list[existingIndex].status || 'active',
        updatedAt: new Date().toISOString()
      };
      savePromotions(list);
      return res.json({ success: true, message: 'বিজ্ঞাপন সফলভাবে আপডেট করা হয়েছে', data: list[existingIndex] });
    } else {
      // Create new
      const newAd = {
        id: id || `ad-${Date.now()}`,
        institutionName,
        campaignTitle,
        tagline: tagline || '',
        badge: badge || '🌟 Featured Partner (বিজ্ঞাপন)',
        logo: logo || '🏛️',
        programs: Array.isArray(programs) ? programs : (typeof programs === 'string' ? programs.split(',').map(s => s.trim()) : []),
        waiverText: waiverText || '',
        targetUrl,
        viewsCount: 0,
        clicksCount: 0,
        status: status || 'active',
        createdAt: new Date().toISOString()
      };
      list.unshift(newAd);
      savePromotions(list);
      return res.json({ success: true, message: 'নতুন বিজ্ঞাপন পার্টনার সফলভাবে যুক্ত হয়েছে', data: newAd });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'সংরক্ষণে সমস্যা হয়েছে: ' + err.message });
  }
});

/**
 * 4. DELETE /api/promotions/:id
 * Admin delete sponsored ad
 */
router.delete('/api/promotions/:id', (req, res) => {
  try {
    const { id } = req.params;
    let list = loadPromotions();
    const initialLen = list.length;
    list = list.filter(p => p.id !== id);

    if (list.length === initialLen) {
      return res.status(404).json({ success: false, message: 'বিজ্ঞাপন পাওয়া যায়নি' });
    }

    savePromotions(list);
    return res.json({ success: true, message: 'বিজ্ঞাপন মুছে ফেলা হয়েছে' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
