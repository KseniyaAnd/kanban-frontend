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
import { useForm } from 'react-hook-form'

interface CreateColumnDto {
  title: string
}

interface FormValues {
  title: string
}

export default function BoardDetailPage() {
  const { t } = useTranslation('board')
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [isModalOpen, setIsModalOpen] = useState(false)

  const boardId = id ?? ''

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      title: '',
    },
  })

  const {
    data,
    isLoading: isBoardLoading,
    isError: isBoardError,
  } = useQuery({
    queryKey: ['board', id],
    queryFn: () => {
      if (!id) {
        return Promise.reject(new Error(t('detail.missingIdError')))
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
      console.error(t('detail.consoleCreateError'), err)
    },
  })

  const columns = data?.columns || []

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    reset()
  }

  const onSubmit = (formData: FormValues) => {
    createColumn({ title: formData.title.trim() })
  }

  if (isBoardError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{t('detail.loadError')}</Alert>
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
          {t('detail.title')}
        </Typography>
        <Button variant="contained" color="primary" onClick={handleOpenModal}>
          {t('detail.addColumn')}
        </Button>
      </Box>

      {columns.length === 0 ? (
        <Typography color="text.secondary">{t('detail.emptyColumns')}</Typography>
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
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{t('detail.newColumnTitle')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('detail.columnNameLabel')}
              type="text"
              fullWidth
              variant="outlined"
              disabled={isCreating}
              error={!!errors.title}
              helperText={errors.title?.message}
              {...register('title', {
                required: t('detail.columnNameRequired') || 'Title is required',
                validate: (value) =>
                  !!value.trim() || t('detail.columnNameEmpty') || 'Title cannot be blank',
              })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} disabled={isCreating}>
              {t('profile.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isCreating || !isValid}>
              {isCreating ? t('detail.creatingButton') : t('detail.createButton')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}
