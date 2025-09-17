import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, Divider,
  Button, IconButton, Tooltip, Typography
} from '@mui/material';

// Gerekli ikonları import edelim
import BuildIcon from '@mui/icons-material/Build';
import SourceIcon from '@mui/icons-material/Source';
import OutputIcon from '@mui/icons-material/Output';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Sayfa (View) component'lerini import edelim
import BuilderView from './views/BuilderView.jsx';
import SourcesView from './views/SourcesView.jsx';
import DestinationsView from './views/DestinationsView.jsx';
import LoginView from './views/LoginView.jsx';
import RegisterView from './views/RegisterView.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';


// Ana Arayüz (Sidebar + İçerik Alanı)
function MainLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // 1. Aktif URL'i almak için useLocation hook'u

  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    // Eğer kullanıcı 'builder' sayfasına veya ana sayfaya gelirse, menüyü kapat.
    if (location.pathname === '/builder' || location.pathname === '/') {
      setSidebarOpen(false);
    }
  }, [location.pathname]); // Bu hook sadece URL yolu değiştiğinde çalışır.

  return (
    <Box sx={{ display: 'flex' }}>
      {/* SOL MENÜ (SIDEBAR) */}
      <Box sx={(theme) => ({
        width: isSidebarOpen ? 240 : 70,
        height: '100vh',
        bgcolor: '#1e2128',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        whiteSpace: 'nowrap',
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      })}>
        {/* Logo ve Açma/Kapama Butonu */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isSidebarOpen && (
            <Box sx={{ display: 'flex', alignItems: 'center', opacity: isSidebarOpen ? 1 : 0, transition: 'opacity 0.3s' }}>
              <img
                src="/favicon.jpeg"
                alt="FlexiLink Logo"
                style={{ width: '28px', height: '28px', marginRight: '10px' }}
              />
              <ListItemText
                primary="FlexiLink"
                primaryTypographyProps={{ fontSize: '1.2rem', fontWeight: 'bold' }}
              />
            </Box>
          )}
          <IconButton onClick={handleSidebarToggle} sx={{ color: '#fff' }}>
            {isSidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
        <Divider sx={{ bgcolor: '#444' }} />

        {/* Menü Linkleri */}
        <List component="nav" sx={{ flexGrow: 1 }}>
          {/* 2. onClick'ler navigate kullanacak, selected ise location.pathname'i kontrol edecek */}
          <ListItemButton selected={location.pathname === '/builder' || location.pathname === '/'} onClick={() => navigate('/builder')}>
            <ListItemIcon sx={{ color: 'inherit' }}><BuildIcon /></ListItemIcon>
            {isSidebarOpen && <ListItemText primary="Builder" />}
          </ListItemButton>
          <ListItemButton selected={location.pathname === '/sources'} onClick={() => navigate('/sources')}>
            <ListItemIcon sx={{ color: 'inherit' }}><SourceIcon /></ListItemIcon>
            {isSidebarOpen && <ListItemText primary="Sources" />}
          </ListItemButton>
          <ListItemButton selected={location.pathname === '/destinations'} onClick={() => navigate('/destinations')}>
            <ListItemIcon sx={{ color: 'inherit' }}><OutputIcon /></ListItemIcon>
            {isSidebarOpen && <ListItemText primary="Destinations" />}
          </ListItemButton>
        </List>
        <Divider sx={{ bgcolor: '#444' }} />

        {/* Logout Butonu */}
        {/* Logout Butonu */}
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
          {isSidebarOpen ? (
            // MENÜ AÇIKKEN GÖSTERİLECEK BÜYÜK BUTON
            <Button
              variant="contained"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              fullWidth
              sx={{
                height: 44, // Butonu daha büyük yapalım
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              Logout
            </Button>
          ) : (
            // MENÜ KAPALIYKEN GÖSTERİLECEK SADECE İKON
            <Tooltip title="Logout" placement="right">
              <IconButton
                onClick={handleLogout}
                sx={{
                  color: '#fff',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ANA İÇERİK ALANI */}
      <Box component="main" sx={{ flexGrow: 1, height: '100vh', overflow: 'auto' }}>
        {/* 3. Router'ın çocuk route'ları render edeceği yer */}
        <Outlet />
      </Box>
    </Box>
  );
}

// Ana App Component'i (Sadece Yönlendirme)
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/register" element={<RegisterView />} />

      {/* 4. MainLayout artık iç içe geçmiş route'ları sarmalıyor */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<BuilderView />} /> {/* Ana sayfa (/) için default */}
          <Route path="builder" element={<BuilderView />} />
          <Route path="sources" element={<SourcesView />} />
          <Route path="destinations" element={<DestinationsView />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;