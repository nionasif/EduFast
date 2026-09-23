import { useState, useEffect, useMemo } from 'react';
import './Leaderboard.css';
import { 
  getDynamicLeaderboard, 
  getStudentCoins, 
  getRegisteredStudents, 
  syncRegisteredStudents 
} from '../../data/mockData';

export default function Leaderboard({ user, coins: propCoins, onNavigate }) {
  // Metric tab: 'coins' (EduCoins), 'score' (Mock Test Score %), 'streak' (Daily Streaks)
  const [metric, setMetric] = useState('coins');
  // Group filter: 'all', 'Science', 'Commerce', 'Humanities'
  const [groupFilter, setGroupFilter] = useState('all');
  // Full modal view toggle
  const [showFullModal, setShowFullModal] = useState(false);
  // Search query inside modal
  const [modalSearch, setModalSearch] = useState('');
  // Live registered students
  const [registeredStudents, setRegisteredStudents] = useState(() => getRegisteredStudents());

  // Fallback to active user from session if not provided via props
  const currentUser = useMemo(() => {
    if (user && user.name) return user;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('edufast_student_session');
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return { name: 'Student', group: 'Science', avatar: '🎓' };
  }, [user]);

  // Live synced coins state
  const [liveCoins, setLiveCoins] = useState(() => {
    if (propCoins !== undefined && propCoins !== null) return propCoins;
    return getStudentCoins(currentUser);
  });

  // Keep liveCoins in sync with prop changes
  useEffect(() => {
    if (propCoins !== undefined && propCoins !== null) {
      setLiveCoins(propCoins);
    }
  }, [propCoins]);

  // Listen to global coin updates across the entire app
  useEffect(() => {
    const handleCoinsEvent = (e) => {
      if (e.detail?.coins !== undefined) {
        setLiveCoins(e.detail.coins);
      }
    };
    window.addEventListener('edufast-coins-update', handleCoinsEvent);
    return () => window.removeEventListener('edufast-coins-update', handleCoinsEvent);
  }, []);

  // Live fetch students from backend SQLite & sync with local store
  useEffect(() => {
    let isMounted = true;
    const fetchLiveStudents = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/students/leaderboard?limit=50');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && isMounted) {
          setRegisteredStudents(json.data);
          syncRegisteredStudents(json.data);
        }
      } catch (err) {
        if (isMounted) {
          setRegisteredStudents(getRegisteredStudents());
        }
      }
    };

    fetchLiveStudents();
    const interval = setInterval(fetchLiveStudents, 15000); // 15s live polling

    const handleUpdate = () => fetchLiveStudents();
    window.addEventListener('edufast-students-registry-update', handleUpdate);
    window.addEventListener('edufast-coins-update', handleUpdate);
    window.addEventListener('edufast-mock-history-update', handleUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('edufast-students-registry-update', handleUpdate);
      window.removeEventListener('edufast-coins-update', handleUpdate);
      window.removeEventListener('edufast-mock-history-update', handleUpdate);
    };
  }, []);

  // Compute dynamic leaderboard data (Strictly Top 10 for list, fullList for modal)
  const { list, fullList, totalRegistered, userRank, userItem, aheadItem, gapCoins, gapScore, gapStreak } = useMemo(() => {
    return getDynamicLeaderboard(currentUser, {
      metric,
      group: groupFilter,
      currentCoins: liveCoins,
      registeredStudents
    });
  }, [currentUser, metric, groupFilter, liveCoins, registeredStudents]);

  // Filtered list for the modal search
  const modalList = useMemo(() => {
    const source = fullList || list;
    if (!modalSearch.trim()) return source;
    const q = modalSearch.toLowerCase();
    return source.filter(item => 
      item.name.toLowerCase().includes(q) || 
      (item.target && item.target.toLowerCase().includes(q)) ||
      (item.group && item.group.toLowerCase().includes(q))
    );
  }, [fullList, list, modalSearch]);

  // Helper for metric label & icon
  const getMetricBadge = (item) => {
    if (metric === 'score') {
      return (
        <span style={{ fontWeight: 800, color: '#fef08a' }}>
          🎯 {item.score}%
        </span>
      );
    }
    if (metric === 'streak') {
      return (
        <span style={{ fontWeight: 800, color: '#fed7aa' }}>
          🔥 {item.streak} দিন
        </span>
      );
    }
    return (
      <span style={{ fontWeight: 800, color: '#ECC94B' }}>
        🪙 {item.coins} Coins
      </span>
    );
  };

  const getMetricTitle = () => {
    if (metric === 'score') return 'মেগা মক টেস্ট পারফর্মেন্স';
    if (metric === 'streak') return 'ধারাবাহিক স্টাডি স্ট্রিক';
    return 'সর্বোচ্চ EduCoins অর্জনকারী';
  };

  return (
    <div className="lb-banner">
      {/* Background decorative watermark */}
      <div className="lb-bg-pattern">🏆</div>

      {/* Top Header & Controls Row */}
      <div className="lb-header">
        <div>
          <div className="lb-header-title-row">
            <h3 className="lb-header-title">
              <span>⚡</span> Student Leaderboard
            </h3>
            <span className="lb-live-badge">
              <span className="lb-pulse-dot"></span>
              লাইভ র‍্যাংকিং
            </span>
          </div>
          <div className="lb-header-desc">
            {getMetricTitle()} • প্ল্যাটফর্মের লাইভ টপ ১০ শিক্ষার্থী
          </div>
        </div>

        <button
          type="button"
          className="lb-btn-view-all"
          onClick={() => setShowFullModal(true)}
        >
          <span>👀</span> সম্পূর্ণ লিডারবোর্ড
        </button>
      </div>

      {/* Metric Tabs & Group Filter */}
      <div className="lb-controls-row">
        <div className="lb-metric-tabs">
          {[
            { id: 'coins', label: '🪙 EduCoins' },
            { id: 'score', label: '🏆 মক টেস্ট' },
            { id: 'streak', label: '🔥 স্টাডি স্ট্রিক' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`lb-metric-tab ${metric === tab.id ? 'active' : ''}`}
              onClick={() => setMetric(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="lb-group-filter">
          <span className="lb-group-filter-label">ফিল্টার:</span>
          {[
            { id: 'all', label: 'সকল গ্রুপ' },
            { id: 'Science', label: 'বিজ্ঞান' },
            { id: 'Commerce', label: 'ব্যবসায়' },
            { id: 'Humanities', label: 'মানবিক' }
          ].map(grp => (
            <button
              key={grp.id}
              type="button"
              className={`lb-group-filter-btn ${groupFilter === grp.id ? 'active' : ''}`}
              onClick={() => setGroupFilter(grp.id)}
            >
              {grp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic User Standing & Motivation Banner */}
      {userItem && (
        <div className="lb-user-status-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={`lb-user-rank-badge ${userRank === 1 ? 'rank-1' : userRank === 2 ? 'rank-2' : userRank === 3 ? 'rank-3' : 'rank-other'}`}>
              {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : userRank === 3 ? '🥉' : '📍'} #{userRank}
            </div>
            <div>
              <div className="lb-user-pos-text">
                আপনার বর্তমান পজিশন: <span className="highlight">#{userRank}</span>
                <span style={{ fontWeight: 500, fontSize: '0.78rem', opacity: 0.8, marginLeft: '0.4rem' }}>
                  ({userItem.name})
                </span>
              </div>
              <div className="lb-user-hint-text">
                {metric === 'coins' && (
                  <span>
                    আপনার সংগ্রহ <strong>{userItem.coins} EduCoins</strong>।{' '}
                    {userItem.coins === 0 ? (
                      <span style={{ color: '#fed7aa' }}>
                        💡 দৈনিক AI রিভিশন প্ল্যান ও মক টেস্ট সমাধান করে কয়েন অর্জন করুন!
                      </span>
                    ) : aheadItem ? (
                      <span style={{ color: '#fed7aa' }}>
                        💡 <strong>#{userRank - 1}</strong> স্থানে পৌঁছাতে আর মাত্র <strong>{gapCoins} কয়েন</strong> প্রয়োজন!
                      </span>
                    ) : (
                      <span style={{ color: '#86efac' }}>👑 অভিনন্দন! আপনি লিডারবোর্ডের শীর্ষে আছেন!</span>
                    )}
                  </span>
                )}
                {metric === 'score' && (
                  <span>
                    মক টেস্ট গড় একুরেসি: <strong>{userItem.score}%</strong>।{' '}
                    {userItem.score === 0 ? (
                      <span style={{ color: '#fed7aa' }}>
                        💡 প্রথম মক টেস্ট সম্পন্ন করে আপনার পারফর্মেন্স লিডারবোর্ডে যুক্ত করুন!
                      </span>
                    ) : aheadItem ? (
                      <span style={{ color: '#fed7aa' }}>
                        💡 পরবর্তী স্থানে পৌঁছাতে স্কোর পার্থক্য মাত্র <strong>+{gapScore}%</strong>।
                      </span>
                    ) : (
                      <span style={{ color: '#86efac' }}>👑 মেগা মক টেস্টে আপনি সেরা পারফর্মার!</span>
                    )}
                  </span>
                )}
                {metric === 'streak' && (
                  <span>
                    ধারাবাহিক স্টাডি স্ট্রিক: <strong>{userItem.streak} দিন</strong>।{' '}
                    {userItem.streak === 0 ? (
                      <span style={{ color: '#fed7aa' }}>
                        💡 আজ থেকেই দৈনিক টাস্ক বা মক টেস্ট সম্পন্ন করে স্ট্রিক শুরু করুন!
                      </span>
                    ) : aheadItem ? (
                      <span style={{ color: '#fed7aa' }}>
                        💡 আরও <strong>{gapStreak} দিন</strong> নিয়মিত পড়ুন এবং টপ র‍্যাংক দখল করুন!
                      </span>
                    ) : (
                      <span style={{ color: '#86efac' }}>🔥 আপনার স্ট্রিক বর্তমানে সর্বোচ্চ!</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onNavigate && (
            <button
              type="button"
              className="lb-btn-action"
              onClick={() => onNavigate(metric === 'score' ? 'mocktest' : 'courses')}
            >
              {metric === 'score' ? 'মক টেস্ট দিন ➔' : 'কয়েন বাড়ান ➔'}
            </button>
          )}
        </div>
      )}

      {/* Horizontal Leaderboard Carousel */}
      <div className="lb-carousel">
        {list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', width: '100%', color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem' }}>
            🌱 এখনও কোনো শিক্ষার্থী যুক্ত হয়নি। আজকের টাস্ক সমাধান করে প্রথম স্থান অর্জন করুন!
          </div>
        ) : (
          list.map((student) => {
            const isUser = student.isCurrentUser;
            const isGold = student.rank === 1;
            const isSilver = student.rank === 2;
            const isBronze = student.rank === 3;

            let rankBadge = `#${student.rank}`;
            let rankClass = 'other';

            if (isGold) {
              rankBadge = '🥇 #1';
              rankClass = 'gold';
            } else if (isSilver) {
              rankBadge = '🥈 #2';
              rankClass = 'silver';
            } else if (isBronze) {
              rankBadge = '🥉 #3';
              rankClass = 'bronze';
            }

            return (
              <div
                key={student.id || student.name}
                className={`lb-card ${isUser ? 'user' : isGold ? 'gold' : ''}`}
              >
                {isUser && (
                  <div className="lb-card-you-tag">
                    ✨ আপনি (YOU)
                  </div>
                )}

                <div className={`lb-rank-circle ${rankClass}`}>
                  {rankBadge}
                </div>

                <div className="lb-card-avatar">
                  {student.avatar || '🎓'}
                </div>

                <div className="lb-details">
                  <div className="lb-card-name">
                    {student.name}
                  </div>

                  <div className="lb-card-metric">
                    {getMetricBadge(student)}
                  </div>

                  <div className="lb-card-target" title={student.target}>
                    🎯 {student.target}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Leaderboard Modal */}
      {showFullModal && (
        <div className="lb-modal-backdrop" onClick={() => setShowFullModal(false)}>
          <div className="lb-modal-content" onClick={e => e.stopPropagation()}>
            <div className="lb-modal-header">
              <div>
                <h3 className="lb-modal-title">
                  🏆 সম্পূর্ণ স্টুডেন্ট লিডারবোর্ড
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', opacity: 0.85 }}>
                  {getMetricTitle()} • মোট {totalRegistered || list.length} জন নিবন্ধিত শিক্ষার্থী (টপ ১০ সহ)
                </p>
              </div>
              <button
                type="button"
                className="lb-modal-close"
                onClick={() => setShowFullModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="lb-modal-controls">
              <input
                type="text"
                className="lb-modal-search-input"
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                placeholder="শিক্ষার্থীর নাম বা টার্গেট সার্চ করুন..."
              />
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {[
                  { id: 'coins', label: '🪙 কয়েন' },
                  { id: 'score', label: '🏆 মক টেস্ট' },
                  { id: 'streak', label: '🔥 স্ট্রিক' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMetric(tab.id)}
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: metric === tab.id ? 'none' : '1px solid #cbd5e0',
                      background: metric === tab.id ? '#319795' : '#ffffff',
                      color: metric === tab.id ? '#ffffff' : '#4b5563',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lb-modal-body">
              {modalList.map((st) => {
                const isUser = st.isCurrentUser;
                const isGold = st.rank === 1;
                const isSilver = st.rank === 2;
                const isBronze = st.rank === 3;

                return (
                  <div
                    key={st.id || st.name}
                    className={`lb-modal-row ${isUser ? 'user' : ''}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isGold ? '#fef08a' : isSilver ? '#e2e8f0' : isBronze ? '#fed7aa' : '#f1f5f9',
                        color: isGold ? '#854d0e' : isSilver ? '#334155' : isBronze ? '#9a3412' : '#64748b',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${st.rank}`}
                      </div>

                      <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>{st.avatar || '🎓'}</div>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>{st.name}</span>
                          {isUser && (
                            <span style={{ fontSize: '0.65rem', background: '#22c55e', color: '#ffffff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
                              আপনি
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#6b7280', marginTop: '0.1rem' }}>
                          {st.target} • {st.group}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#319795' }}>
                        {metric === 'coins' && `🪙 ${st.coins} Coins`}
                        {metric === 'score' && `🎯 ${st.score}%`}
                        {metric === 'streak' && `🔥 ${st.streak} দিন`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                        {metric === 'coins' ? `স্কোর: ${st.score}%` : `কয়েন: ${st.coins}`}
                      </div>
                    </div>
                  </div>
                );
              })}

              {modalList.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#718096' }}>
                  কোনো শিক্ষার্থী পাওয়া যায়নি।
                </div>
              )}
            </div>

            <div className="lb-modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowFullModal(false)}
                style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
