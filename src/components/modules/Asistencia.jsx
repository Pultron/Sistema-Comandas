import { useEffect, useMemo, useRef, useState } from 'react'
import { usePersonal } from '../../hooks/useSupabase'
import { supabase } from '../../supabase'
import '../../styles/Asistencia.css'

const MONTH_FORMAT = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' })
const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
const TIME_FORMAT = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })

const iconPaths = {
  check: <path d="M20 6 9 17l-5-5"></path>,
  clock: <><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></>,
  chevronLeft: <polyline points="15 18 9 12 15 6"></polyline>,
  chevronRight: <polyline points="9 18 15 12 9 6"></polyline>,
}

const Icon = ({ name, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {iconPaths[name]}
  </svg>
)

const addMonths = (date, amount) => new Date(date.getFullYear(), date.getMonth() + amount, 1)
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)
const isoDay = (date) => date.toISOString().slice(0, 10)
const parseDateOnly = (dateText) => {
  const [year, month, day] = String(dateText).split('-').map(Number)
  return new Date(year, month - 1, day)
}
const formatHours = (hours) => `${Math.floor(hours)}h ${Math.round((hours % 1) * 60).toString().padStart(2, '0')}m`
const formatTimeText = (time) => {
  if (!time) return '-'
  const [hour, minute] = String(time).split(':')
  const date = new Date()
  date.setHours(Number(hour || 0), Number(minute || 0), 0, 0)
  return TIME_FORMAT.format(date)
}
const calculateShiftHours = (startTime, endTime) => {
  const [startHour, startMinute] = String(startTime || '00:00').split(':').map(Number)
  const [endHour, endMinute] = String(endTime || '00:00').split(':').map(Number)
  const start = (startHour * 60) + (startMinute || 0)
  let end = (endHour * 60) + (endMinute || 0)
  if (end <= start) end += 24 * 60
  return Number(((end - start) / 60).toFixed(2))
}

const resolveAttendanceRecord = (row, selectedHorario, jornada = 8) => {
  const entrada = row?.fecha_entrada ? new Date(row.fecha_entrada) : null
  if (!entrada) return null

  const salida = row.fecha_salida ? new Date(row.fecha_salida) : null
  const lateLimit = new Date(entrada)
  const [hour, minute] = String(selectedHorario?.hora_entrada || '08:00').split(':').map(Number)
  const tolerancia = Number(selectedHorario?.tolerancia_minutos ?? 15)
  lateLimit.setHours(hour || 8, (minute || 0) + tolerancia, 0, 0)

  const normalizedStatus = String(row.estado || '').toLowerCase()
  const status = normalizedStatus.includes('ausente')
    ? 'falta'
    : entrada > lateLimit
      ? 'retardo'
      : 'asistencia'
  const worked = salida ? Math.max(0, (salida - entrada) / 36e5) : 0

  return {
    id: row.id,
    date: entrada,
    status,
    entrada,
    salida,
    worked,
    extra: Math.max(0, worked - jornada),
    lateLimit,
    tolerancia
  }
}

const statusLabels = {
  asistencia: 'Asistencia',
  retardo: 'Retardo',
  falta: 'Falta',
  descanso: 'Descanso',
  no_laborable: 'No laborable',
  permiso: 'Permiso'
}

const dayKeyByIndex = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
const dayOptions = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const defaultRestDays = ['sabado', 'domingo']
const ASISTENCIA_SELECTED_EMPLOYEE_KEY = 'gastrosoft_asistencia_selected_employee'
const ASISTENCIA_SELECTED_MONTH_KEY = 'gastrosoft_asistencia_selected_month'

const roleAreaMap = {
  admin: 'Administracion',
  administrador: 'Administracion',
  mesero: 'Salon',
  cocina: 'Cocina',
  chef: 'Cocina',
  cajero: 'Caja',
  caja: 'Caja'
}

const normalizeRestDays = (value) => {
  if (Array.isArray(value)) return value.map((day) => String(day).toLowerCase())
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((day) => day.trim().toLowerCase()).filter(Boolean)
  }
  return defaultRestDays
}

