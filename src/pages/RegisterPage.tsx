import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { apiClient } from '../api/client'
import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button, Paper, Typography, Box, Link, CircularProgress } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useMemo } from 'react'

type RegisterResponse = { message: string }

export default function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const registerSchema = useMemo(
    () =>
      z
        .object({
          email: z.email({ error: t('auth.validation.emailInvalid') }),
          name: z.string({ error: t('auth.validation.nameRequired') }),
          password: z
            .string({ error: t('auth.validation.passwordRequired') })
            .min(6, { error: t('auth.validation.passwordMin') }),
          passwordRepeat: z
            .string()
            .min(1, { message: t('auth.validation.passwordRepeatRequired') }),
        })
        .refine((data) => data.password === data.passwordRepeat, {
          message: t('auth.validation.passwordsDontMatch'),
          path: ['passwordRepeat'],
        }),
    [t],
  )

  type RegisterForm = z.infer<typeof registerSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      passwordRepeat: '',
    },
  })

  const {
    mutate: registerUser,
    isPending,
    isError,
  } = useMutation({
    mutationFn: (data: RegisterForm) =>
      apiClient.post<RegisterResponse>('/auth/register', data).then((res) => res.data),
    onSuccess: async () => {
      await navigate('/auth/login')
    },
    onError: (err) => {
      console.error('Ошибка при регистрации:', err)
    },
  })

  const onSubmit = (data: RegisterForm) => {
    registerUser(data)
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
        {t('auth.register.title')}
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
          {...register('name')}
          type="text"
          label={t('auth.fields.name')}
          variant="outlined"
          fullWidth
          required
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          {...register('password')}
          type="password"
          label={t('auth.fields.password')}
          variant="outlined"
          fullWidth
          required
          error={!!errors.password}
          helperText={errors.password?.message}
        />

        <TextField
          {...register('passwordRepeat')}
          type="password"
          label={t('auth.fields.passwordRepeat')}
          variant="outlined"
          fullWidth
          required
          error={!!errors.passwordRepeat}
          helperText={errors.passwordRepeat?.message}
        />

        {isError && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {t('auth.register.error')}
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
          {isPending ? <CircularProgress size={24} color="inherit" /> : t('auth.register.submit')}
        </Button>
      </Box>

      <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
        {t('auth.register.hasAccount')}{' '}
        <Link
          component={RouterLink}
          to="/auth/login"
          underline="hover"
          sx={{ fontWeight: 'medium' }}
        >
          {t('auth.register.loginLink')}
        </Link>
      </Typography>
    </Paper>
  )
}
