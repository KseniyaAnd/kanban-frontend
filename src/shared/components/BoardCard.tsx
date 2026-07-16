import type { Board } from '../interfaces/Board'
import { Card, CardContent, Typography, Box, IconButton, CircularProgress } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import { useTranslation } from 'react-i18next'

interface BoardCardProps {
  board: Board
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function BoardCard({ board, onDelete, isDeleting }: BoardCardProps) {
  const { t } = useTranslation()

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isDeleting) return

    if (
      window.confirm(
        t('boards.delete.confirm', {
          title: board.title,
        }),
      )
    ) {
      onDelete(board.id)
    }
  }

  return (
    <Card
      sx={{
        width: '100%',
        minWidth: 240,
        position: 'relative',
        opacity: isDeleting ? 0.5 : 1,
        pointerEvents: isDeleting ? 'none' : 'auto',
      }}
    >
      <IconButton
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={t('boards.delete.ariaLabel')}
        size="small"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
        }}
      >
        {isDeleting ? <CircularProgress size={16} /> : <DeleteOutlineIcon fontSize="small" />}
      </IconButton>

      <CardContent sx={{ pr: 6 }}>
        <Typography variant="h6" noWrap>
          {board.title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {board.description || t('boards.noDescription')}
        </Typography>
      </CardContent>

      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="caption">
          {t('boards.updated')}: {new Date(board.updatedAt).toLocaleDateString()}
        </Typography>
      </Box>
    </Card>
  )
}
