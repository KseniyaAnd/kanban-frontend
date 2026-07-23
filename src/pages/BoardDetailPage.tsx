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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
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
  const queryKey = ['board', id]

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  )

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

  const columns = data?.columns || []

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

  const { mutate: reorderColumns } = useMutation({
    mutationFn: async ({ columnId, order }: { columnId: string; order: number }) => {
      return apiClient
        .patch<Column>(`/boards/${boardId}/columns/${columnId}/order`, {
          newOrder: order,
        })
        .then((res) => res.data)
    },
    onMutate: async ({ columnId, order }) => {
      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData<{ columns: Column[] }>(queryKey)

      queryClient.setQueryData<{ columns: Column[] }>(queryKey, (old) => {
        if (!old) return old

        const newColumns = [...old.columns]
        const oldIndex = newColumns.findIndex((col) => col.id === columnId)

        if (oldIndex !== -1) {
          const [movedColumn] = newColumns.splice(oldIndex, 1)
          newColumns.splice(order, 0, movedColumn)
        }

        return { ...old, columns: newColumns }
      })

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const newIndex = columns.findIndex((col) => col.id === over.id)

      if (newIndex !== -1) {
        reorderColumns({ columnId: String(active.id), order: newIndex })
      }
    }
  }

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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                overflowX: 'auto',
                pb: 2,
                alignItems: 'flex-start',
              }}
            >
              {columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  boardId={id ?? ''}
                  columnId={column.id}
                  title={column.title}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
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