export const AsistenciaModule = () => {
  const { personal, loading } = usePersonal()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(() => localStorage.getItem(ASISTENCIA_SELECTED_EMPLOYEE_KEY) || '')
  const [monthDate, setMonthDate] = useState(() => {
    const savedMonth = localStorage.getItem(ASISTENCIA_SELECTED_MONTH_KEY)
    return savedMonth ? startOfMonth(parseDateOnly(savedMonth)) : startOfMonth(new Date())
  })
  const [attendanceRows, setAttendanceRows] = useState([])
  const [horarios, setHorarios] = useState([])
  const [employeeConfigs, setEmployeeConfigs] = useState([])
  const [eventos, setEventos] = useState([])
  const [festivos, setFestivos] = useState([])
  const [actionModal, setActionModal] = useState(null)
  const [actionError, setActionError] = useState('')
  const [savingAction, setSavingAction] = useState(false)
  const [notice, setNotice] = useState(null)
  const attendanceRequestRef = useRef(0)

  useEffect(() => {
    if ((!selectedEmployeeId || !personal.some((empleado) => String(empleado.id) === String(selectedEmployeeId))) && personal[0]) {
      setSelectedEmployeeId(String(personal[0].id))
    }
  }, [personal, selectedEmployeeId])

  useEffect(() => {
    if (selectedEmployeeId) {
      localStorage.setItem(ASISTENCIA_SELECTED_EMPLOYEE_KEY, String(selectedEmployeeId))
    }
  }, [selectedEmployeeId])

  useEffect(() => {
    localStorage.setItem(ASISTENCIA_SELECTED_MONTH_KEY, isoDay(startOfMonth(monthDate)))
  }, [monthDate])

  const selectedEmployee = useMemo(() => (
    personal.find((empleado) => String(empleado.id) === String(selectedEmployeeId)) || personal[0]
  ), [personal, selectedEmployeeId])

  const employeeConfig = useMemo(() => (
    employeeConfigs.find((config) => String(config.id_usuario) === String(selectedEmployee?.id))
  ), [employeeConfigs, selectedEmployee?.id])

  const selectedHorario = useMemo(() => (
    horarios.find((horario) => String(horario.id) === String(employeeConfig?.id_horario))
  ), [horarios, employeeConfig?.id_horario])

  const fetchModuleData = async () => {
    const [horariosRes, configsRes, festivosRes] = await Promise.all([
      supabase.from('horarios_asistencia').select('*').order('nombre'),
      supabase.from('empleados_asistencia').select('*').eq('activo', true),
      supabase.from('dias_festivos').select('*').eq('activo', true)
    ])

    if (!horariosRes.error) setHorarios(horariosRes.data || [])
    if (!configsRes.error) setEmployeeConfigs(configsRes.data || [])
    if (!festivosRes.error) setFestivos(festivosRes.data || [])
  }

  useEffect(() => {
    fetchModuleData()
  }, [])

  const fetchAttendanceAndEvents = async (employeeId = selectedEmployee?.id, targetMonth = monthDate, clearBeforeLoad = false) => {
    const requestId = ++attendanceRequestRef.current

    if (!employeeId) {
      setAttendanceRows([])
      setEventos([])
      return
    }

    if (clearBeforeLoad) {
      setAttendanceRows([])
      setEventos([])
    }

    const fromDate = startOfMonth(targetMonth)
    const toDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1)

    const [attendanceRes, eventosRes] = await Promise.all([
      supabase
        .from('asistencia')
        .select('*')
        .eq('id_usuario', employeeId)
        .gte('fecha_entrada', fromDate.toISOString())
        .lt('fecha_entrada', toDate.toISOString())
        .order('fecha_entrada', { ascending: true }),
      supabase
        .from('eventos_asistencia')
        .select('*')
        .eq('id_usuario', employeeId)
        .lte('fecha_inicio', isoDay(endOfMonth(targetMonth)))
        .or(`fecha_fin.is.null,fecha_fin.gte.${isoDay(startOfMonth(targetMonth))}`)
        .order('fecha_inicio', { ascending: true })
    ])

    if (requestId !== attendanceRequestRef.current) return

    if (attendanceRes.error) {
      console.error('No se pudo cargar asistencia del modulo:', attendanceRes.error.message)
      setAttendanceRows([])
    } else {
      setAttendanceRows(attendanceRes.data || [])
    }

    if (eventosRes.error) {
      console.error('No se pudieron cargar eventos de asistencia:', eventosRes.error.message)
      setEventos([])
    } else {
      setEventos(eventosRes.data || [])
    }
  }

  useEffect(() => {
    fetchAttendanceAndEvents(selectedEmployee?.id, monthDate, true)
  }, [selectedEmployee?.id, monthDate])

  useEffect(() => {
    const recargarAsistencia = () => {
      fetchAttendanceAndEvents(selectedEmployee?.id, monthDate, true)
    }
    window.addEventListener('asistencia:changed', recargarAsistencia)
    return () => window.removeEventListener('asistencia:changed', recargarAsistencia)
  }, [selectedEmployee?.id, monthDate])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(timer)
  }, [notice])

  const employeeProfile = useMemo(() => {
    const rol = selectedEmployee?.rol || 'Empleado'
    const restDays = employeeConfig?.dias_descanso?.length
      ? normalizeRestDays(employeeConfig.dias_descanso)
      : normalizeRestDays(selectedEmployee?.descanso)
    const horario = selectedHorario
      ? `${formatTimeText(selectedHorario.hora_entrada)} - ${formatTimeText(selectedHorario.hora_salida)}`
      : selectedEmployee?.horario || 'Sin horario asignado'

    return {
      nombre: selectedEmployee?.nombre || 'Selecciona un empleado',
      usuario: selectedEmployee?.usuario || '-',
      rol,
      estado: selectedEmployee?.estado || 'activo',
      area: employeeConfig?.area || selectedEmployee?.area || roleAreaMap[String(rol).toLowerCase()] || 'Operacion',
      horario,
      descanso: restDays,
      foto: selectedEmployee?.foto_perfil,
      tolerancia: selectedHorario?.tolerancia_minutos ?? 15,
      jornada: Number(selectedHorario?.horas_jornada || selectedEmployee?.horas_jornada || 8)
    }
  }, [selectedEmployee, employeeConfig, selectedHorario])

  const upsertEmployeeConfig = async (changes) => {
    if (!selectedEmployee?.id) return { error: new Error('Selecciona un empleado') }

    if (employeeConfig?.id) {
      return supabase.from('empleados_asistencia').update(changes).eq('id', employeeConfig.id)
    }

    return supabase.from('empleados_asistencia').insert({
      id_usuario: selectedEmployee.id,
      area: employeeProfile.area,
      dias_descanso: employeeProfile.descanso,
      activo: true,
      ...changes
    })
  }

  const handleActionSubmit = async (action, payload) => {
    if (!selectedEmployee?.id) return

    setSavingAction(true)
    setActionError('')
    let result
    if (action === 'permiso' || action === 'falta') {
      result = await supabase.from('eventos_asistencia').insert({
        id_usuario: selectedEmployee.id,
        tipo: action,
        fecha_inicio: payload.fecha_inicio,
        fecha_fin: action === 'falta' ? payload.fecha_inicio : (payload.fecha_fin || payload.fecha_inicio),
        motivo: payload.motivo || null,
        observaciones: null
      })
    }

    if (action === 'horario') {
      const matchingHorario = horarios.find((horario) => (
        String(horario.hora_entrada || '').slice(0, 5) === payload.hora_entrada
        && String(horario.hora_salida || '').slice(0, 5) === payload.hora_salida
      ))
      let horarioId = matchingHorario?.id

      if (!horarioId) {
        const horarioRes = await supabase
          .from('horarios_asistencia')
          .insert({
            nombre: `Horario ${formatTimeText(payload.hora_entrada)} - ${formatTimeText(payload.hora_salida)}`,
            hora_entrada: payload.hora_entrada,
            hora_salida: payload.hora_salida,
            tolerancia_minutos: selectedHorario?.tolerancia_minutos ?? 15,
            horas_jornada: calculateShiftHours(payload.hora_entrada, payload.hora_salida),
            activo: true
          })
          .select('id')
          .single()

        if (horarioRes.error) {
          setActionError(horarioRes.error.message)
          setSavingAction(false)
          return
        }

        horarioId = horarioRes.data.id
      }

      result = await upsertEmployeeConfig({ id_horario: Number(horarioId), area: employeeProfile.area })
    }

    if (action === 'asignar_descanso') {
      result = await upsertEmployeeConfig({ dias_descanso: payload.dias_descanso })
    }

    if (result?.error) {
      setActionError(result.error.message)
      setSavingAction(false)
      return
    }

    setNotice({ tipo: 'success', texto: 'Cambios de asistencia guardados correctamente' })
    setActionModal(null)
    await fetchModuleData()
    await fetchAttendanceAndEvents(selectedEmployee.id, monthDate, true)
    setSavingAction(false)
  }

  const monthModel = useMemo(() => {
    const first = startOfMonth(monthDate)
    const calendarStart = new Date(first)
    calendarStart.setDate(first.getDate() - ((first.getDay() + 6) % 7))
    const restDays = employeeProfile.descanso.map((day) => String(day).toLowerCase())
    const holidaySet = new Set(festivos.map((festivo) => festivo.fecha))

    const eventsByDay = eventos.reduce((acc, evento) => {
      const start = parseDateOnly(evento.fecha_inicio)
      const end = evento.fecha_fin ? parseDateOnly(evento.fecha_fin) : start
      for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        acc[isoDay(cursor)] = evento
      }
      return acc
    }, {})

    const byDay = attendanceRows.reduce((acc, row) => {
      const entrada = row.fecha_entrada ? new Date(row.fecha_entrada) : null
      if (!entrada) return acc
      acc[isoDay(entrada)] = row
      return acc
    }, {})

    const days = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(calendarStart)
      date.setDate(calendarStart.getDate() + index)
      const key = isoDay(date)
      const row = byDay[key]
      const event = eventsByDay[key]
      const inMonth = date.getMonth() === monthDate.getMonth()
      const dayKey = dayKeyByIndex[date.getDay()]
      const isRest = restDays.includes(dayKey)
      const isNonWorking = holidaySet.has(key)

      if (event?.tipo === 'permiso' || event?.tipo === 'falta' || event?.tipo === 'descanso') {
        return { date, inMonth, status: event.tipo === 'descanso' ? 'descanso' : event.tipo, event, entrada: null, salida: null, worked: 0, extra: 0 }
      }

      if (row) {
        const resolved = resolveAttendanceRecord(row, selectedHorario, employeeProfile.jornada)
        return {
          date,
          inMonth,
          status: resolved.status,
          entrada: resolved.entrada,
          salida: resolved.salida,
          worked: resolved.worked,
          extra: resolved.extra,
          lateLimit: resolved.lateLimit,
          tolerancia: resolved.tolerancia
        }
      }

      let status = ''
      if (isRest) status = 'descanso'
      if (isNonWorking) status = 'no_laborable'

      return { date, inMonth, status, entrada: null, salida: null, worked: 0, extra: 0 }
    })

    const monthDays = days.filter((day) => day.inMonth)
    const laborables = monthDays.filter((day) => day.status !== 'descanso' && day.status !== 'no_laborable').length
    const asistencias = monthDays.filter((day) => day.status === 'asistencia').length
    const retardos = monthDays.filter((day) => day.status === 'retardo').length
    const faltas = monthDays.filter((day) => day.status === 'falta').length
    const descansos = monthDays.filter((day) => day.status === 'descanso').length
    const permisos = monthDays.filter((day) => day.status === 'permiso').length
    const extra = monthDays.reduce((sum, day) => sum + day.extra, 0)
    const attendancePercent = laborables ? Math.round(((asistencias + retardos + permisos) / laborables) * 100) : 0

    return {
      days,
      summary: { laborables, asistencias, retardos, faltas, descansos, permisos, extra, attendancePercent }
    }
  }, [attendanceRows, eventos, festivos, employeeProfile, monthDate, selectedHorario])

  const stats = monthModel.summary
  const latestRecords = useMemo(() => (
    attendanceRows
      .map((row) => resolveAttendanceRecord(row, selectedHorario, employeeProfile.jornada))
      .filter(Boolean)
      .sort((a, b) => b.entrada - a.entrada)
      .slice(0, 6)
  ), [attendanceRows, employeeProfile.jornada, selectedHorario])
  const initials = employeeProfile.nombre.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const openActionModal = (action) => {
    setActionError('')
    setSavingAction(false)
    setActionModal(action)
  }

  return (
    <div className="attendance-module">
      {notice && <div className={`attendance-module-notice ${notice.tipo}`}>{notice.texto}</div>}

      <div className="attendance-module-header attendance-module-header-compact">
        <div className="attendance-module-controls">
          <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} disabled={loading}>
            {personal.length === 0 ? (
              <option value="">Seleccionar empleado</option>
            ) : personal.map((empleado) => (
              <option key={empleado.id} value={empleado.id}>{empleado.nombre}</option>
            ))}
          </select>
          <button onClick={() => setMonthDate(addMonths(monthDate, -1))} aria-label="Mes anterior"><Icon name="chevronLeft" size={20} /></button>
          <button onClick={() => setMonthDate(addMonths(monthDate, 1))} aria-label="Mes siguiente"><Icon name="chevronRight" size={20} /></button>
          <div className="attendance-month-pill"><Icon name="calendar" size={18} />{MONTH_FORMAT.format(monthDate)}</div>
        </div>
      </div>

      <section className="attendance-stats-grid">
        <div className="attendance-stat-card stat-percent">
          <span>Asistencia del mes</span>
          <strong>{stats.attendancePercent}%</strong>
          <div className="attendance-progress"><i style={{width: `${Math.min(stats.attendancePercent, 100)}%`}} /></div>
          <small>{stats.asistencias + stats.retardos + stats.permisos} de {stats.laborables} dias laborables</small>
        </div>
        <StatCard tone="green" icon="check" label="Asistencias" value={stats.asistencias} detail="dias" />
        <StatCard tone="orange" icon="clock" label="Retardos" value={stats.retardos} detail="dias" />
        <StatCard tone="red" icon="x" label="Faltas" value={stats.faltas} detail={stats.faltas === 1 ? 'dia' : 'dias'} />
        <StatCard tone="blue" icon="clock" label="Horas extra" value={formatHours(stats.extra)} detail="Total en el mes" />
      </section>

      <section className="attendance-main-grid">
        <div className="attendance-panel calendar-panel">
          <h2>Calendario de Asistencia</h2>
          <div className="attendance-calendar">
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => (
              <div className="attendance-weekday" key={day}>{day}</div>
            ))}
            {monthModel.days.map((day) => (
              <CalendarDay key={isoDay(day.date)} day={day} />
            ))}
          </div>
          <div className="attendance-legend">
            {Object.entries(statusLabels).map(([status, label]) => (
              <span key={status}><i className={`dot-${status}`} />{label}</span>
            ))}
          </div>
        </div>

        <EmployeePanel profile={employeeProfile} initials={initials} />
      </section>

      <section className="attendance-bottom-grid">
        <SummaryTable stats={stats} jornada={employeeProfile.jornada} />
        <RecordsTable records={latestRecords} />
        <QuickActions onAction={openActionModal} />
      </section>

      {actionModal && (
        <ActionModal
          action={actionModal}
          employee={employeeProfile}
          selectedHorario={selectedHorario}
          error={actionError}
          saving={savingAction}
          onClose={() => {
            setActionModal(null)
            setActionError('')
          }}
          onSubmit={handleActionSubmit}
        />
      )}
    </div>
  )
}

