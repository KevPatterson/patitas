import { Routes, Route, useLocation } from "react-router";
import { Layout } from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Buscar from "./pages/Buscar";
import Mapa from "./pages/Mapa";
import Publicar from "./pages/Publicar";
import PublicacionDetalle from "./pages/PublicacionDetalle";
import Adopciones from "./pages/Adopciones";
import ComoFunciona from "./pages/ComoFunciona";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import DashboardPublicaciones from "./pages/DashboardPublicaciones";
import DashboardNotificaciones from "./pages/DashboardNotificaciones";
import DashboardPerfil from "./pages/DashboardPerfil";
import Admin from "./pages/Admin";

export default function App() {
  const location = useLocation();
  const bare = location.pathname === "/login";

  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/buscar" element={<Buscar />} />
      <Route path="/mapa" element={<Mapa />} />
      <Route path="/publicar" element={<Publicar />} />
      <Route path="/p/:slug" element={<PublicacionDetalle />} />
      <Route path="/adopciones" element={<Adopciones />} />
      <Route path="/como-funciona" element={<ComoFunciona />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="publicaciones" element={<DashboardPublicaciones />} />
        <Route path="notificaciones" element={<DashboardNotificaciones />} />
        <Route path="perfil" element={<DashboardPerfil />} />
      </Route>
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <>
      {bare ? (
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      ) : (
        <Layout>{routes}</Layout>
      )}
      <Toaster richColors position="top-center" />
    </>
  );
}
