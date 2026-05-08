const fs = require('fs');
const path = 'c:/Users/Rayver/Desktop/ureb-system/src/components/admindashboard.jsx';
let c = fs.readFileSync(path, 'utf8');

function replaceBetween(startMarker, endMarker, replacement) {
  const start = c.indexOf(startMarker);
  if (start === -1) throw new Error('Start marker not found: ' + startMarker.slice(0, 50));
  const end = c.indexOf(endMarker, start + startMarker.length);
  if (end === -1) throw new Error('End marker not found: ' + endMarker.slice(0, 50));
  c = c.slice(0, start) + replacement + c.slice(end + endMarker.length);
}

// 1. Replace inside fetchRecentActivity: from getAllProposals import to setRecentActivity
replaceBetween(
  "        const { getAllProposals, getAllUsers } = await import('../services/api.js');",
  "        setRecentActivity(activities);",
  `        const response = await fetch(\`\${import.meta.env.VITE_API_URL}/api/notifications\`);\r\n\r\n\r\n\r\n        const notifications = await response.json();\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n        // Map notifications to activity items\r\n\r\n\r\n\r\n        const activities = (Array.isArray(notifications) ? notifications : [])\r\n\r\n\r\n\r\n          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))\r\n\r\n\r\n\r\n          .slice(0, 10)\r\n\r\n\r\n\r\n          .map(notification => ({\r\n\r\n\r\n\r\n            _id: notification._id,\r\n\r\n\r\n\r\n            type: notification.type || 'general',\r\n\r\n\r\n\r\n            title: notification.title || 'New Activity',\r\n\r\n\r\n\r\n            description: notification.message || '',\r\n\r\n\r\n\r\n            timestamp: notification.createdAt,\r\n\r\n\r\n\r\n            icon: (notification.type === 'new_proposal' || notification.type === 'assignment' || notification.type === 'review_submitted') ? 'FilePlus' : 'Dashboard'\r\n\r\n\r\n\r\n          }));\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n        setRecentActivity(activities);`
);

// 2. Insert handleDeleteActivity after fetchRecentActivity closing brace
const afterFetchMarker = "    };\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n    fetchRecentActivity();";
const idx = c.indexOf(afterFetchMarker);
if (idx === -1) throw new Error('afterFetchMarker not found');
c = c.slice(0, idx + 5) + `\r\n\r\n    const handleDeleteActivity = async (id) => {\r\n      try {\r\n        const { deleteNotification } = await import('../services/api.js');\r\n        const result = await deleteNotification(id);\r\n        if (result.success) {\r\n          setRecentActivity(prev => prev.filter(a => a._id !== id));\r\n        } else {\r\n          console.error('Failed to delete activity:', result.error);\r\n        }\r\n      } catch (error) {\r\n        console.error('Error deleting activity:', error);\r\n      }\r\n    };` + c.slice(idx + 5);

// 3. Replace activity item JSX
const oldJsx = `                    <div key={index} className="activity-item">\r\n\r\n\r\n\r\n                      <div className="activity-icon">\r\n\r\n\r\n\r\n                        {activity.icon === 'FilePlus' ? <FilePlusIcon /> : <DashboardIcon />}\r\n\r\n\r\n\r\n                      </div>\r\n\r\n\r\n\r\n                      <div className="activity-content">\r\n\r\n\r\n\r\n                        <h4>{activity.title}</h4>\r\n\r\n\r\n\r\n                        <p>{activity.description}</p>\r\n\r\n\r\n\r\n                        <span className="activity-time">\r\n\r\n\r\n\r\n                          {new Date(activity.timestamp).toLocaleDateString()} • {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\r\n\r\n\r\n\r\n                        </span>\r\n\r\n\r\n\r\n                      </div>\r\n\r\n\r\n\r\n                    </div>`;
const newJsx = `                    <div key={activity._id || index} className="activity-item">\r\n\r\n\r\n\r\n                      <div className="activity-icon">\r\n\r\n\r\n\r\n                        {activity.icon === 'FilePlus' ? <FilePlusIcon /> : <DashboardIcon />}\r\n\r\n\r\n\r\n                      </div>\r\n\r\n\r\n\r\n                      <div className="activity-content">\r\n\r\n\r\n\r\n                        <h4>{activity.title}</h4>\r\n\r\n\r\n\r\n                        <p>{activity.description}</p>\r\n\r\n\r\n\r\n                        <span className="activity-time">\r\n\r\n\r\n\r\n                          {new Date(activity.timestamp).toLocaleDateString()} • {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\r\n\r\n\r\n\r\n                        </span>\r\n\r\n\r\n\r\n                      </div>\r\n\r\n\r\n\r\n                      <button\r\n\r\n\r\n\r\n                        className="notif-delete-btn"\r\n\r\n\r\n\r\n                        onClick={(e) => {\r\n\r\n\r\n\r\n                          e.stopPropagation();\r\n\r\n\r\n\r\n                          handleDeleteActivity(activity._id);\r\n\r\n\r\n\r\n                        }}\r\n\r\n\r\n\r\n                        title="Delete activity"\r\n\r\n\r\n\r\n                      >\r\n\r\n\r\n\r\n                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">\r\n\r\n\r\n\r\n                          <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />\r\n\r\n\r\n\r\n                        </svg>\r\n\r\n\r\n\r\n                      </button>\r\n\r\n\r\n\r\n                    </div>`;
if (!c.includes(oldJsx)) throw new Error('oldJsx not found');
c = c.replace(oldJsx, newJsx);

fs.writeFileSync(path, c);
console.log('Done');
