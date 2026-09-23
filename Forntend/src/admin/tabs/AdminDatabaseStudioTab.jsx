import React, { useState, useEffect, useMemo } from 'react';

const BACKEND_URL = 'http://localhost:5001';

export default function AdminDatabaseStudioTab({ addToast = () => {} }) {
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState('users_auth');
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // DATA Files Studio States
  const [studioMode, setStudioMode] = useState('tables'); // 'tables' | 'data_files'
  const [dataFiles, setDataFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('courses.json');
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileSaving, setFileSaving] = useState(false);
  const [jsonError, setJsonError] = useState(null);

  const fetchDataFiles = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/data/files`);
      const data = await res.json();
      if (data.success && data.data) {
        setDataFiles(data.data);
      }
    } catch (e) {
      console.error('Error fetching data files:', e);
    }
  };

  const loadFileContent = async (fname) => {
    setFileLoading(true);
    setJsonError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/data/file/${fname}`);
      const data = await res.json();
      if (data.success) {
        setFileContent(JSON.stringify(data.data, null, 2));
      } else {
        addToast(data.error || 'Failed to load file', 'error');
      }
    } catch (e) {
      addToast('Error loading file content', 'error');
    } finally {
      setFileLoading(false);
    }
  };

  const handleSelectFile = (fname) => {
    setSelectedFile(fname);
    loadFileContent(fname);
  };

  const handleSaveFileContent = async () => {
    setFileSaving(true);
    setJsonError(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(fileContent);
      } catch (err) {
        setJsonError('Invalid JSON format: ' + err.message);
        addToast('Invalid JSON syntax. Please check for errors.', 'error');
        setFileSaving(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/data/file/${selectedFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: parsed })
      });
      const data = await res.json();
      if (data.success) {
        addToast(`✅ Saved ${selectedFile} successfully (${data.itemCount} items)!`, 'success');
        
        if (selectedFile === 'courses.json') {
          localStorage.setItem('edufast_dynamic_courses', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'course', action: 'save' } }));
        } else if (selectedFile === 'admissions.json') {
          localStorage.setItem('edufast_dynamic_admissions', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'admission', action: 'save' } }));
        } else if (selectedFile === 'mockTests.json') {
          localStorage.setItem('edufast_dynamic_mock_tests', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'mock_tests', action: 'save' } }));
        } else if (selectedFile === 'liveClasses.json') {
          localStorage.setItem('edufast_live_classes', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'live_classes', action: 'save' } }));
        } else if (selectedFile === 'questionBank.json') {
          localStorage.setItem('edufast_question_bank', JSON.stringify(parsed));
          window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'question_bank', action: 'save' } }));
        }

        fetchDataFiles();
      } else {
        addToast(data.error || 'Failed to save file', 'error');
      }
    } catch (e) {
      addToast('Error saving file: ' + e.message, 'error');
    } finally {
      setFileSaving(false);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(fileContent);
      setFileContent(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      addToast('JSON formatted cleanly', 'success');
    } catch (err) {
      setJsonError('Cannot format invalid JSON: ' + err.message);
    }
  };

  const handleDownloadFile = () => {
    try {
      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`Downloaded ${selectedFile}`, 'success');
    } catch (e) {
      addToast('Download failed', 'error');
    }
  };

  // 1. Fetch tables list
  const fetchTables = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/db/tables`);
      const data = await res.json();
      if (data.success && data.data) {
        setTables(data.data);
        if (!activeTable && data.data.length > 0) {
          setActiveTable(data.data[0].name);
        }
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // 2. Fetch rows for active table
  const fetchTableData = async (tableName, search = '') => {
    if (!tableName) return;
    setIsLoading(true);
    try {
      const url = new URL(`${BACKEND_URL}/api/admin/db/table/${tableName}`);
      if (search) url.searchParams.append('search', search);
      url.searchParams.append('limit', '100');

      const res = await fetch(url);
      const data = await res.json();
      setIsLoading(false);

      if (data.success) {
        setRows(data.data || []);
        setColumns(data.columns || []);
        setTotalCount(data.totalCount || 0);
      } else {
        addToast(data.error || 'Failed to load table data', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Error fetching table rows:', err);
      addToast('Network error loading database records', 'error');
    }
  };

  useEffect(() => {
    fetchTableData(activeTable, searchQuery);
  }, [activeTable]);

  // Handle live search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTableData(activeTable, searchQuery);
  };

  // Open Add Record Modal
  const openAddModal = () => {
    const initialForm = {};
    columns.forEach(c => {
      if (!c.isPk && c.name !== 'createdAt') {
        initialForm[c.name] = '';
      }
    });
    setFormData(initialForm);
    setIsAddModalOpen(true);
  };

  // Save New Record
  const handleSaveNewRecord = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/db/table/${activeTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setIsSaving(false);

      if (data.success) {
        addToast('New record created successfully!', 'success');
        setIsAddModalOpen(false);
        fetchTableData(activeTable, searchQuery);
        fetchTables();
      } else {
        addToast(data.error || 'Failed to insert record', 'error');
      }
    } catch (err) {
      setIsSaving(false);
      addToast('Error inserting record', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (row) => {
    setSelectedRow(row);
    setFormData({ ...row });
    setIsEditModalOpen(true);
  };

  // Save Edit Record
  const handleSaveEditRecord = async (e) => {
    e.preventDefault();
    if (!selectedRow) return;
    const pkCol = columns.find(c => c.isPk) || { name: 'id' };
    const pkVal = selectedRow[pkCol.name];

    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/db/table/${activeTable}/${pkVal}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setIsSaving(false);

      if (data.success) {
        addToast('Record updated successfully!', 'success');
        setIsEditModalOpen(false);
        fetchTableData(activeTable, searchQuery);
      } else {
        addToast(data.error || 'Failed to update record', 'error');
      }
    } catch (err) {
      setIsSaving(false);
      addToast('Error updating record', 'error');
    }
  };

  // Open Delete Modal
  const openDeleteModal = (row) => {
    setSelectedRow(row);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!selectedRow) return;
    const pkCol = columns.find(c => c.isPk) || { name: 'id' };
    const pkVal = selectedRow[pkCol.name];

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/db/table/${activeTable}/${pkVal}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        addToast('Record deleted successfully!', 'info');
        setIsDeleteModalOpen(false);
        fetchTableData(activeTable, searchQuery);
        fetchTables();
      } else {
        addToast(data.error || 'Failed to delete record', 'error');
      }
    } catch (err) {
      addToast('Error deleting record', 'error');
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rows, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `${activeTable}_export_${Date.now()}.json`);
    dlAnchor.click();
    addToast(`Exported ${rows.length} records as JSON`, 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", encodedUri);
    dlAnchor.setAttribute("download", `${activeTable}_export_${Date.now()}.csv`);
    dlAnchor.click();
    addToast(`Exported ${rows.length} records as CSV`, 'success');
  };

  const activeTableInfo = tables.find(t => t.name === activeTable);

  return (
    <div className="admin-db-studio-tab" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🗄️</span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Database Studio & Explorer
            </h2>
            <span style={{
              backgroundColor: studioMode === 'tables' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              color: studioMode === 'tables' ? '#34d399' : '#38bdf8',
              border: studioMode === 'tables' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              {studioMode === 'tables' ? 'SQLite WAL Active' : 'Live DATA/ Sync Active'}
            </span>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
            {studioMode === 'tables' 
              ? 'Browse, search, edit, add, and manage your structured database tables directly in real time.'
              : 'Course Hub, Question Bank, Admissions এবং Mock Tests-এর পৃথক DATA ফাইলগুলো সরাসরি পর্যবেক্ষণ ও এডিট করুন।'}
          </p>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setStudioMode('tables')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: studioMode === 'tables' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: studioMode === 'tables' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: studioMode === 'tables' ? '#34d399' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              🗄️ Database Tables (SQLite)
            </button>
            <button
              type="button"
              onClick={() => {
                setStudioMode('data_files');
                fetchDataFiles();
                loadFileContent(selectedFile || 'courses.json');
              }}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: studioMode === 'data_files' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: studioMode === 'data_files' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: studioMode === 'data_files' ? '#38bdf8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              📁 DATA Files Studio (JSON)
            </button>
          </div>
        </div>

        {studioMode === 'tables' ? (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-teal"
              onClick={openAddModal}
              style={{
                padding: '0.6rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.85rem'
              }}
            >
              <span>➕</span> Add Record
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportCSV}
              disabled={rows.length === 0}
              style={{ padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}
            >
              📥 Export CSV
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportJSON}
              disabled={rows.length === 0}
              style={{ padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}
            >
              📥 Export JSON
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleFormatJson}
              disabled={fileLoading || !fileContent}
              style={{ padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}
            >
              ✨ Format JSON
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => loadFileContent(selectedFile)}
              disabled={fileLoading}
              style={{ padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}
            >
              🔄 Reload
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadFile}
              disabled={fileLoading || !fileContent}
              style={{ padding: '0.6rem 0.9rem', fontSize: '0.82rem' }}
            >
              📥 Download
            </button>
            <button
              type="button"
              className="btn btn-teal"
              onClick={handleSaveFileContent}
              disabled={fileSaving || fileLoading}
              style={{
                padding: '0.6rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.85rem',
                fontWeight: 700
              }}
            >
              <span>{fileSaving ? '⏳ Saving...' : '💾 Save to File'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. DATA FILES STUDIO VIEW */}
      {/* ------------------------------------------------------------- */}
      {studioMode === 'data_files' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* File Pills */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            scrollbarWidth: 'thin'
          }}>
            {[
              { name: 'courses.json', icon: '📚', label: 'Course Hub (courses.json)' },
              { name: 'admissions.json', icon: '🏛️', label: 'Admissions (admissions.json)' },
              { name: 'questions.json', icon: '❓', label: 'Questions (questions.json)' },
              { name: 'questionBank.json', icon: '📦', label: 'Question Bank (questionBank.json)' },
              { name: 'mockTests.json', icon: '📝', label: 'Mock Tests (mockTests.json)' },
              { name: 'liveClasses.json', icon: '🔴', label: 'Live Classes (liveClasses.json)' },
              { name: 'doubts.json', icon: '💬', label: 'Doubts (doubts.json)' }
            ].map(f => {
              const meta = dataFiles.find(d => d.name === f.name);
              const isSelected = selectedFile === f.name;
              return (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => handleSelectFile(f.name)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: '12px',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(30, 41, 59, 0.7)',
                    color: isSelected ? '#38bdf8' : '#cbd5e1',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                  {meta && (
                    <span style={{
                      backgroundColor: isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
                      color: isSelected ? '#0f172a' : '#94a3b8',
                      padding: '1px 7px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {meta.itemCount} items
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Editor Container */}
          <div style={{
            backgroundColor: '#0b0f19',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#38bdf8' }}>
                  📄 DATA/{selectedFile}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                  {fileLoading ? 'Loading...' : `${(fileContent.length / 1024).toFixed(2)} KB`}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>⚡</span> রিয়েল-টাইম ডিস্ক রাইটিং সক্রিয়
              </span>
            </div>

            {jsonError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                padding: '0.6rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.8rem'
              }}>
                ⚠️ {jsonError}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <textarea
                value={fileContent}
                onChange={(e) => {
                  setFileContent(e.target.value);
                  setJsonError(null);
                }}
                disabled={fileLoading}
                placeholder="JSON data will appear here..."
                rows={22}
                style={{
                  width: '100%',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.86rem',
                  lineHeight: '1.5',
                  backgroundColor: '#030712',
                  color: '#e0e7ff',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  whiteSpace: 'pre'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
              <span>💡 টিপস: আপনি সরাসরি এই এডিটরে JSON পরিমার্জন করে "Save to File" এ ক্লিক করলেই ফাইল ও ডেটাবেস উভয়ই আপডেট হয়ে যাবে।</span>
              <span>Encoding: UTF-8 (JSON)</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SQLITE TABLES VIEW (Default) */}
      {/* ------------------------------------------------------------- */}
      {studioMode === 'tables' && (
        <div>
          {/* Table Selection Pills */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            scrollbarWidth: 'thin'
          }}>
            {tables.map(tab => (
              <button
                key={tab.name}
                type="button"
                onClick={() => { setActiveTable(tab.name); setSearchQuery(''); }}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '12px',
                  border: activeTable === tab.name ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: activeTable === tab.name ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.7)',
                  color: activeTable === tab.name ? '#34d399' : '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span style={{
                  backgroundColor: activeTable === tab.name ? '#10b981' : 'rgba(255, 255, 255, 0.12)',
                  color: activeTable === tab.name ? '#022c22' : '#94a3b8',
                  padding: '1px 7px',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700
                }}>
                  {tab.rowCount}
                </span>
              </button>
            ))}
          </div>

      {/* Search Bar & Stats Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '0.75rem 1rem'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder={`Search records in ${activeTable}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '0.5rem 0.85rem',
              color: '#ffffff',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          />
          <button type="submit" className="btn btn-teal" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            🔍 Search
          </button>
          {searchQuery && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setSearchQuery(''); fetchTableData(activeTable, ''); }}
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
            >
              Clear
            </button>
          )}
        </form>

        <div style={{ color: '#94a3b8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Showing <strong>{rows.length}</strong> of <strong>{totalCount}</strong> records</span>
          <button
            type="button"
            onClick={() => fetchTableData(activeTable, searchQuery)}
            style={{
              background: 'none',
              border: 'none',
              color: '#38bdf8',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span>Loading records from {activeTable}...</span>
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#f8fafc', fontSize: '1rem' }}>No records found</h4>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>
              {searchQuery ? `No records matched your search "${searchQuery}".` : `Table "${activeTable}" currently has 0 rows.`}
            </p>
            <button
              type="button"
              className="btn btn-teal"
              onClick={openAddModal}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.82rem' }}
            >
              ➕ Add First Record
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700, width: '110px' }}>Actions</th>
                  {columns.map(col => (
                    <th key={col.name} style={{ padding: '12px 14px', color: '#cbd5e1', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {col.name}
                      {col.isPk && <span style={{ color: '#fbbf24', marginLeft: '4px', fontSize: '0.7rem' }}>🔑</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const pkCol = columns.find(c => c.isPk) || { name: 'id' };
                  const rowKey = row[pkCol.name] || idx;

                  return (
                    <tr
                      key={rowKey}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                      }}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            title="Edit Record"
                            style={{
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38bdf8',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(row)}
                            title="Delete Record"
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>

                      {columns.map(col => {
                        const val = row[col.name];
                        let displayVal = val === null || val === undefined ? '' : String(val);
                        const isLong = displayVal.length > 50;

                        return (
                          <td
                            key={col.name}
                            style={{
                              padding: '10px 14px',
                              color: '#e2e8f0',
                              maxWidth: '240px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={isLong ? displayVal : undefined}
                          >
                            {col.name === 'isVerified' ? (
                              <span style={{
                                backgroundColor: val ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: val ? '#34d399' : '#f87171',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 700
                              }}>
                                {val ? 'YES' : 'NO'}
                              </span>
                            ) : (
                              displayVal || <span style={{ color: '#64748b' }}>NULL</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )}

      {/* MODAL: ADD RECORD */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92vw', backgroundColor: '#0f172a', border: '1px solid rgba(16, 185, 129, 0.4)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#10b981', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>➕</span> Add Record to <span style={{ color: '#ffffff' }}>{activeTable}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveNewRecord} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {columns.filter(c => !c.isPk && c.name !== 'createdAt').map(col => (
                  <div key={col.name}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                      {col.name} <span style={{ color: '#64748b' }}>({col.type || 'TEXT'})</span>
                    </label>
                    <input
                      type="text"
                      value={formData[col.name] ?? ''}
                      onChange={e => setFormData({ ...formData, [col.name]: e.target.value })}
                      placeholder={`Enter ${col.name}...`}
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '0.55rem 0.75rem',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-teal"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem' }}
                >
                  {isSaving ? 'Saving...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT RECORD */}
      {isEditModalOpen && selectedRow && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92vw', backgroundColor: '#0f172a', border: '1px solid rgba(56, 189, 248, 0.4)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>✏️</span> Edit Record in <span style={{ color: '#ffffff' }}>{activeTable}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditRecord} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {columns.map(col => (
                  <div key={col.name}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                      {col.name} {col.isPk && <span style={{ color: '#fbbf24' }}>(Primary Key - Read Only)</span>}
                    </label>
                    <input
                      type="text"
                      disabled={col.isPk}
                      value={formData[col.name] ?? ''}
                      onChange={e => setFormData({ ...formData, [col.name]: e.target.value })}
                      style={{
                        width: '100%',
                        backgroundColor: col.isPk ? 'rgba(255, 255, 255, 0.05)' : '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '0.55rem 0.75rem',
                        color: col.isPk ? '#94a3b8' : '#ffffff',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '0.55rem 1rem', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-teal"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.82rem' }}
                >
                  {isSaving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE */}
      {isDeleteModalOpen && selectedRow && (
        <div className="modal-backdrop" onClick={() => setIsDeleteModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '440px', width: '90vw', backgroundColor: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.4)', textAlign: 'center', padding: '1.75rem' }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <h3 style={{ color: '#f87171', margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Delete this Record?</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              Are you sure you want to delete this row from <strong>{activeTable}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ padding: '0.55rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
