// ==========================================
// COURSE HUB DATA STORE (DATA/courses.json)
// ==========================================

const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const defaultCourses = [];
export const mockCourses = [];

// Get Courses: Reads from local cache first
export const getCourses = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('edufast_dynamic_courses');
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map(c => {
          const isApproved = c.isApproved !== undefined ? Boolean(c.isApproved) : (c.status === 'Pending' ? false : true);
          return {
            ...c,
            isApproved,
            status: c.status || (isApproved ? 'Approved' : 'Pending'),
            enrolledCount: c.enrolledCount || 0,
            reviewsCount: c.reviewsCount || 0,
            rating: c.rating || 0
          };
        });
      }
    }
  } catch (e) {
    console.error('Error reading dynamic courses from localStorage:', e);
  }

  return [];
};

// Filter only approved courses for public display
export const getPublicCourses = () => {
  return getCourses().filter(c => c.isApproved === true || c.status === 'Approved');
};

// Sync courses from backend DATA/courses.json
if (typeof window !== 'undefined') {
  fetch(`${BACKEND_URL}/api/data/courses`)
    .then(r => r.json())
    .then(data => {
      const list = Array.isArray(data) ? data : (data?.data || []);
      if (Array.isArray(list)) {
        localStorage.setItem('edufast_dynamic_courses', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'course', action: 'sync' } }));
      }
    })
    .catch(() => {});
}

// Save course: Updates local cache + syncs to backend DATA/courses.json file
export const saveCourse = (course) => {
  if (typeof window === 'undefined') return [];
  const current = getCourses();
  const courseId = course.id || 'course-' + Date.now();
  const formattedCourse = { ...course, id: courseId };

  const index = current.findIndex(c => c.id === courseId);
  const isNew = index < 0;
  let updated;
  if (index >= 0) {
    updated = current.map(c => c.id === courseId ? { ...c, ...formattedCourse } : c);
  } else {
    updated = [formattedCourse, ...current];
  }

  localStorage.setItem('edufast_dynamic_courses', JSON.stringify(updated));

  // 🔔 Trigger real-time notification for student ONLY if course is approved/live
  const isApproved = formattedCourse.isApproved === true || formattedCourse.isApproved === 1 || formattedCourse.status === 'Approved';
  if (isNew && isApproved) {
    try {
      const raw = localStorage.getItem('edufast_notifications');
      const list = raw ? JSON.parse(raw) : [];
      const newNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        title: `🎓 নতুন কোর্স: "${formattedCourse.title}"`,
        text: `শিক্ষক ${formattedCourse.instructor || 'EduFast'} নতুন কোর্স শুরু করেছেন। বিস্তারিত দেখে এখনই এনরোল করুন!`,
        category: 'course',
        time: 'এইমাত্র (Just now)',
        timestamp: Date.now(),
        read: false,
        link: 'courses'
      };
      localStorage.setItem('edufast_notifications', JSON.stringify([newNotif, ...list]));
      window.dispatchEvent(new CustomEvent('edufast-notification-added', { detail: newNotif }));
    } catch {}
  }

  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'course', action: 'save', course: formattedCourse } }));

  // Live Sync with backend DATA/courses.json file
  fetch(`${BACKEND_URL}/api/data/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formattedCourse)
  }).catch(err => console.warn('Backend course sync notice:', err.message));

  return updated;
};

// Delete course: Removes from local cache + deletes from backend DATA/courses.json file
export const deleteCourse = (courseId) => {
  if (typeof window === 'undefined') return [];
  const current = getCourses();
  const updated = current.filter(c => c.id !== courseId);
  localStorage.setItem('edufast_dynamic_courses', JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('edufast-data-update', { detail: { type: 'course', action: 'delete' } }));

  // Live Delete from backend DATA/courses.json file
  fetch(`${BACKEND_URL}/api/data/courses/${encodeURIComponent(courseId)}`, {
    method: 'DELETE'
  }).catch(err => console.warn('Backend course delete notice:', err.message));

  return updated;
};
