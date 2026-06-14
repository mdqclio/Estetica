import api from './api';
import { ReporteResumen } from '../types';

export const reportesService = {
  async resumen(desde: string, hasta: string): Promise<ReporteResumen> {
    const { data } = await api.get<ReporteResumen>('/reportes/resumen', {
      params: { desde, hasta },
    });
    return data;
  },

  // Descarga el CSV (usa axios para enviar el JWT y luego dispara la descarga).
  async exportCsv(desde: string, hasta: string): Promise<void> {
    const res = await api.get('/reportes/export', {
      params: { desde, hasta },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${desde}_a_${hasta}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
