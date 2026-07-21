import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { apiClient } from '../../api/client'
import type { Task } from '../interfaces/Task'
import { useTranslation } from 'react-i18next'
import { useForm, type SubmitHandler } from 'react-hook-form'

interface TaskCardProps {
  boardId: string
  columnId: string
  task: Task
}

interface UpdateTaskDto {
  title: string
  description?: string
}

export function TaskCard({ boardId, columnId, task }: TaskCardProps) {
  const { t } = useTranslation(['board', 'auth', 'profile'])
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<UpdateTaskDto>({
    mode: 'onChange',
    defaultValues: {
      title: task.title,
      description: task.description || '',
    },
  })

  const tasksQueryKey = ['board', boardId, 'columns', columnId, 'tasks']

  const { mutate: updateTask, isPending: isUpdating } = useMutation({
    mutationFn: (dto: UpdateTaskDto) =>
      apiClient
        .patch<Task>(`/boards/${boardId}/columns/${columnId}/tasks/${task.id}`, dto)
        .then((res) => res.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksQueryKey })
      handleCloseModal()
    },
    onError: (err) => {
      console.error(t('tasks.update.consoleError'), err)
    },
  })

  const { mutate: deleteTask, isPending: isDeleting } = useMutation({
    mutationFn: () =>
      apiClient
        .delete<unknown>(`/boards/${boardId}/columns/${columnId}/tasks/${task.id}`)
        .then((res) => res.data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksQueryKey })
    },
    onError: (err) => {
      console.error(t('tasks.delete.consoleError'), err)
      alert(t('tasks.delete.error'))
    },
  })

  const handleOpenModal = () => {
    reset({
      title: task.title,
      description: task.description || '',
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const onSubmit: SubmitHandler<UpdateTaskDto> = (formData) => {
    updateTask({
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
    })
  }

  const handleDelete = () => {
    if (window.confirm(t('tasks.delete.confirm', { title: task.title }))) {
      deleteTask()
    }
  }

  return (
    <>
      <Paper
        sx={{
          p: 1.5,
          backgroundColor: '#fff',
          boxShadow: 1,
          position: 'relative',
          opacity: isDeleting ? 0.5 : 1,
          pointerEvents: isDeleting ? 'none' : 'auto',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            display: 'flex',
            gap: 0.2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 1,
          }}
        >
          <IconButton size="small" onClick={handleOpenModal} disabled={isUpdating}>
            <EditIcon fontSize="small" style={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" color="error" onClick={handleDelete}>
            <DeleteIcon fontSize="small" style={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box sx={{ pr: 6, mt: 0.5 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
            {task.title}
          </Typography>
          {task.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, wordBreak: 'break-word' }}
            >
              {task.description}
            </Typography>
          )}
        </Box>
      </Paper>

      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="xs">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>{t('tasks.edit')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('fields.title')}
              type="text"
              fullWidth
              variant="outlined"
              error={!!errors.title}
              helperText={errors.title?.message}
              {...register('title', {
                required: t('tasks.titleRequired') || 'Title is required',
                validate: (value) =>
                  !!value.trim() || t('tasks.titleEmpty') || 'Title cannot be blank',
              })}
              disabled={isUpdating}
              required
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
              {...register('description')}
              disabled={isUpdating}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} disabled={isUpdating}>
              {t('profile.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isUpdating || !isValid}>
              {isUpdating ? t('tasks.saving') : t('profile.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  )
}
