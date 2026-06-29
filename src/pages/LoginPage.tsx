import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient, setAuthToken } from '../api/client'

type LoginForm = { email: string; password: string }
type AuthResponse = { accessToken: string; refreshToken: string }

export default function LoginPage() {
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm<LoginForm>()

  const mutation = useMutation({
    mutationFn: (data: LoginForm) =>
      apiClient.post<AuthResponse>('/auth/login', data).then((res) => res.data),
    onSuccess: (data) => {
      localStorage.setItem('token', data.accessToken)
      setAuthToken(data.accessToken)
      void navigate('/boards')
    },
  })

  return (
    <div>
      <h1>Вход</h1>
      <form
        onSubmit={handleSubmit((data) => {
          mutation.mutate(data)
        })}
      >
        <input {...register('email')} placeholder="Email" />
        <input {...register('password')} type="password" placeholder="Пароль" />
        <button type="submit" disabled={mutation.isPending}>
          Войти
        </button>
      </form>
      <p>
        Нет аккаунта? <Link to="/auth/register">Зарегистрироваться</Link>
      </p>
    </div>
  )
}
