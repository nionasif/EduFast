const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getDb } = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const loadFallbackAdmissions = () => {
  try {
    const fPath = path.join(__dirname, '..', 'data', 'admissions.json');
    if (fs.existsSync(fPath)) {
      return JSON.parse(fs.readFileSync(fPath, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('Error loading fallback admissions.json:', err.message);
  }
  return [];
};

/**
 * 1. GET /api/universities - Fetch all admission circulars, requirements, admit cards & results
 */
router.get('/api/universities', async (req, res) => {
  try {
    const db = getDb();
    const { search, group } = req.query;

    let query = 'SELECT * FROM universities WHERE 1=1';
    const params = [];

    if (search && search.trim()) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s);
    }

    query += ' ORDER BY deadline ASC';
    let rows = await db.all(query, params);

    // If SQLite table is empty or has fewer items, merge with admissions.json
    if (!rows || rows.length === 0) {
      let fallback = loadFallbackAdmissions();
      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        fallback = fallback.filter(u => u.name.toLowerCase().includes(s) || (u.description && u.description.toLowerCase().includes(s)));
      }
      if (group && group !== 'All') {
        fallback = fallback.map(u => ({
          ...u,
          units: (u.units || []).filter(un => !un.group || un.group.toLowerCase() === group.toLowerCase())
        }));
      }
      return res.json({ success: true, count: fallback.length, data: fallback });
    }

    const formatted = rows.map((u) => {
      let units = [];
      if (u.unitsJson) {
        try {
          units = JSON.parse(u.unitsJson);
        } catch {
          units = [];
        }
      }

      if (group && group !== 'All') {
        units = units.filter(un => !un.group || un.group.toLowerCase() === group.toLowerCase());
      }

      return {
        id: u.id,
        name: u.name,
        logo: u.logo || '🏛️',
        description: u.description || '',
        deadline: u.deadline,
        examDate: u.examDate,
        applicationFee: Number(u.applicationFee) || 1000,
        admitCardUrl: u.admitCardUrl || null,
        admitCardStatus: u.admitCardStatus || 'upcoming',
        resultUrl: u.resultUrl || null,
        resultStatus: u.resultStatus || 'pending',
        examCenter: u.examCenter || '',
        reportingTime: u.reportingTime || '',
        units
      };
    });

    return res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    console.error('Error fetching universities:', err.message);
    const fallback = loadFallbackAdmissions();
    return res.json({ success: true, count: fallback.length, data: fallback });
  }
});

/**
 * 2. GET /api/universities/:id - Single University Details
 */
router.get('/api/universities/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const u = await db.get('SELECT * FROM universities WHERE id = ?', [id]);
    if (!u) {
      const fallback = loadFallbackAdmissions();
      const found = fallback.find(item => item.id === id);
      if (found) {
        return res.json({ success: true, data: found });
      }
      return res.status(404).json({ success: false, error: 'University circular not found.' });
    }

    let units = [];
    if (u.unitsJson) {
      try {
        units = JSON.parse(u.unitsJson);
      } catch {
        units = [];
      }
    }

    return res.json({
      success: true,
      data: {
        id: u.id,
        name: u.name,
        logo: u.logo || '🏛️',
        description: u.description || '',
        deadline: u.deadline,
        examDate: u.examDate,
        applicationFee: Number(u.applicationFee) || 1000,
        admitCardUrl: u.admitCardUrl || null,
        admitCardStatus: u.admitCardStatus || 'upcoming',
        resultUrl: u.resultUrl || null,
        resultStatus: u.resultStatus || 'pending',
        examCenter: u.examCenter || '',
        reportingTime: u.reportingTime || '',
        units
      }
    });
  } catch (err) {
    console.error('Error fetching university:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to retrieve university details.' });
  }
});

/**
 * 3. POST /api/universities - Create University (Admin)
 */
router.post('/api/universities', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const db = getDb();
    const {
      id, name, logo, description, deadline, examDate, applicationFee, units,
      admitCardUrl, admitCardStatus, resultUrl, resultStatus, examCenter, reportingTime
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'University name is required.' });
    }

    const univId = id || 'univ-' + Date.now();
    const unitsStr = JSON.stringify(units || []);

    await db.run(
      `INSERT OR REPLACE INTO universities 
       (id, name, logo, description, deadline, examDate, applicationFee, unitsJson,
        admitCardUrl, admitCardStatus, resultUrl, resultStatus, examCenter, reportingTime)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        univId,
        name,
        logo || '🏛️',
        description || '',
        deadline || '',
        examDate || '',
        Number(applicationFee) || 1000,
        unitsStr,
        admitCardUrl || '',
        admitCardStatus || 'upcoming',
        resultUrl || '',
        resultStatus || 'pending',
        examCenter || '',
        reportingTime || ''
      ]
    );

    const inserted = await db.get('SELECT * FROM universities WHERE id = ?', [univId]);
    return res.status(201).json({ success: true, message: 'University circular added.', data: inserted });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to save university: ' + err.message });
  }
});

module.exports = router;
