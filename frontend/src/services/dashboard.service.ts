import api from './api';
import { DashboardMetrics } from '../types';

export const dashboardService = {
  async metrics(): Promise<DashboardMetrics> {
    const { data } = await api.get<DashboardMetrics>('/dashboard/metrics');
    return data;
  },
};
