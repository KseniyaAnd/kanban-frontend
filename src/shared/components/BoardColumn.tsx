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
import { apiClient } from '../../api/client'
import type { Task } from '../interfaces/Task'
import type { Column } from '../interfaces/Column'
import { TaskCard } from './TaskCard'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation(['board', 'auth', 'profile'])
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(title)

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')

  const tasksQueryKey = ['board', boardId, 'columns', columnId, 'tasks']

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
    setNewTaskTitle('')
    setNewTaskDescription('')
  }

  const handleTaskSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    createTask({
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      priority: 'LOW',
    })
  }

  return (
    <Paper
      sx={{
        p: 2,
        minHeight: 500,
        backgroundColor: '#f5f5f5',
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
            sx={{ backgroundColor: '#fff' }}
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

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, mb: 2 }}>
        {!isTasksLoading && !isTasksError && tasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', my: 4 }}>
            {t('tasks.empty')}
          </Typography>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} boardId={boardId} columnId={columnId} task={task} />
          ))
        )}
      </Box>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleOpenTaskModal}
        fullWidth
        sx={{
          mt: 'auto',
          borderColor: 'rgba(0, 0, 0, 0.12)',
          color: 'text.secondary',
          backgroundColor: '#fff',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.24)',
            backgroundColor: '#fafafa',
          },
        }}
      >
        {t('tasks.add')}
      </Button>

      <Dialog open={isTaskModalOpen} onClose={handleCloseTaskModal} fullWidth maxWidth="xs">
        <form onSubmit={handleTaskSubmit}>
          <DialogTitle>{t('tasks.new')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('auth.fields.title')}
              type="text"
              fullWidth
              variant="outlined"
              value={newTaskTitle}
              onChange={(e) => {
                setNewTaskTitle(e.target.value)
              }}
              disabled={isCreatingTask}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label={t('auth.fields.description')}
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newTaskDescription}
              onChange={(e) => {
                setNewTaskDescription(e.target.value)
              }}
              disabled={isCreatingTask}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTaskModal} disabled={isCreatingTask}>
              {t('profile.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isCreatingTask || !newTaskTitle.trim()}
            >
              {isCreatingTask ? t('tasks.creating') : t('profile.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Paper>
  )
}
