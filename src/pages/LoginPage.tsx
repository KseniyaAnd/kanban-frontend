import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { apiClient } from '../api/client'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button, Paper, Typography, Box, Link, CircularProgress } from '@mui/material'
import { useAuthStore } from '../store/useAuthStore'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'

type AuthResponse = { accessToken: string; refreshToken: string }

export default function LoginPage() {
  const { t } = useTranslation(['auth', 'errors'])
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.email({ error: t('auth.validation.emailInvalid') }),
        password: z
          .string({ error: t('auth.validation.passwordRequired') })
          .min(6, { error: t('auth.validation.passwordMin') }),
      }),
    [t],
  )

  type LoginForm = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const {
    mutate: login,
    isPending,
    isError,
  } = useMutation({
    mutationFn: (data: LoginForm) =>
      apiClient.post<AuthResponse>('/auth/login', data).then((res) => res.data),
    onSuccess: async (data) => {
      setToken(data.accessToken)
      await navigate('/boards')
    },
    onError: (err) => {
      console.error(t('errors.consoleLoginError'), err)
    },
  })

  const onSubmit = (data: LoginForm) => {
    login(data)
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 4,
        width: '100%',
        maxWidth: 400,
        borderRadius: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        {t('auth.login.title')}
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
        }}
      >
        <TextField
          {...register('email')}
          type="email"
          label={t('auth.fields.email')}
          variant="outlined"
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <TextField
          {...register('password')}
          type="password"
          label={t('auth.fields.password')}
          variant="outlined"
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
        />

        {isError && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {t('auth.login.error')}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={isPending}
          sx={{ py: 1.2, fontWeight: 'bold', mt: 1 }}
        >
          {isPending ? <CircularProgress size={24} color="inherit" /> : t('auth.login.submit')}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
        {t('auth.login.noAccount')}{' '}
        <Link
          component={RouterLink}
          to="/auth/register"
          underline="hover"
          sx={{ fontWeight: 'medium' }}
        >
          {t('auth.login.registerLink')}
        </Link>
      </Typography>
    </Paper>
  )
}