const StatCard = ({ tone, icon, label, value, detail }) => (
  <div className={`attendance-stat-card stat-${tone}`}>
    <div className="attendance-stat-icon"><Icon name={icon} size={28} /></div>
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  </div>
)

const CalendarDay = ({ day }) => {
  const tooltip = day.entrada
    ? `Entrada: ${TIME_FORMAT.format(day.entrada)}\nSalida: ${day.salida ? TIME_FORMAT.format(day.salida) : 'Pendiente'}\nHoras trabajadas: ${formatHours(day.worked)}`
    : day.event?.motivo || statusLabels[day.status] || 'Sin registro'

  return (
    <div className={`attendance-day-cell ${day.inMonth ? '' : 'outside-month'} ${day.status ? `status-${day.status}` : ''}`} title={tooltip}>
      <span>{day.date.getDate()}</span>
      {day.status && <i />}
    </div>
  )
}

const EmployeePanel = ({ profile, initials }) => (
  <aside className="attendance-panel employee-panel">
    <div className="employee-top">
      <div className="employee-photo">
        {profile.foto ? <img src={profile.foto} alt={profile.nombre} /> : <span>{initials}</span>}
      </div>
      <div>
        <h2>{profile.nombre}</h2>
        <div className="employee-badges">
          <span>{profile.rol}</span>
          <span className={profile.estado === 'inactivo' ? 'inactive' : ''}>
            {profile.estado === 'inactivo' ? 'Inactivo' : 'Activo'}
          </span>
        </div>
        <p><b>Usuario:</b> {profile.usuario}</p>
        <p><b>Area:</b> {profile.area}</p>
      </div>
    </div>

    <InfoStrip icon="clock" title="Horario asignado" left={profile.horario} right={`Tolerancia: ${profile.tolerancia} minutos`} />
    <InfoStrip icon="calendar" title="Dias de descanso" left={profile.descanso.join('   ')} right="Configuracion del empleado" />
    <InfoStrip icon="shield" title="Politica aplicada" left={`Tiempo completo (${profile.jornada} horas)`} right={`Hora extra: despues de ${profile.jornada}h`} />
  </aside>
)

