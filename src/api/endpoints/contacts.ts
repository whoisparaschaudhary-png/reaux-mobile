import client from '../client';
import type { PaginatedResponse, PaginationParams } from '../types';
import type { Contact, ContactStatus } from '../../types/models';

interface ContactListParams extends PaginationParams {
  status?: ContactStatus;
}

export const contactsApi = {
  list: (params?: ContactListParams) =>
    client
      .get<PaginatedResponse<Contact>>('/contact', { params })
      .then(r => r.data),
};
