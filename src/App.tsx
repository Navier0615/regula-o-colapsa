import { HashRouter, Navigate, Route, Routes } from 'react-router'
import InicioPage from './pages/InicioPage.tsx'
import InstruccionesPage from './pages/InstruccionesPage.tsx'
import PartidaPage from './pages/PartidaPage.tsx'

export default function App() {
  return (
    <HashRouter>
      <main className="mx-auto w-full max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
        <Routes>
          <Route path="/" element={<InicioPage />} />
          <Route path="/instrucciones" element={<InstruccionesPage />} />
          <Route path="/partida" element={<PartidaPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </HashRouter>
  )
}
