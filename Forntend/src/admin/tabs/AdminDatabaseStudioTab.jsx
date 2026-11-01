import React, { useState, useEffect, useMemo } from 'react';

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';


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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedRow, setSelectedRow] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Table Categories
  const TABLE_CATEGORIES = useMemo(() => [
    { id: 'all', label: 'সকল টেবিল (All)', icon: '🌐' },
    { id: 'users', label: 'ইউজার ও অ্যাক্সেস', icon: '👥', tables: ['users_auth', 'students', 'teachers', 'mentors', 'student_profiles'] },
    { id: 'courses', label: 'কোর্স ও সিলেবাস', icon: '📚', tables: ['courses', 'course_curriculum', 'enrollments', 'lesson_progress'] },
    { id: 'admissions', label: 'ভর্তি ও নোটিশ', icon: '🏛️', tables: ['universities', 'notices'] },
    { id: 'exams', label: 'পরীক্ষা ও প্রশ্নব্যাংক', icon: '📝', tables: ['question_bank', 'mock_tests', 'mock_test_attempts', 'daily_tasks'] },
    { id: 'live', label: 'লাইভ ও সাপোর্ট', icon: '💬', tables: ['live_classes', 'mentor_doubts', 'study_lounge_messages'] }
  ], []);

  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTables = useMemo(() => {
    if (activeCategory === 'all') return tables;
    const cat = TABLE_CATEGORIES.find(c => c.id === activeCategory);
    if (!cat || !cat.tables) return tables;
    return tables.filter(t => cat.tables.includes(t.name));
  }, [tables, activeCategory, TABLE_CATEGORIES]);

  const handleSelectCategory = (catId) => {
    setActiveCategory(catId);
    const cat = TABLE_CATEGORIES.find(c => c.id === catId);
    if (cat && cat.tables && cat.tables.length > 0) {
      if (!cat.tables.includes(activeTable)) {
        setActiveTable(cat.tables[0]);
        setSearchQuery('');
      }
    }
  };

  const openViewModal = (row) => {
    setSelectedRow(row);
    setIsViewModalOpen(true);
  };

  // DATA Files Studio States
  const [studioMode, setStudioMode] = useState('tables'); // 'tables' | 'data_files'
  const [dataFiles, setDataFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('courses.json');
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileSaving, setFileSaving] = useState(false);
  const [jsonError, setJsonError] = useState(null);

  // SQL Runner States
  const [sqlQuery, setSqlQuery] = useState('SELECT id, role, email, mobile, isVerified FROM users_auth;');
  const [sqlResults, setSqlResults] = useState(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);
  const [sqlError, setSqlError] = useState(null);

  const handleExecuteSql = async (overrideSql) => {
    const queryToRun = overrideSql || sqlQuery;
    if (!queryToRun || !queryToRun.trim()) return;
    setIsExecutingSql(true);
    setSqlError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/db/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: queryToRun })
      });
      const data = await res.json();
      setIsExecutingSql(false);
      if (data.success) {
        setSqlResults(data);
        addToast(data.message || `Query returned ${data.rowCount} rows`, 'success');
      } else {
        setSqlError(data.error);
        addToast(data.error || 'Failed to run SQL query', 'error');
      }
    } catch (err) {
      setIsExecutingSql(false);
      setSqlError(err.message);
      addToast('Error running SQL: ' + err.message, 'error');
    }
  };

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
            <button
              type="button"
              onClick={() => setStudioMode('sql')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: studioMode === 'sql' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: studioMode === 'sql' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                color: studioMode === 'sql' ? '#c084fc' : '#94a3b8',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              💻 Custom SQL Runner
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '0.6rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.84rem',
              backgroundColor: '#4f46e5',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            <span>🌐</span> Open SQLite Web Studio (Port 8080) ↗
          </a>

          {studioMode === 'tables' && (
            <>
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
            </>
          )}

          {studioMode === 'data_files' && (
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
      {/* 3. CUSTOM SQL RUNNER VIEW */}
      {/* ------------------------------------------------------------- */}
      {studioMode === 'sql' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'var(--card-bg, #1e293b)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                  💻 Interactive SQLite Query Console
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Write and execute real-time SQL queries (SELECT, INSERT, UPDATE, DELETE, PRAGMA) directly on students.db.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {[
                  { label: '👥 users_auth', q: 'SELECT id, role, email, mobile, isVerified FROM users_auth;' },
                  { label: '🎓 students', q: 'SELECT id, name, email, mobile, academicGroup, coins, score FROM students;' },
                  { label: '👨‍🏫 teachers', q: 'SELECT id, name, email, subject, institution FROM teachers;' },
                  { label: '📚 courses', q: 'SELECT id, title, instructor, price, academicGroup FROM courses;' },
                  { label: '🏛️ universities', q: 'SELECT id, name, examDate, applicationFee FROM universities;' },
                  { label: '📑 questions', q: 'SELECT id, subject, chapter, question, correctAnswer FROM question_bank LIMIT 5;' }
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSqlQuery(sample.q);
                      handleExecuteSql(sample.q);
                    }}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#cbd5e1',
                      fontSize: '0.74rem',
                      cursor: 'pointer'
                    }}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Write SQL query, e.g. SELECT * FROM users_auth WHERE role = 'student';"
                rows={5}
                style={{
                  width: '100%',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  backgroundColor: '#030712',
                  color: '#a7f3d0',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '10px',
                  padding: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Tip: Press Execute or click any quick template to inspect tables instantly.
              </span>
              <button
                type="button"
                className="btn btn-teal"
                onClick={() => handleExecuteSql()}
                disabled={isExecutingSql}
                style={{
                  padding: '0.6rem 1.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.88rem',
                  backgroundColor: '#9333ea',
                  fontWeight: 700
                }}
              >
                <span>{isExecutingSql ? '⏳ Executing...' : '▶ Execute Query'}</span>
              </button>
            </div>

            {sqlError && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '0.85rem'
              }}>
                ❌ SQL Error: {sqlError}
              </div>
            )}

            {sqlResults && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>
                    {sqlResults.type === 'select' 
                      ? `✅ Returned ${sqlResults.rowCount} row(s)`
                      : `✅ Executed. ${sqlResults.changes || 0} row(s) affected.`}
                  </span>
                </div>
                {sqlResults.data && sqlResults.data.length > 0 && (
                  <div style={{
                    maxHeight: '400px',
                    overflow: 'auto',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <table className="admin-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                      <thead>
                        <tr>
                          {Object.keys(sqlResults.data[0]).map((col) => (
                            <th key={col} style={{ padding: '0.6rem 0.8rem' }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sqlResults.data.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {Object.keys(row).map((col) => (
                              <td key={col} style={{ padding: '0.5rem 0.8rem', fontFamily: typeof row[col] === 'number' ? 'monospace' : 'inherit' }}>
                                {row[col] === null ? <em style={{ color: '#64748b' }}>null</em> : String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SQLITE TABLES VIEW (Default) */}
      {/* ------------------------------------------------------------- */}
      {studioMode === 'tables' && (
        <div>
          {/* Quick Credentials Info Card */}
          <div style={{
            marginBottom: '1rem',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '1.1rem' }}>🔑</span>
                <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>সকল সিস্টেম আইডি ও পাসওয়ার্ড (System Logins & Passwords):</strong>
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem', color: '#cbd5e1' }}>
                <span>🛡️ <strong>Admin:</strong> admin@edufast.com <code style={{ color: '#38bdf8', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>admin123</code></span>
                <span>👨‍🏫 <strong>Teacher:</strong> teacher@edufast.com <code style={{ color: '#34d399', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>teacher123</code></span>
                <span>🧑‍🏫 <strong>Mentor:</strong> mentor@edufast.com <code style={{ color: '#c084fc', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>mentor123</code></span>
                <span>🎓 <strong>Student:</strong> student@edufast.com (01823456789) <code style={{ color: '#fbbf24', background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '4px' }}>password123</code></span>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              <span style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '4px 8px', borderRadius: '6px', color: '#818cf8', fontWeight: 600 }}>
                Bcrypt & Plain Supported
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
            marginBottom: '0.6rem',
            scrollbarWidth: 'thin'
          }}>
            {TABLE_CATEGORIES.map(cat => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    color: isSelected ? '#34d399' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Table Selection Pills */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.35rem',
            scrollbarWidth: 'thin'
          }}>
            {filteredTables.map(tab => (
              <button
                key={tab.name}
                type="button"
                onClick={() => { setActiveTable(tab.name); setSearchQuery(''); }}
                style={{
                  padding: '0.55rem 1rem',
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 320px', position: 'relative' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={`Search by ID (e.g. 18) or keyword in ${activeTable}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.5rem 0.85rem',
                paddingRight: searchQuery.trim() && /^\d+$/.test(searchQuery.trim()) ? '110px' : '0.85rem',
                color: '#ffffff',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
            {searchQuery.trim() && /^\d+$/.test(searchQuery.trim()) && (
              <span style={{
                position: 'absolute',
                right: '8px',
                backgroundColor: '#f59e0b',
                color: '#000000',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '5px',
                pointerEvents: 'none'
              }}>
                🎯 ID #{searchQuery.trim()}
              </span>
            )}
          </div>
          <button type="submit" className="btn btn-teal" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}>
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
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700, width: '150px' }}>Actions</th>
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
                  const pkVal = row[pkCol.name];
                  const rowKey = pkVal || idx;
                  const isDirectIdMatch = searchQuery.trim() && (
                    String(pkVal).toLowerCase() === searchQuery.trim().toLowerCase()
                  );

                  return (
                    <tr
                      key={rowKey}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        backgroundColor: isDirectIdMatch 
                          ? 'rgba(245, 158, 11, 0.15)' 
                          : (idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'),
                        outline: isDirectIdMatch ? '2px solid #f59e0b' : 'none'
                      }}
                    >
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => openViewModal(row)}
                            title="Quick View Record"
                            style={{
                              backgroundColor: 'rgba(99, 102, 241, 0.18)',
                              border: '1px solid rgba(99, 102, 241, 0.4)',
                              color: '#818cf8',
                              borderRadius: '6px',
                              padding: '3px 7px',
                              cursor: 'pointer',
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}
                          >
                            👁️ View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            title="Edit Record"
                            style={{
                              backgroundColor: 'rgba(56, 189, 248, 0.15)',
                              border: '1px solid rgba(56, 189, 248, 0.3)',
                              color: '#38bdf8',
                              borderRadius: '6px',
                              padding: '3px 7px',
                              cursor: 'pointer',
                              fontSize: '0.74rem',
                              fontWeight: 700
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
                              padding: '3px 7px',
                              cursor: 'pointer',
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>

                      {columns.map(col => {
                        const val = row[col.name];
                        let displayVal = val === null || val === undefined ? '' : String(val);
                        const isLong = displayVal.length > 45;

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
                            {col.name === 'id' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  backgroundColor: isDirectIdMatch ? '#f59e0b' : 'rgba(99, 102, 241, 0.25)',
                                  color: isDirectIdMatch ? '#000000' : '#a5b4fc',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontFamily: 'monospace'
                                }}>
                                  #{val}
                                </span>
                                {isDirectIdMatch && (
                                  <span style={{
                                    backgroundColor: '#f59e0b',
                                    color: '#000000',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontSize: '0.64rem',
                                    fontWeight: 900
                                  }}>
                                    MATCHED
                                  </span>
                                )}
                              </div>
                            ) : col.name === 'isVerified' ? (
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
                            ) : col.name.toLowerCase().includes('password') || col.name === 'otpHash' ? (
                              <span style={{ fontFamily: 'monospace', color: '#64748b' }}>••••••••</span>
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

      {/* MODAL: VIEW RECORD INSPECTOR */}
      {isViewModalOpen && selectedRow && (
        <div className="modal-backdrop" onClick={() => setIsViewModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '92vw', backgroundColor: '#0f172a', border: '1px solid rgba(99, 102, 241, 0.4)', borderRadius: '16px', padding: '1.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#818cf8', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👁️</span> Record Inspector: <span style={{ color: '#ffffff' }}>#{selectedRow[columns.find(c => c.isPk)?.name || 'id'] || 'Record'}</span> in <span style={{ color: '#38bdf8' }}>{activeTable}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
              {columns.map(col => {
                const val = selectedRow[col.name];
                return (
                  <div key={col.name} style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{col.name}</span>
                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{col.type || 'TEXT'} {col.isPk ? '(PK)' : ''}</span>
                    </div>
                    <div style={{ color: '#f8fafc', fontSize: '0.86rem', wordBreak: 'break-word', fontFamily: typeof val === 'number' ? 'monospace' : 'inherit' }}>
                      {val === null || val === undefined ? (
                        <em style={{ color: '#64748b' }}>null</em>
                      ) : (
                        String(val)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsViewModalOpen(false)}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-teal"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(selectedRow);
                }}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem' }}
              >
                ✏️ Edit This Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
