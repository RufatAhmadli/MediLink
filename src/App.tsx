import { useEffect, type ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from './components/Toaster'
import { DoctorShell } from './layouts/DoctorShell'
import { LabShell } from './layouts/LabShell'
import { PatientLayout } from './layouts/PatientLayout'
import { homeFor, RequireRole } from './layouts/RequireRole'
import { DoctorFeedback } from './pages/doctor/Feedback'
import { Inbox } from './pages/doctor/Inbox'
import { OrderTests } from './pages/doctor/OrderTests'
import { PatientPage } from './pages/doctor/PatientPage'
import { Patients } from './pages/doctor/Patients'
import { Requests } from './pages/doctor/Requests'
import { Schedule } from './pages/doctor/Schedule'
import { DoctorSettings } from './pages/doctor/Settings'
import { WriteSummary } from './pages/doctor/WriteSummary'
import { Bookings } from './pages/lab/Bookings'
import { Mapping } from './pages/lab/Mapping'
import { Orders } from './pages/lab/Orders'
import { Publish } from './pages/lab/Publish'
import { Sent } from './pages/lab/Sent'
import { LabSettings } from './pages/lab/Settings'
import { Appointments } from './pages/patient/Appointments'
import { BookDoctor } from './pages/patient/BookDoctor'
import { BookLab } from './pages/patient/BookLab'
import { Feedback } from './pages/patient/Feedback'
import { FindCare } from './pages/patient/FindCare'
import { PatientHome } from './pages/patient/Home'
import { LabOrders } from './pages/patient/LabOrders'
import { Profile } from './pages/patient/Profile'
import { RecordsAccess } from './pages/patient/RecordsAccess'
import { ResultDetail, Results } from './pages/patient/Results'
import { ShareQr } from './pages/patient/ShareQr'
import { Summaries, SummaryDetail } from './pages/patient/Summaries'
import { Timeline } from './pages/patient/Timeline'
import { Features } from './pages/public/Features'
import { Landing } from './pages/public/Landing'
import { Login } from './pages/public/Login'
import { SignUp, VerifySms } from './pages/public/SignUp'
import { useAuth } from './store/auth'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PublicOnly({ children }: { children: ReactElement }) {
  const user = useAuth((s) => s.user)
  return user ? <Navigate to={homeFor(user.role)} replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster />
      <Routes>
        <Route path="/" element={<PublicOnly><Landing /></PublicOnly>} />
        <Route path="/login" element={<Login />} />
        <Route path="/features" element={<Features />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signup/verify" element={<VerifySms />} />

        <Route element={<RequireRole role="patient" />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<PatientHome />} />
            <Route path="book" element={<FindCare />} />
            <Route path="book/doctor/:id" element={<BookDoctor />} />
            <Route path="book/lab/:id" element={<BookLab />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="lab-orders" element={<LabOrders />} />
            <Route path="results" element={<Results />} />
            <Route path="results/:id" element={<ResultDetail />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="summaries" element={<Summaries />} />
            <Route path="summaries/:id" element={<SummaryDetail />} />
            <Route path="access" element={<RecordsAccess />} />
            <Route path="access/share" element={<ShareQr />} />
            <Route path="profile" element={<Profile />} />
            <Route path="feedback/:id" element={<Feedback />} />
          </Route>
        </Route>

        <Route element={<RequireRole role="doctor" />}>
          <Route path="/doctor" element={<DoctorShell />}>
            <Route index element={<Navigate to="schedule" replace />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="requests" element={<Requests />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientPage />} />
            <Route path="patients/:id/summary" element={<WriteSummary />} />
            <Route path="patients/:id/order" element={<OrderTests />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="feedback" element={<DoctorFeedback />} />
            <Route path="settings" element={<DoctorSettings />} />
          </Route>
        </Route>

        <Route element={<RequireRole role="lab" />}>
          <Route path="/lab" element={<LabShell />}>
            <Route index element={<Navigate to="bookings" replace />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="orders" element={<Orders />} />
            <Route path="publish" element={<Publish />} />
            <Route path="sent" element={<Sent />} />
            <Route path="mapping" element={<Mapping />} />
            <Route path="settings" element={<LabSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