const InfoStrip = ({ icon, title, left, right }) => (
  <div className="employee-info-strip">
    <Icon name={icon} size={18} />
    <div><b>{title}</b><span>{left}</span></div>
    <span>{right}</span>
  </div>
)

const SummaryTable = ({ stats, jornada }) => (
  <div className="attendance-panel attendance-table-panel">
    <h2>Resumen del mes</h2>
    <table>
      <thead><tr><th>Concepto</th><th>Cantidad</th><th>Horas</th></tr></thead>
      <tbody>
        <tr><td>Dias laborables</td><td>{stats.laborables} dias</td><td>{stats.laborables * jornada}h 00m</td></tr>
        <tr><td>Dias asistidos</td><td>{stats.asistencias} dias</td><td>{stats.asistencias * jornada}h 00m</td></tr>
        <tr><td>Dias de descanso</td><td>{stats.descansos} dias</td><td>-</td></tr>
        <tr><td>Dias de permiso</td><td>{stats.permisos} dias</td><td>-</td></tr>
        <tr><td>Faltas</td><td>{stats.faltas} dias</td><td>-</td></tr>
        <tr><td>Retardos</td><td>{stats.retardos} dias</td><td>-</td></tr>
        <tr className="extra-row"><td>Total horas extra</td><td>-</td><td>{formatHours(stats.extra)}</td></tr>
      </tbody>
    </table>
  </div>
)

