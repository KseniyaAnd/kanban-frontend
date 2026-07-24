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
import type { Task } from '../shared/interfaces/Task'

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

  const { mutate: reorderTask } = useMutation({
    mutationFn: ({
      taskId,
      fromColumnId,
      newColumnId,
      newOrder,
    }: {
      taskId: string
      fromColumnId: string
      newColumnId: string
      newOrder: number
    }) =>
      apiClient.patch(`/boards/${boardId}/columns/${fromColumnId}/tasks/${taskId}/order`, {
        newOrder,
        newColumnId,
      }),

    onSettled: async (_, __, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['board', boardId, 'columns', variables.fromColumnId, 'tasks'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['board', boardId, 'columns', variables.newColumnId, 'tasks'],
        }),
      ])
    },
  })

  const { mutate: reorderColumn } = useMutation({
    mutationFn: async ({ columnId, order }: { columnId: string; order: number }) => {
      return apiClient
        .patch<Column>(`/boards/${boardId}/columns/${columnId}/order`, {
          newOrder: order,
        })
        .then((res) => res.data)
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['board', id],
      })
    },

    onError: (err) => {
      console.error('Failed to reorder column', err)
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith('column-')) {
      const activeColumnId = activeId.replace('column-', '')
      const overColumnId = overId.replace('column-', '')

      if (activeColumnId === overColumnId) {
        return
      }

      const newOrder = columns.findIndex((column) => column.id === overColumnId)

      if (newOrder === -1) {
        return
      }

      reorderColumn({
        columnId: activeColumnId,
        order: newOrder,
      })

      return
    }

    if (activeId.startsWith('task-')) {
      const taskId = activeId.replace('task-', '')

      let fromColumnId: string | undefined
      let toColumnId: string | undefined
      let newOrder = 0

      for (const column of columns) {
        const tasks =
          queryClient.getQueryData<{ tasks: Task[] }>([
            'board',
            boardId,
            'columns',
            column.id,
            'tasks',
          ])?.tasks || []

        const isTaskInCurrentColumn = tasks.some((task) => task.id === taskId)

        if (isTaskInCurrentColumn) {
          fromColumnId = column.id
        }

        if (overId === `column-${column.id}`) {
          toColumnId = column.id
          newOrder = tasks.length
        }

        const overTaskIndex = tasks.findIndex((task) => `task-${task.id}` === overId)

        if (overTaskIndex !== -1) {
          toColumnId = column.id
          newOrder = overTaskIndex
        }
      }

      if (!fromColumnId || !toColumnId) {
        return
      }

      reorderTask({
        taskId,
        fromColumnId,
        newColumnId: toColumnId,
        newOrder,
      })
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
