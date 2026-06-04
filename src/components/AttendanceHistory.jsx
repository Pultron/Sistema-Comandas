import { useState, useEffect } from 'react'

export const AttendanceHistory = () => {
  const [history, setHistory] = useState({})
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    const attendanceKey = `attendance_${selectedDate}`
    const records = JSON.parse(localStorage.getItem(attendanceKey) || '{}')
    setHistory(records)
  }, [selectedDate])

  return (
    <div style={styles.container}>
      <h3 style={styles.title}> Historial de Asistencias</h3>

      <div style={styles.dateSelector}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.dateInput}
        />
      </div>

      {Object.keys(history).length === 0 ? (
        <p style={styles.empty}>No hay registros para esta fecha</p>
      ) : (
        <div style={styles.table}>
          {Object.entries(history).map(([userId, records]) => (
            <div key={userId} style={styles.userSection}>
              <h4 style={styles.userId}>Usuario: {userId}</h4>
              <div style={styles.records}>
                {records.map((record, idx) => (
                  <div key={idx} style={styles.record}>
                    <span style={styles.recordType}>
                      {record.type === 'entrada' ? '🟢' : '🔴'} {record.type}
                    </span>
                    <span style={styles.recordTime}>{record.time}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    background: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    margin: '0 0 1rem 0',
    color: '#7D2BE8',
    fontSize: '1.2rem',
    fontWeight: 700,
  },
  dateSelector: {
    marginBottom: '1.5rem',
  },
  dateInput: {
    padding: '0.6rem 0.8rem',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    padding: '1rem',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  userSection: {
    background: '#f9f9f9',
    borderLeft: '4px solid #7D2BE8',
    padding: '1rem',
    borderRadius: '6px',
  },
  userId: {
    margin: '0 0 0.8rem 0',
    color: '#333',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  records: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  record: {
    display: 'flex',
    gap: '1rem',
    fontSize: '0.9rem',
    color: '#555',
  },
  recordType: {
    fontWeight: 600,
    minWidth: '100px',
  },
  recordTime: {
    color: '#999',
    fontFamily: 'monospace',
  },
}
