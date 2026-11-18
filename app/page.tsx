'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface Dish {
  id: number
  name: string
  price: number
}

interface Order {
  id: number
  createdAt: string
  total: number
  status: string
}

export default function Home() {
  const [user, setUser] = useState<{ login: string } | null>(null)
  const [loginInput, setLoginInput] = useState('')
  const [password, setPassword] = useState('')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [cart, setCart] = useState<{ [dishId: number]: number }>({})
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  // Проверка сессии и загрузка данных при старте
  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      setUser({ login: savedUser })
      loadOrders()
    }

    loadMenu()
  }, [])

  // Загрузка меню из .NET API
  async function loadMenu() {
    try {
      const res = await api('/menu')
      if (res.ok) {
        const data = await res.json()
        setDishes(data)
      }
    } catch (e) {
      console.error('Ошибка загрузки меню:', e)
    }
  }

  // Загрузка заказов текущего пользователя
  async function loadOrders() {
    try {
      const res = await api('/orders/my')
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (e) {
      console.error('Ошибка загрузки заказов:', e)
    }
  }

  // Вход / Регистрация через .NET API
  // Вход / Регистрация через .NET API
  async function handleAuth(isSignUp: boolean) {
    setLoading(true)
    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login'

    try {
      const res = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify({ login: email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка авторизации')
      }

      if (isSignUp) {
        alert('Регистрация успешна! Теперь вы можете войти.')
      } else if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', email)
        setUser({ login: email })
        setEmail('')
        setPassword('')
        loadOrders()
        alert('Успешный вход!')
      }
    } catch (e: any) {
      alert(e.message || 'Ошибка соединения с сервером')
    } finally {
      setLoading(false)
    }
  }

  // Выход
  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setOrders([])
    alert('Вы вышли из системы')
  }

  // Управление корзиной
  function addToCart(dishId: number) {
    setCart(prev => ({ ...prev, [dishId]: (prev[dishId] || 0) + 1 }))
  }

  function removeFromCart(dishId: number) {
    setCart(prev => {
      const updated = { ...prev }
      if (updated[dishId] > 1) {
        updated[dishId] -= 1
      } else {
        delete updated[dishId]
      }
      return updated
    })
  }

  // Оформление заказа
  async function handleCheckout() {
    const items = Object.entries(cart).map(([dishId, quantity]) => ({
      dishId: Number(dishId),
      quantity,
    }))

    if (items.length === 0) return alert('Корзина пуста')

    setLoading(true)
    try {
      const res = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({ items }),
      })

      setLoading(false)
      if (res.ok) {
        alert('Заказ успешно оформлен!')
        setCart({})
        loadOrders()
      } else {
        const err = await res.text()
        alert(`Ошибка оформления: ${err}`)
      }
    } catch (e) {
      setLoading(false)
      alert('Ошибка соединения с сервером')
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🍔 BurgerFlow Storefront</h1>

      {/* Блок авторизации */}
      <div style={{ background: '#f4f4f4', padding: 15, borderRadius: 8, marginBottom: 20 }}>
        {user ? (
          <div>
            <p>Вы вошли как: <b>{user.login}</b></p>
            <button onClick={handleLogout} style={{ padding: '8px 12px', background: '#d9534f', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Выйти
            </button>
          </div>
        ) : (
          <div>
            <h3>Вход / Регистрация</h3>
            <input 
              type="text" placeholder="Логин" value={loginInput} onChange={e => setLoginInput(e.target.value)} 
              style={{ marginRight: 10, padding: 6 }} 
            />
            <input 
              type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} 
              style={{ marginRight: 10, padding: 6 }} 
            />
            <button onClick={() => handleAuth(false)} disabled={loading} style={{ marginRight: 5, padding: 6 }}>Войти</button>
            <button onClick={() => handleAuth(true)} disabled={loading} style={{ padding: 6 }}>Регистрация</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Меню */}
        <div>
          <h2>Меню</h2>
          {dishes.length === 0 ? <p>Загрузка меню или оно пусто...</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {dishes.map(d => (
                <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #ddd', padding: 10, marginBottom: 8, borderRadius: 4 }}>
                  <span>{d.name} — <b>{d.price} ₸</b></span>
                  <button onClick={() => addToCart(d.id)} style={{ padding: '5px 10px', background: '#5cb85c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                    + В корзину
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Корзина */}
        <div>
          <h2>Корзина</h2>
          {Object.keys(cart).length === 0 ? <p>Корзина пуста</p> : (
            <div style={{ background: '#fff', border: '1px solid #ddd', padding: 10, borderRadius: 4 }}>
              {Object.entries(cart).map(([dishId, qty]) => {
                const dish = dishes.find(d => d.id === Number(dishId))
                if (!dish) return null
                return (
                  <div key={dishId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span>{dish.name} x {qty}</span>
                    <div>
                      <button onClick={() => addToCart(dish.id)} style={{ marginRight: 4 }}>+</button>
                      <button onClick={() => removeFromCart(dish.id)}>-</button>
                    </div>
                  </div>
                )
              })}
              <button 
                onClick={handleCheckout} 
                disabled={loading}
                style={{ width: '100%', marginTop: 10, padding: 10, background: '#0275d8', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                Оформить заказ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* История заказов (только для авторизованных) */}
      {user && (
        <div style={{ marginTop: 30 }}>
          <h2>Мои заказы</h2>
          {orders.length === 0 ? <p>У вас пока нет заказов</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
              <thead>
                <tr style={{ background: '#eee', textAlign: 'left' }}>
                  <th style={{ padding: 8, border: '1px solid #ddd' }}>ID</th>
                  <th style={{ padding: 8, border: '1px solid #ddd' }}>Дата</th>
                  <th style={{ padding: 8, border: '1px solid #ddd' }}>Сумма</th>
                  <th style={{ padding: 8, border: '1px solid #ddd' }}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>#{o.id}</td>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>{new Date(o.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>{o.total} ₸</td>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>{o.status || 'Создан'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  )
}
