import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { UploadPage } from './pages/UploadPage'
import { CallsPage } from './pages/CallsPage'
import { CallDetailsPage } from './pages/CallDetailsPage'
import { SheetSettingsPage } from './pages/SheetSettingsPage'

const App = () => (
  <Routes>
    <Route path="/" element={<AppLayout />}>
      <Route index element={<Navigate to="/upload" replace />} />
      <Route path="upload" element={<UploadPage />} />
      <Route path="calls" element={<CallsPage />} />
      <Route path="calls/:id" element={<CallDetailsPage />} />
      <Route path="settings" element={<SheetSettingsPage />} />
      <Route path="*" element={<Navigate to="/upload" replace />} />
    </Route>
  </Routes>
)

export default App
