import { Outlet } from 'react-router-dom'
import { Box, IconButton, useTheme } from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useColorMode } from '../../context/ThemeContext'
import { LanguageSelector } from '../../shared/components/LanguageSelector'

export function Layout() {
  const theme = useTheme()
  const colorMode = useColorMode()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="header" sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <LanguageSelector />
        <IconButton onClick={colorMode.toggleColorMode} color="inherit">
          {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
