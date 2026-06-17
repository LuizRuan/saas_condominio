import api from './api';

export interface Package {
  _id: string;
  condominiumId: string;
  unitId: {
    _id: string;
    block: string;
    number: string;
  };
  description: string;
  trackingCode?: string;
  status: 'pending' | 'delivered';
  receivedAt: string;
  receivedBy: {
    _id: string;
    name: string;
  };
  deliveredAt?: string;
  deliveredTo?: string;
  notes?: string;
}

export const packageService = {
  create: async (data: { unitId: string; description: string; trackingCode?: string; notes?: string }) => {
    const response = await api.post<Package>('/packages', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get<Package[]>('/packages');
    return response.data;
  },

  getResidentPackages: async () => {
    const response = await api.get<Package[]>('/packages/resident');
    return response.data;
  },

  markAsDelivered: async (id: string, deliveredTo: string) => {
    const response = await api.patch<Package>(`/packages/${id}/deliver`, { deliveredTo });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  }
};
