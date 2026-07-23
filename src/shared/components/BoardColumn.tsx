import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { apiClient } from '../../api/client'
import type { Task } from '../interfaces/Task'
import type { Column } from '../interfaces/Column'
import { TaskCard } from './TaskCard'
import { useTranslation } from 'react-i18next'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'

interface BoardColumnProps {
  boardId: string
  columnId: string
  title: string
}

interface UpdateColumnDto {
  title: string
}

interface CreateTaskDto {
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
}

export function BoardColumn({ boardId, columnId, title }: BoardColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: columnId,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const { t } = useTranslation(['board', 'auth', 'profile'])
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const tasksQueryKey = ['board', boardId, 'columns', columnId, 'tasks']

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  )

  const {
    register: registerTask,
    handleSubmit: handleTaskSubmit,
    reset: resetTaskForm,
    formState: { errors: taskErrors, isValid: isTaskFormValid },
  } = useForm<CreateTaskDto>({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      priority: 'LOW',
    },
  })

  const {
    data,
    isLoading: isTasksLoading,
    isError: isTasksError,
  } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => {
      return apiClient
        .get<{ tasks: Task[] }>(`/boards/${boardId}/columns/${columnId}/tasks`)
        .then((res) => res.data)
    },
  })

  const { mutate: updateColumn, isPending: isUpdating } = useMutation({
    mutationFn: (dto: UpdateColumnDto) =>
      apiClient.put<Column>(`/boards/${boardId}/columns/${columnId}`, dto).then((res) => res.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      setIsEditing(false)
    },
    onError: (err) => {
      console.error(t('columns.update.consoleError'), err)
      setEditedTitle(title)
      setIsEditing(false)
    },
  })

  const { mutate: deleteColumn, isPending: isDeleting } = useMutation({
    mutationFn: () =>
      apiClient.delete<unknown>(`/boards/${boardId}/columns/${columnId}`).then((res) => res.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['board', boardId] })
    },
    onError: (err) => {
      console.error(t('columns.delete.consoleError'), err)
      alert(t('columns.delete.error'))
    },
  })

  const { mutate: createTask, isPending: isCreatingTask } = useMutation({
    mutationFn: (dto: CreateTaskDto) =>
      apiClient
        .post<Task>(`/boards/${boardId}/columns/${columnId}/tasks`, dto)
        .then((res) => res.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksQueryKey })
      handleCloseTaskModal()
    },
    onError: (err) => {
      console.error(t('tasks.create.consoleError'), err)
    },
  })

  const tasks = data?.tasks || []

  const { mutate: reorderTask } = useMutation({
    mutationFn: ({
      taskId,
      newOrder,
      newColumnId,
    }: {
      taskId: string
      newOrder: number
      newColumnId: string
    }) => {
      return apiClient
        .patch<Task>(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/order`, {
          newOrder,
          newColumnId,
        })
        .then((res) => res.data)
    },
    onMutate: async ({ taskId, newOrder }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey })

      const previousData = queryClient.getQueryData<{ tasks: Task[] }>(tasksQueryKey)

      queryClient.setQueryData<{ tasks: Task[] }>(tasksQueryKey, (old) => {
        if (!old) return old

        const newTasks = [...old.tasks]
        const oldIndex = newTasks.findIndex((task) => task.id === taskId)

        if (oldIndex !== -1) {
          const [movedTask] = newTasks.splice(oldIndex, 1)
          newTasks.splice(newOrder, 0, movedTask)
        }

        return { ...old, tasks: newTasks }
      })

      return { previousData }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(tasksQueryKey, context.previousData)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksQueryKey })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const newIndex = tasks.findIndex((task) => task.id === over.id)

    if (newIndex === -1) return

    reorderTask({
      taskId: String(active.id),
      newOrder: newIndex,
      newColumnId: columnId,
    })
  }

  const handleSave = () => {
    const trimmedTitle = editedTitle.trim()
    if (!trimmedTitle || trimmedTitle === title) {
      setEditedTitle(title)
      setIsEditing(false)
      return
    }
    updateColumn({ title: trimmedTitle })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditedTitle(title)
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (window.confirm(t('columns.delete.confirm', { title }))) {
      deleteColumn()
    }
  }

  const handleOpenTaskModal = () => {
    setIsTaskModalOpen(true)
  }

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false)
    resetTaskForm()
  }

  const onTaskSubmit: SubmitHandler<CreateTaskDto> = (formData) => {
    createTask({
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      priority: formData.priority || 'LOW',
    })
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isDragging ? 6 : 2}
      sx={{
        p: 2,
        minHeight: 500,
        backgroundColor: 'background.paper',
        width: 280,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          minHeight: 40,
          opacity: isDeleting ? 0.5 : 1,
          pointerEvents: isDeleting ? 'none' : 'auto',
        }}
      >
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            mr: 1,
            color: 'action.active',
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </Box>

        {isEditing ? (
          <TextField
            autoFocus
            size="small"
            fullWidth
            variant="outlined"
            value={editedTitle}
            disabled={isUpdating}
            onChange={(e) => {
              setEditedTitle(e.target.value)
            }}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            sx={{ backgroundColor: 'background.default' }}
          />
        ) : (
          <>
            <Typography
              variant="h6"
              sx={{ fontWeight: 'bold', cursor: 'pointer', flexGrow: 1, wordBreak: 'break-word' }}
              onClick={() => {
                setIsEditing(true)
              }}
            >
              {title}
            </Typography>

            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              <IconButton
                size="small"
                onClick={() => {
                  setIsEditing(true)
                }}
                sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>

              <IconButton
                size="small"
                color="error"
                onClick={handleDelete}
                sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </>
        )}
      </Box>

      {isTasksLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {isTasksError && (
        <Alert severity="error" sx={{ py: 0, mb: 2 }}>
          {t('columns.loadError')}
        </Alert>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              flexGrow: 1,
              mb: 2,
            }}
          >
            {!isTasksLoading && !isTasksError && tasks.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center', my: 4 }}
              >
                {t('tasks.empty')}
              </Typography>
            ) : (
              tasks.map((task) => (
                <TaskCard key={task.id} boardId={boardId} columnId={columnId} task={task} />
              ))
            )}
          </Box>
        </SortableContext>
      </DndContext>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleOpenTaskModal}
        fullWidth
        sx={{
          mt: 'auto',
          borderColor: 'divider',
          color: 'text.primary',
          backgroundColor: 'action.hover',
          '&:hover': {
            borderColor: 'text.secondary',
            backgroundColor: 'action.selected',
          },
        }}
      >
        {t('tasks.add')}
      </Button>

      <Dialog open={isTaskModalOpen} onClose={handleCloseTaskModal} fullWidth maxWidth="xs">
        <form onSubmit={handleTaskSubmit(onTaskSubmit)}>
          <DialogTitle>{t('tasks.new')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('fields.title')}
              type="text"
              fullWidth
              variant="outlined"
              disabled={isCreatingTask}
              error={!!taskErrors.title}
              helperText={taskErrors.title?.message}
              {...registerTask('title', {
                required: t('tasks.titleRequired') || 'Title is required',
                validate: (value) =>
                  !!value.trim() || t('tasks.titleEmpty') || 'Title cannot be blank',
              })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label={t('fields.description')}
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              disabled={isCreatingTask}
              {...registerTask('description')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTaskModal} disabled={isCreatingTask}>
              {t('profile.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isCreatingTask || !isTaskFormValid}>
              {isCreatingTask ? t('tasks.creating') : t('profile.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  )
}
