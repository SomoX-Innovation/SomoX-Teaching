import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/AdminSidebar';
import ProtectedRoute from './components/ProtectedRoute';
// User Pages
import Dashboard from './pages/User/Dashboard';
import TaskManagement from './pages/User/TaskManagement';
import SessionRecordings from './pages/User/SessionRecordings';
import MonthSessionRecordings from './pages/User/MonthSessionRecordings';
import OtherRecording from './pages/User/OtherRecording';
import ZoomSessions from './pages/User/ZoomSessions';
import AIAssistant from './pages/User/AIAssistant';
// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminCourses from './pages/Admin/AdminCourses';
import AdminBatches from './pages/Admin/AdminBatches';
import AdminRecordings from './pages/Admin/AdminRecordings';
import AdminTasks from './pages/Admin/AdminTasks';
import AdminBlog from './pages/Admin/AdminBlog';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminPayments from './pages/Admin/AdminPayments';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminProfile from './pages/Admin/AdminProfile';
// Public Pages
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import PlaceholderPage from './pages/PlaceholderPage';
import './App.css';

// Layout component to conditionally show sidebar based on role
function Layout({ children }) {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const showSidebar = isAdminRoute || isDashboardRoute;

  return (
    <div className={showSidebar ? "app-container" : ""}>
      {showSidebar && (isAdminRoute ? <AdminSidebar /> : <Sidebar />)}
      <main className={showSidebar ? "main-content" : ""}>
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/blog" element={<PlaceholderPage title="Blog" description="Read our latest articles and tutorials." />} />
              <Route path="/sign-in" element={<SignIn />} />
              
              {/* Student Dashboard - Protected */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="student">
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Task Management */}
              <Route 
                path="/dashboard/student-tasks" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="student">
                    <TaskManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* AI Assistant */}
              <Route 
                path="/dashboard/chatgpt" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="student">
                    <AIAssistant />
                  </ProtectedRoute>
                } 
              />
              
              {/* Session Recording */}
              <Route 
                path="/dashboard/student-session-recording" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="student">
                    <SessionRecordings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/student-session-recording/:month" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="student">
                    <MonthSessionRecordings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/student-other-recording" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="student">
                    <OtherRecording />
                  </ProtectedRoute>
                } 
              />
              
              {/* Zoom Sessions */}
              <Route 
                path="/dashboard/zoom-sessions" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="student">
                    <ZoomSessions />
                  </ProtectedRoute>
                } 
              />
              
              {/* Profile & Settings */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute requireAuth={true}>
                    <PlaceholderPage 
                      title="User Profile" 
                      description="Manage your profile and preferences."
                    />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes - Protected */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Users */}
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminUsers />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Courses */}
              <Route 
                path="/admin/courses" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminCourses />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/courses/create" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <PlaceholderPage title="Create Course" description="Create a new course." />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/courses/batches" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminBatches />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Recordings */}
              <Route 
                path="/admin/recordings" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminRecordings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/recordings/upload" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <PlaceholderPage title="Upload Recording" description="Upload a new recording." />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Other Pages */}
              <Route 
                path="/admin/tasks" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminTasks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blog" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminBlog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/blog/create" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <PlaceholderPage title="Create Post" description="Create a new blog post." />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/payments" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminPayments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/profile" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <AdminProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all - 404 */}
              <Route 
                path="*" 
                element={
                  <PlaceholderPage 
                    title="404 - Page Not Found" 
                    description="The page you're looking for doesn't exist."
                  />
                } 
              />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
