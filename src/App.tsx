import { HashRouter, Navigate, Route, Routes } from 'react-router'
import InicioPage from './pages/InicioPage.tsx'
import InstruccionesPage from './pages/InstruccionesPage.tsx'
import PartidaPage from './pages/PartidaPage.tsx'
import BotonTema from './ui/BotonTema.tsx'

export default function App() {
  return (
    <HashRouter>
      <div className="mx-auto w-full max-w-6xl px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8">
        <div className="flex justify-end">
          <BotonTema />
        </div>
        <main>
          <Routes>
            <Route path="/" element={<InicioPage />} />
            <Route path="/instrucciones" element={<InstruccionesPage />} />
            <Route path="/partida" element={<PartidaPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
