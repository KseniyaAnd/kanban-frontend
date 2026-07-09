import { createContext, useContext, useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { lightTheme, darkTheme } from '../theme'

interface ColorModeContextType {
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
})

interface ColorModeProviderProps {
  children: ReactNode
}

export function ColorModeProvider({ children }: ColorModeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('themeMode')
    return savedMode === 'dark' ? 'dark' : 'light'
  })

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const nextMode = prevMode === 'light' ? 'dark' : 'light'
          localStorage.setItem('themeMode', nextMode)
          return nextMode
        })
      },
    }),
    [],
  )

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode])

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export const useColorMode = () => useContext(ColorModeContext)
