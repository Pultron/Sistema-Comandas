import { useState } from 'react'
import { appStyles } from '../styles/styles'

export const AttendanceRegister = ({ isOpen, onClose }) => {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)

  const users = {
    '234': '1234',
    '123': '5678',
    '456': '9012',
  }

  const handleRegister = () => {
    setLoading(true)
    setMessage('')

    if (!userId.trim()) {
      setMessage('Por favor ingresa tu número de usuario')
      setMessageType('error')
      setLoading(false)
      return
    }

    if (!password.trim()) {
      setMessage('Por favor ingresa tu contraseña')
      setMessageType('error')
      setLoading(false)
      return
    }

    if (users[userId] !== password) {
      setMessage('Usuario o contraseña incorrectos')
      setMessageType('error')
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const attendanceKey = `attendance_${today}`
    const attendanceRecords = JSON.parse(localStorage.getItem(attendanceKey) || '{}')

    const userRecords = attendanceRecords[userId] || []
    const now = new Date()
    const timeString = now.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const lastRecord = userRecords[userRecords.length - 1]
    let newRecord

    if (!lastRecord || lastRecord.type === 'salida') {
      newRecord = { type: 'entrada', time: timeString, timestamp: now.getTime() }
      setMessage(`Entrada registrada a las ${timeString}`)
      setMessageType('success')
    } else if (lastRecord.type === 'entrada') {
      newRecord = { type: 'salida', time: timeString, timestamp: now.getTime() }
      setMessage(`Salida registrada a las ${timeString}`)
      setMessageType('success')
    }

    userRecords.push(newRecord)
    attendanceRecords[userId] = userRecords
    localStorage.setItem(attendanceKey, JSON.stringify(attendanceRecords))

    setUserId('')
    setPassword('')
    setLoading(false)

    setTimeout(() => {
      onClose()
      setMessage('')
      setMessageType('')
    }, 2000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userId && password) {
      handleRegister()
    }
  }

  if (!isOpen) return null

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          {/* Espaciador izquierdo para equilibrar el botón derecho */}
          <div style={{ width: '2.5rem' }} />
          <h2 style={styles.modalTitle}>📋 Registrar Asistencia</h2>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => (e.target.style.background = 'rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.target.style.background = 'transparent')}
          >
            ✕
          </button>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Número de Usuario</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: 234"
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd'
                e.target.style.boxShadow = 'none'
              }}
              disabled={loading}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa tu contraseña"
              style={styles.input}
              onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd'
                e.target.style.boxShadow = 'none'
              }}
              disabled={loading}
            />
          </div>

          {message && (
            <div
              style={{
                ...styles.message,
                ...(messageType === 'success' ? styles.messageSuccess : styles.messageError),
              }}
            >
              {message}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button
              style={styles.cancelButton}
              onClick={onClose}
              onMouseEnter={(e) => (e.target.style.background = '#fee2e2')}
              onMouseLeave={(e) => (e.target.style.background = '#fecaca')}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              style={{ ...styles.submitButton, opacity: loading ? 0.7 : 1 }}
              onClick={handleRegister}
              onMouseEnter={(e) => { if (!loading) e.target.style.background = '#059669' }}
              onMouseLeave={(e) => { if (!loading) e.target.style.background = '#10B981' }}
              disabled={loading}
            >
              {loading ? '⏳ Registrando...' : '✓ Registrar'}
            </button>
          </div>

          <div style={styles.hint}>
            <strong>Demo usuarios:</strong> 234 (1234), 123 (5678), 456 (9012)
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', 
    zIndex: 1000,
  },
  modalContent: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    width: '100%',
    maxWidth: '450px',
    overflow: 'hidden',
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #7D2BE8 0%, #5A1FA5 100%)',
    color: 'white',
    padding: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    textAlign: 'center',
    flex: 1, 
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    width: '2.5rem', 
  },
  modalBody: {
    padding: '2rem',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#333',
    marginBottom: '0.6rem',
  },
  input: {
    width: '100%',
    padding: '0.9rem 1rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'all 0.3s',
    fontFamily: 'inherit',
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#7D2BE8',
    boxShadow: '0 0 0 3px rgba(125, 43, 232, 0.1)',
  },
  message: {
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
    fontWeight: 500,
    textAlign: 'center',
  },
  messageSuccess: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac',
  },
  messageError: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1rem',
  },
  cancelButton: {
    padding: '0.9rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    background: '#fecaca',
    color: '#991b1b',
    transition: 'all 0.2s',
  },
  submitButton: {
    padding: '0.9rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    background: '#10B981',
    color: 'white',
    transition: 'all 0.2s',
  },
  hint: {
    fontSize: '0.85rem',
    color: '#666',
    textAlign: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
  },
}