const RecordsTable = ({ records }) => (
  <div className="attendance-panel attendance-table-panel records-panel">
    <h2>Ultimos registros</h2>
    <table>
      <thead><tr><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Estado</th><th>Horas</th><th>Extra</th></tr></thead>
      <tbody>
        {records.length === 0 ? (
          <tr><td colSpan="6">No hay registros para este mes.</td></tr>
        ) : records.map((record) => (
          <tr key={record.id || record.entrada?.toISOString()}>
            <td>{DATE_FORMAT.format(record.date)}</td>
            <td>{TIME_FORMAT.format(record.entrada)}</td>
            <td>{record.salida ? TIME_FORMAT.format(record.salida) : 'Pendiente'}</td>
            <td><span className={`record-status record-${record.status}`}>{statusLabels[record.status] || 'Sin registro'}</span></td>
            <td>{formatHours(record.worked)}</td>
            <td className={record.extra > 0 ? 'positive-extra' : ''}>{formatHours(record.extra)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <button className="history-button">Ver historial completo</button>
  </div>
)

const QuickActions = ({ onAction }) => (
  <div className="attendance-panel quick-actions">
    <h2>Acciones rapidas</h2>
    <div className="quick-actions-grid">
      <button className="quick-purple" onClick={() => onAction('permiso')}><Icon name="file" />Registrar permiso</button>
      <button className="quick-red" onClick={() => onAction('falta')}><Icon name="x" />Registrar falta</button>
      <button className="quick-orange" onClick={() => onAction('horario')}><Icon name="clock" />Asignar horario</button>
      <button className="quick-blue" onClick={() => onAction('asignar_descanso')}><Icon name="calendar" />Asignar descanso</button>
    </div>
  </div>
)

const ActionModal = ({ action, employee, selectedHorario, error, saving, onClose, onSubmit }) => {
  const today = isoDay(new Date())
  const [form, setForm] = useState({
    fecha_inicio: today,
    fecha_fin: today,
    motivo: '',
    hora_entrada: String(selectedHorario?.hora_entrada || '08:00').slice(0, 5),
    hora_salida: String(selectedHorario?.hora_salida || '16:00').slice(0, 5),
    dias_descanso: employee.descanso
  })

  const titleMap = {
    permiso: 'Registrar permiso',
    falta: 'Registrar falta',
    horario: 'Asignar horario',
    asignar_descanso: 'Asignar descanso'
  }

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      dias_descanso: prev.dias_descanso.includes(day)
        ? prev.dias_descanso.filter((item) => item !== day)
        : [...prev.dias_descanso, day]
    }))
  }

  return (
    <div className="attendance-action-overlay">
      <form
        className="attendance-action-modal"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(action, form)
        }}
      >
        <div className="attendance-action-modal-header">
          <h3>{titleMap[action]}</h3>
          <button type="button" onClick={onClose}>x</button>
        </div>

        {action === 'permiso' && (
          <>
            <label>Fecha inicio<input type="date" value={form.fecha_inicio} onChange={(event) => update('fecha_inicio', event.target.value)} required /></label>
            <label>Fecha fin<input type="date" value={form.fecha_fin} onChange={(event) => update('fecha_fin', event.target.value)} required /></label>
            <label>Permiso<textarea value={form.motivo} onChange={(event) => update('motivo', event.target.value)} placeholder="Motivo del permiso" /></label>
          </>
        )}

        {action === 'falta' && (
          <label>Dia de la falta<input type="date" value={form.fecha_inicio} onChange={(event) => update('fecha_inicio', event.target.value)} required /></label>
        )}

        {action === 'horario' && (
          <div className="attendance-time-inputs">
            <label>Hora de entrada<input type="time" value={form.hora_entrada} onChange={(event) => update('hora_entrada', event.target.value)} required /></label>
            <label>Hora de salida<input type="time" value={form.hora_salida} onChange={(event) => update('hora_salida', event.target.value)} required /></label>
          </div>
        )}

        {action === 'asignar_descanso' && (
          <div className="attendance-days-selector">
            {dayOptions.map((day) => (
              <label key={day}>
                <input type="checkbox" checked={form.dias_descanso.includes(day)} onChange={() => toggleDay(day)} />
                <span>{day}</span>
              </label>
            ))}
          </div>
        )}

        {error && <div className="attendance-action-error">{error}</div>}

        <div className="attendance-action-modal-actions">
          <button type="button" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
        </div>
      </form>
    </div>
  )
}
