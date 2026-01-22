import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/AdminSidebar';
import TeacherSidebar from './components/TeacherSidebar';
import SuperAdminSidebar from './components/SuperAdminSidebar';
import ProtectedRoute from './components/ProtectedRoute';
// User Pages
import Dashboard from './pages/User/Dashboard';
import TaskManagement from './pages/User/TaskManagement';
import SessionRecordings from './pages/User/SessionRecordings';
import MonthSessionRecordings from './pages/User/MonthSessionRecordings';
import OtherRecording from './pages/User/OtherRecording';
import ZoomSessions from './pages/User/ZoomSessions';
import AIAssistant from './pages/User/AIAssistant';
// Organization Pages (formerly Admin)
import OrganizationDashboard from './pages/Organization/OrganizationDashboard';
import OrganizationUsers from './pages/Organization/OrganizationUsers';
import OrganizationCourses from './pages/Organization/OrganizationCourses';
import OrganizationRecordings from './pages/Organization/OrganizationRecordings';
import OrganizationTasks from './pages/Organization/OrganizationTasks';
import OrganizationBlog from './pages/Organization/OrganizationBlog';
import OrganizationAnalytics from './pages/Organization/OrganizationAnalytics';
import OrganizationPayments from './pages/Organization/OrganizationPayments';
import OrganizationSettings from './pages/Organization/OrganizationSettings';
import OrganizationProfile from './pages/Organization/OrganizationProfile';
// Teacher Pages
import TeacherDashboard from './pages/Teacher/TeacherDashboard';
import TeacherUsers from './pages/Teacher/TeacherUsers';
import TeacherCourses from './pages/Teacher/TeacherCourses';
import TeacherRecordings from './pages/Teacher/TeacherRecordings';
import TeacherTasks from './pages/Teacher/TeacherTasks';
import TeacherBlog from './pages/Teacher/TeacherBlog';
import TeacherProfile from './pages/Teacher/TeacherProfile';
// SuperAdmin Pages
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import SuperAdminOrganizations from './pages/SuperAdmin/SuperAdminOrganizations';
// Public Pages
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import PlaceholderPage from './pages/PlaceholderPage';
import './App.css';

// Layout component to conditionally show sidebar based on role
function Layout({ children }) {
  const location = useLocation();
  const { isAdmin, isSuperAdmin } = useAuth();
  const isSuperAdminRoute = location.pathname.startsWith('/superadmin');
  const isAdminRoute = location.pathname.startsWith('/organization');
  const isTeacherRoute = location.pathname.startsWith('/teacher');
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const showSidebar = isSuperAdminRoute || isAdminRoute || isTeacherRoute || isDashboardRoute;

  return (
    <div className={showSidebar ? "app-container" : ""}>
      {showSidebar && (
        isSuperAdminRoute ? <SuperAdminSidebar /> :
        isAdminRoute ? <AdminSidebar /> :
        isTeacherRoute ? <TeacherSidebar /> :
        <Sidebar />
      )}
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
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
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
              
              {/* Organization Routes - Protected (formerly Admin) */}
              <Route 
                path="/organization/dashboard" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Organization Users */}
              <Route 
                path="/organization/users" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationUsers />
                  </ProtectedRoute>
                } 
              />
              
              {/* Organization Classes */}
              <Route 
                path="/organization/courses" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationCourses />
                  </ProtectedRoute>
                } 
              />
              
              {/* Organization Recordings */}
              <Route 
                path="/organization/recordings" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationRecordings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Organization Other Pages */}
              <Route 
                path="/organization/tasks" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationTasks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organization/blog" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationBlog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organization/blog/create" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <PlaceholderPage title="Create Post" description="Create a new blog post." />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organization/analytics" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organization/payments" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationPayments />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organization/settings" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationSettings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organization/profile" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="admin">
                    <OrganizationProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Routes - Protected */}
              <Route 
                path="/teacher/dashboard" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="teacher">
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Users */}
              <Route 
                path="/teacher/users" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="teacher">
                    <TeacherUsers />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Classes */}
              <Route 
                path="/teacher/courses" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="teacher">
                    <TeacherCourses />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Recordings */}
              <Route 
                path="/teacher/recordings" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="teacher">
                    <TeacherRecordings />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Tasks */}
              <Route 
                path="/teacher/tasks" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="teacher">
                    <TeacherTasks />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Blog */}
              <Route 
                path="/teacher/blog" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="teacher">
                    <TeacherBlog />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/teacher/blog/create" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="teacher">
                    <PlaceholderPage title="Create Post" description="Create a new blog post." />
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher Profile */}
              <Route 
                path="/teacher/profile" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="teacher">
                    <TeacherProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* SuperAdmin Routes - Protected */}
              <Route 
                path="/superadmin/dashboard" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="superAdmin">
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/superadmin/organizations" 
                element={
                  <ProtectedRoute requireAuth={true} requireRole="superAdmin">
                    <SuperAdminOrganizations />
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
