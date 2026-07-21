import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { BoardCard } from '../shared/components/BoardCard'
import type { Board } from '../shared/interfaces/Board'
import { Grid, Container, Typography, CircularProgress, Box, Alert } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export default function BoardsPage() {
  const { t } = useTranslation('board')
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const {
    data,
    isLoading: isBoardsLoading,
    isError: isBoardsError,
  } = useQuery({
    queryKey: ['boards'],
    queryFn: () => apiClient.get<{ boards: Board[] }>('/boards').then((res) => res.data),
  })

  const {
    mutate: deleteBoard,
    isPending: isBoardDeleteLoading,
    isError: isBoardDeleteError,
  } = useMutation({
    mutationKey: ['boards'],
    mutationFn: (id: string) => apiClient.delete(`/boards/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['boards'] })
    },
    onError: (error) => {
      console.error(t('delete.consoleError'), error)
    },
  })

  if (isBoardsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isBoardsError) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">{t('loadError')}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        {t('title')}
      </Typography>

      {isBoardDeleteError && <Alert severity="error">{t('delete.error')}</Alert>}

      {data?.boards.length === 0 ? (
        <Typography>{t('empty')}</Typography>
      ) : (
        <Grid container spacing={2}>
          {data?.boards.map((board) => (
            <Grid key={board.id} size={{ lg: 3 }}>
              <BoardCard
                board={board}
                onDelete={deleteBoard}
                isDeleting={isBoardDeleteLoading}
                onClick={() => navigate(`/boards/${board.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
