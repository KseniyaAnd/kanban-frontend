import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Alert,
} from '@mui/material'

type UserProfileResponse = {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)

  const userSchema = useMemo(
    () =>
      z.object({
        email: z.string(),
        name: z.string().min(1, { message: t('auth.validation.nameRequired') }),
      }),
    [t],
  )

  type UserForm = z.infer<typeof userSchema>

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  })

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () =>
      apiClient.get<UserProfileResponse>('/users/profile').then((res) => {
        return res.data
      }),
  })

  useEffect(() => {
    if (profile) {
      reset({
        email: profile.email,
        name: profile.name,
      })
    }
  }, [profile, reset])

  const {
    mutate: updateProfile,
    isPending: isUpdating,
    isError: isProfileUpdatingError,
  } = useMutation({
    mutationFn: (data: UserForm) =>
      apiClient
        .put<UserProfileResponse>('/users/profile', { name: data.name })
        .then((res) => res.data),
    onSuccess: (updatedData) => {
      queryClient.setQueryData(['userProfile'], updatedData)
      setIsEditing(false)
    },
    onError: (err) => {
      console.error(t('errors.consoleUpdateError'), err)
    },
  })

  const onSubmit = (data: UserForm) => {
    updateProfile(data)
  }

  if (isProfileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {t('profile.title')}
        </Typography>

        {isProfileError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('errors.profileLoad')}
          </Alert>
        )}

        {isProfileUpdatingError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('errors.profileUpdate')}
          </Alert>
        )}

        <Stack
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          sx={{ mt: 2 }}
          spacing={3}
        >
          <TextField
            {...register('email')}
            label={t('auth.fields.email')}
            type="email"
            fullWidth
            disabled={true}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
            variant="filled"
          />

          <TextField
            {...register('name')}
            label={t('auth.fields.name')}
            type="text"
            fullWidth
            disabled={!isEditing}
            error={!!errors.name}
            helperText={errors.name?.message}
            variant={isEditing ? 'outlined' : 'filled'}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            {!isEditing ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setIsEditing(true)
                }}
              >
                {t('profile.edit')}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={() => {
                    setIsEditing(false)
                    reset()
                  }}
                  disabled={isUpdating}
                >
                  {t('profile.cancel')}
                </Button>
                <Button type="submit" variant="contained" color="success" loading={isUpdating}>
                  {t('profile.save')}
                </Button>
              </>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  )
}
