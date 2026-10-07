import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LandingPage from './LandingPage'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="path">{location.pathname}</div>
}

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <LocationProbe />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat/:roomId" element={<div>chat-screen</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('muestra el título y el botón de crear chat', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1, name: /Secret/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Crear Chat Secreto' })).toBeTruthy()
  })

  it('navega a /chat/:roomId con un id aleatorio al crear chat', () => {
    renderLanding()
    fireEvent.click(screen.getByRole('button', { name: 'Crear Chat Secreto' }))
    expect(screen.getByTestId('path').textContent).toMatch(/^\/chat\/[0-9a-f]{12}$/)
  })

  it('el botón del APK está deshabilitado hasta la fase 5', () => {
    renderLanding()
    const apkButton = screen.getByRole('button', { name: 'Descargar App (APK)' })
    expect((apkButton as HTMLButtonElement).disabled).toBe(true)
  })
})
