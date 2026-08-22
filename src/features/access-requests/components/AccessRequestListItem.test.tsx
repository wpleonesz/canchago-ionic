import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccessRequestListItem from './AccessRequestListItem';
import type { AccessRequestDto } from '../../../types/api/access-requests';

const REQUEST: AccessRequestDto = {
  id: 'request-1',
  status: 'PENDING',
  createdAt: '2026-08-22T00:00:00.000Z',
  reviewedAt: null,
  rejectionReason: null,
  organization: {
    id: 'org-1',
    name: 'Mi Cancha',
    status: 'PENDING_APPROVAL',
    venues: [{ id: 'venue-1', name: 'Sede Principal', status: 'PENDING_APPROVAL' }],
  },
  requester: {
    id: 'user-1',
    email: 'gestor@example.com',
    profile: { firstName: 'Bruno', lastName: 'Diaz' },
  },
};

describe('AccessRequestListItem', () => {
  it('shows the organization, venue and requester', () => {
    render(<AccessRequestListItem request={REQUEST} onApprove={vi.fn()} onReject={vi.fn()} />);

    expect(screen.getByText('Mi Cancha')).toBeInTheDocument();
    expect(screen.getByText('Sede Principal')).toBeInTheDocument();
    expect(screen.getByText(/Bruno Diaz/)).toBeInTheDocument();
    expect(screen.getByText(/gestor@example.com/)).toBeInTheDocument();
  });

  it('calls onApprove/onReject with the request when the buttons are clicked', () => {
    const onApprove = vi.fn();
    const onReject = vi.fn();
    render(<AccessRequestListItem request={REQUEST} onApprove={onApprove} onReject={onReject} />);

    fireEvent.click(screen.getByText('Aprobar'));
    expect(onApprove).toHaveBeenCalledWith(REQUEST);

    fireEvent.click(screen.getByText('Rechazar'));
    expect(onReject).toHaveBeenCalledWith(REQUEST);
  });
});
