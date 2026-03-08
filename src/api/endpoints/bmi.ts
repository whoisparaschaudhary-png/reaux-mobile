import client from '../client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import type { BmiRecord } from '../../types/models';
import type { RecordBmiRequest } from '../../types/api';

export const bmiApi = {
  record: (data: RecordBmiRequest) =>
    client.post<ApiResponse<BmiRecord>>('/bmi/record', data).then(r => r.data),

  getHistory: (params?: PaginationParams) =>
    client.get<PaginatedResponse<BmiRecord>>('/bmi/history', { params }).then(r => r.data),

  getLatest: () =>
    client.get<ApiResponse<BmiRecord>>('/bmi/latest').then(r => r.data),
};
