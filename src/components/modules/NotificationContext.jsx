import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

const crearFechaLocal = (fecha) => {
  if (!fecha) return new Date();
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [year, month, day] = fecha.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(fecha);
};

const fechaClaveLocal = (fecha) => {
  const date = crearFechaLocal(fecha);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatoHora = (fecha) => {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return '';
  const date = crearFechaLocal(fecha);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

const formatoFechaNotif = (fecha) => {
  const date = crearFechaLocal(fecha);
  if (Number.isNaN(date.getTime())) return '';

  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  const hora = formatoHora(fecha);
  if (fechaClaveLocal(date) === fechaClaveLocal(hoy)) return hora ? `Hoy ${hora}` : 'Hoy';
  if (fechaClaveLocal(date) === fechaClaveLocal(ayer)) return hora ? `Ayer ${hora}` : 'Ayer';
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const cargarNotifications = () => {
  try {
    const guardadas = JSON.parse(localStorage.getItem('notifications_inventario') || '[]');
    return guardadas.map(n => ({
      ...n,
      timestamp: formatoFechaNotif(n.fecha || n.timestamp),
    }));
  } catch {
    return [];
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(cargarNotifications);

  const addNotification = (message, fecha, id = null) => {
    const notifId = id || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newNotif = {
      id: notifId,
      message,
      fecha,
      timestamp: formatoFechaNotif(fecha),
    };
    setNotifications(prev => {
      const existe = prev.some(n => String(n.id) === String(notifId));
      const actualizadas = prev.map(n => ({
        ...n,
        timestamp: formatoFechaNotif(n.fecha || n.timestamp),
      }));
      const next = existe ? actualizadas : [newNotif, ...actualizadas];
      localStorage.setItem('notifications_inventario', JSON.stringify(next));
      return next;
    });
  };

  const clearNotifications = () => {
    localStorage.removeItem('notifications_inventario');
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
