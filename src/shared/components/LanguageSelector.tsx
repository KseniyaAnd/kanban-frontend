import React from 'react'
import { IconButton, Menu, MenuItem } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import { useTranslation } from 'react-i18next'

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLanguageChange = (lng: string) => {
    void i18n.changeLanguage(lng)
    handleClose()
  }

  return (
    <>
      <IconButton onClick={handleClick} color="inherit" aria-label="select language">
        <LanguageIcon />
      </IconButton>
      <Menu id="language-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            handleLanguageChange('ru')
          }}
          selected={i18n.language === 'ru'}
        >
          Русский
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleLanguageChange('en')
          }}
          selected={i18n.language === 'en'}
        >
          English
        </MenuItem>
      </Menu>
    </>
  )
}
