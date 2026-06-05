import { useRef, useState } from 'react'
import { CajaIcon, CheckCircleIcon, ClockIcon, ConfigIcon } from '../Icons'
import '../../styles/Configuracion.css'

const logoGastroSoft = '/LogoGastroSoftHeader.png'
const logoStorageKey = 'gastrosoft_config_logo'

export const ConfiguracionModule = () => {
  const [config, setConfig] = useState({
    nombreRestaurante: 'Mi Restaurante',
    telefono: '+1 234 567 8900',
    direccion: 'Calle Principal 123, Ciudad, País',
    mostrarNombre: true,
    mostrarDireccion: true,
    mostrarTelefono: true,
    mensajeTicket: 'Gracias por su visita',
    tamanoTicket: '80mm',
    horaApertura: '09:00',
    horaCierre: '23:00',
    fondoInicial: '1,000.00',
    permitirDiferencia: true,
    diferenciaMaxima: '50.00'
  })
  const fileInputRef = useRef(null)
  const [logoSrc, setLogoSrc] = useState(() => localStorage.getItem(logoStorageKey) || logoGastroSoft)
  const [mensaje, setMensaje] = useState('')

  const update = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const guardarCambios = () => {
    localStorage.setItem(logoStorageKey, logoSrc)
    setMensaje('Configuración guardada correctamente.')
    setTimeout(() => setMensaje(''), 3000)
  }

  const cambiarLogo = event => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMensaje('Selecciona un archivo de imagen válido.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setLogoSrc(reader.result)
      localStorage.setItem(logoStorageKey, reader.result)
      setMensaje('Logo actualizado correctamente.')
      setTimeout(() => setMensaje(''), 3000)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <section className="settings-page">
      <div className="settings-actions">
        <button className="settings-save" onClick={guardarCambios} type="button">
          <CheckCircleIcon size={18} />
          Guardar cambios
        </button>
      </div>

      {mensaje && <div className="settings-message">{mensaje}</div>}

      <div className="settings-grid">
        <article className="settings-card settings-general">
          <SectionTitle icon={<ConfigIcon size={21} />} title="Información General" />
          <div className="settings-general-grid">
            <div className="settings-fields">
              <Field label="Nombre del restaurante">
                <input value={config.nombreRestaurante} onChange={event => update('nombreRestaurante', event.target.value)} />
              </Field>
              <Field label="Teléfono">
                <input value={config.telefono} onChange={event => update('telefono', event.target.value)} />
              </Field>
              <Field label="Dirección">
                <input value={config.direccion} onChange={event => update('direccion', event.target.value)} />
              </Field>
            </div>

            <div className="settings-logo">
              <span>Logo</span>
              <div className="settings-logo-preview">
                <img src={logoSrc} alt="Logo restaurante" />
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()}>Cambiar logo</button>
              <input
                ref={fileInputRef}
                className="settings-logo-input"
                type="file"
                accept="image/*"
                onChange={cambiarLogo}
              />
            </div>
          </div>
        </article>

        <article className="settings-card settings-ticket">
          <SectionTitle icon={<CajaIcon size={21} />} title="Ticket" />
          <div className="settings-ticket-grid">
            <div className="settings-fields">
              <SwitchRow label="Mostrar nombre del restaurante" checked={config.mostrarNombre} onChange={value => update('mostrarNombre', value)} />
              <SwitchRow label="Mostrar dirección" checked={config.mostrarDireccion} onChange={value => update('mostrarDireccion', value)} />
              <SwitchRow label="Mostrar teléfono" checked={config.mostrarTelefono} onChange={value => update('mostrarTelefono', value)} />
              <Field label="Mensaje final del ticket">
                <input value={config.mensajeTicket} onChange={event => update('mensajeTicket', event.target.value)} />
              </Field>
              <Field label="Tamaño de ticket">
                <select value={config.tamanoTicket} onChange={event => update('tamanoTicket', event.target.value)}>
                  <option>80mm</option>
                  <option>58mm</option>
                </select>
              </Field>
            </div>

            <TicketPreview config={config} />
          </div>
        </article>

        <article className="settings-card">
          <SectionTitle icon={<ClockIcon size={21} />} title="Horario" />
          <div className="settings-two-columns">
            <Field label="Hora de apertura">
              <input type="time" value={config.horaApertura} onChange={event => update('horaApertura', event.target.value)} />
            </Field>
            <Field label="Hora de cierre">
              <input type="time" value={config.horaCierre} onChange={event => update('horaCierre', event.target.value)} />
            </Field>
          </div>
          <div className="settings-soft-note">Horario actual del sistema.</div>
        </article>

        <article className="settings-card settings-cash">
          <SectionTitle icon={<CajaIcon size={21} />} title="Caja" />
          <div className="settings-cash-grid">
            <div className="settings-fields">
              <Field label="Fondo inicial por defecto">
                <MoneyInput value={config.fondoInicial} onChange={value => update('fondoInicial', value)} />
              </Field>
              <SwitchRow label="Permitir cerrar caja con diferencia" checked={config.permitirDiferencia} onChange={value => update('permitirDiferencia', value)} />
              <Field label="Diferencia máxima permitida">
                <MoneyInput value={config.diferenciaMaxima} onChange={value => update('diferenciaMaxima', value)} />
              </Field>
            </div>
            <div className="settings-cash-note">
              <span>i</span>
              Estos ajustes se aplican al módulo de Caja y afectan la apertura y cierre de cajas.
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

const SectionTitle = ({ icon, title }) => (
  <div className="settings-card-title">
    <span>{icon}</span>
    <h2>{title}</h2>
  </div>
)

const Field = ({ label, children }) => (
  <label className="settings-field">
    <span>{label}</span>
    {children}
  </label>
)

const SwitchRow = ({ label, checked, onChange }) => (
  <label className="settings-switch-row">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />
    <i />
  </label>
)

const MoneyInput = ({ value, onChange }) => (
  <div className="settings-money-input">
    <span>$</span>
    <input value={value} onChange={event => onChange(event.target.value)} />
  </div>
)

const TicketPreview = ({ config }) => (
  <div className={`settings-ticket-preview ${config.tamanoTicket === '58mm' ? 'is-58mm' : 'is-80mm'}`} aria-label="Vista previa del ticket">
    {config.mostrarNombre && <h3>MI RESTAURANTE</h3>}
    {config.mostrarDireccion && (
      <>
        <p>Calle Principal 123</p>
        <p>Ciudad, País</p>
      </>
    )}
    {config.mostrarTelefono && <p>Tel: +1 234 567 8900</p>}
    <hr />
    <div><span>Mesa: 5</span><span>Orden: #0021</span></div>
    <p>Fecha: 25/05/2025 14:35</p>
    <hr />
    <div><span>Producto</span><span>Total</span></div>
    <div><span>Hamburguesa Clásica</span><b>$12.00</b></div>
    <div><span>Papas Fritas</span><b>$3.00</b></div>
    <div><span>Refresco</span><b>$2.50</b></div>
    <hr />
    <div className="ticket-total"><span>Total</span><b>$17.50</b></div>
    <strong>{config.mensajeTicket}</strong>
  </div>
)
