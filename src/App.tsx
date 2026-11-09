/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Login from './pages/Login'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import Colaboradores from './pages/Colaboradores'
import NovoRegistro from './pages/NovoRegistro'
import Registros from './pages/Registros'
import Relatorio from './pages/Relatorio'
import Equipamentos from './pages/Equipamentos'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ScrollToTop } from './components/ScrollToTop'

const App = () => (
  <BrowserRouter>
    <ScrollToTop />
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/"
              element={
                <ErrorBoundary key="index">
                  <Index />
                </ErrorBoundary>
              }
            />
            <Route
              path="/colaboradores"
              element={
                <ErrorBoundary key="colaboradores">
                  <Colaboradores />
                </ErrorBoundary>
              }
            />
            <Route
              path="/novo-registro"
              element={
                <ErrorBoundary key="novo-registro">
                  <NovoRegistro />
                </ErrorBoundary>
              }
            />
            <Route
              path="/registros"
              element={
                <ErrorBoundary key="registros">
                  <Registros />
                </ErrorBoundary>
              }
            />
            <Route
              path="/relatorio"
              element={
                <ErrorBoundary key="relatorio">
                  <Relatorio />
                </ErrorBoundary>
              }
            />
            <Route
              path="/equipamentos"
              element={
                <ErrorBoundary key="equipamentos">
                  <Equipamentos />
                </ErrorBoundary>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
