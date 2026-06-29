import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { apiClient } from '../api/client'

type RegisterForm = {
  email: string
  name: string
  password: string
  passwordRepeat: string
}
type RegisterResponse = { message: string }

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit } = useForm<RegisterForm>()

  const mutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      apiClient.post<RegisterResponse>('/auth/register', data).then((res) => res.data),
    onSuccess: () => {
      void navigate('/auth/login')
    },
  })

  return (
    <div>
      <h1>Регистрация</h1>
      <form
        onSubmit={handleSubmit((data: RegisterForm) => {
          mutation.mutate(data)
        })}
      >
        <input {...register('email')} placeholder="Email" />
        <input {...register('name')} placeholder="Имя" />
        <input {...register('password')} type="password" placeholder="Пароль" />
        <input {...register('passwordRepeat')} type="password" placeholder="Повторите пароль" />
        <button type="submit" disabled={mutation.isPending}>
          Зарегистрироваться
        </button>
      </form>
      <p>
        Уже есть аккаунт? <Link to="/auth/login">Войти</Link>
      </p>
    </div>
  )
}
