import React from 'react';

export default function AdminQuestionBankTab({
  questionBankList,
  setIsQbModalOpen,
  handleDeleteQbAdmin
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>Previous 15-Year Question Bank Archive</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Publish and manage past admission papers, step-by-step solutions, and downloadable PDF notes.
          </p>
        </div>

        <button 
          className="admin-btn"
          style={{ background: '#059669', color: '#fff' }}
          onClick={() => setIsQbModalOpen(true)}
        >
          <span>➕</span> Add Question Paper to Archive
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {questionBankList.map(paper => (
          <div key={paper.id} className="admin-card" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '4px', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  color: '#34d399', 
                  fontWeight: 'bold' 
                }}>
                  {paper.year}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                  {paper.subject}
                </span>
              </div>

              <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1rem', lineHeight: '1.4' }}>
                {paper.examName}
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#38bdf8', fontSize: '0.8rem', fontWeight: '500' }}>
                🏛️ {paper.varsity}
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.78rem' }}>
                Group: {paper.group} • {paper.questionsCount} Questions • Marks: {paper.totalMarks}
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {paper.questions?.length || 0} Solved Items
              </span>
              <button 
                className="admin-btn"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: '#ef4444', color: '#fff' }}
                onClick={() => handleDeleteQbAdmin(paper.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {questionBankList.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            No question papers found in archive. Click above to add past papers.
          </div>
        )}
      </div>
    </div>
  );
}
