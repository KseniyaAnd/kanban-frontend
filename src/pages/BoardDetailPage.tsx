import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import type { Column } from '../shared/interfaces/Column'
import { BoardColumn } from '../shared/components/BoardColumn'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CreateColumnDto {
  title: string
}

export default function BoardDetailPage() {
  const { t } = useTranslation('board')
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')

  const boardId = id ?? ''

  const {
    data,
    isLoading: isBoardLoading,
    isError: isBoardError,
  } = useQuery({
    queryKey: ['board', id],
    queryFn: () => {
      if (!id) {
        return Promise.reject(new Error(t('boards.detail.missingIdError')))
      }

      return apiClient.get<{ columns: Column[] }>(`/boards/${id}/columns`).then((res) => res.data)
    },
    enabled: !!id,
  })

  const { mutate: createColumn, isPending: isCreating } = useMutation({
    mutationFn: (dto: CreateColumnDto) =>
      apiClient.post<Column>(`/boards/${boardId}/columns`, dto).then((res) => res.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['board', id] })
      handleCloseModal()
    },
    onError: (err) => {
      console.error(t('boards.detail.consoleCreateError'), err)
    },
  })

  const columns = data?.columns || []

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setNewColumnTitle('')
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newColumnTitle.trim()) return

    createColumn({ title: newColumnTitle.trim() })
  }

  if (isBoardError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{t('boards.detail.loadError')}</Alert>
      </Container>
    )
  }

  if (isBoardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {t('boards.detail.title')}
        </Typography>
        <Button variant="contained" color="primary" onClick={handleOpenModal}>
          {t('boards.detail.addColumn')}
        </Button>
      </Box>

      {columns.length === 0 ? (
        <Typography color="text.secondary">{t('boards.detail.emptyColumns')}</Typography>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            pb: 2,
            alignItems: 'flex-start',
          }}
        >
          {[...columns].map((column) => (
            <BoardColumn
              key={column.id}
              boardId={id ?? ''}
              columnId={column.id}
              title={column.title}
            />
          ))}
        </Box>
      )}

      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit}>
          <DialogTitle>{t('boards.detail.newColumnTitle')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('boards.detail.columnNameLabel')}
              type="text"
              fullWidth
              variant="outlined"
              value={newColumnTitle}
              onChange={(e) => {
                setNewColumnTitle(e.target.value)
              }}
              disabled={isCreating}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} disabled={isCreating}>
              {t('profile.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreating || !newColumnTitle.trim()}
            >
              {isCreating ? t('boards.detail.creatingButton') : t('boards.detail.createButton')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}
