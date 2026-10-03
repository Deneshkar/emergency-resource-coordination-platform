import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import ResourceList from '../ResourceList';
import * as service from '../../services/resourceService';
const { notify } = vi.hoisted(() => ({ notify: { error: vi.fn(), success: vi.fn(), warning: vi.fn(), info: vi.fn() } }));
vi.mock('../../services/resourceService', () => ({ getResources: vi.fn(), createResource: vi.fn(), updateResourceStatus: vi.fn(), deleteResource: vi.fn() }));
vi.mock('../../context/NotificationContext', () => ({ useNotification: () => ({ notify }) }));
vi.mock('../../services/emailNotificationService', () => ({ sendResourceDispatchedEmail: vi.fn(), sendResourceMaintenanceEmail: vi.fn(), sendResourceAddedEmail: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
describe('QMS Resource fleet behaviour', () => {
  it('WEB05 renders records returned by the API', async () => {
    service.getResources.mockResolvedValue([{ id: 5, name: 'Medical ambulance', status: 'Available', resourceType: 'Vehicle', capacity: 4 }]);
    render(<ResourceList />);
    expect(await screen.findByText('Medical ambulance')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
  });
  it('WEB06 renders the empty state', async () => {
    service.getResources.mockResolvedValue([]); render(<ResourceList />);
    expect(await screen.findByText('No resources registered')).toBeInTheDocument();
  });
  it('WEB07 reports a rejected API request', async () => {
    service.getResources.mockRejectedValue(new Error('Offline')); render(<ResourceList />);
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith('Failed to load resource data.'));
  });
  it('WEB08 sends the selected status to the API', async () => {
    service.getResources.mockResolvedValue([{ id: 5, name: 'Medical ambulance', status: 'Available', resourceType: 'Vehicle', capacity: 4 }]);
    service.updateResourceStatus.mockResolvedValue({}); render(<ResourceList />);
    await screen.findByText('Medical ambulance');
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Maintenance' } });
    await waitFor(() => expect(service.updateResourceStatus).toHaveBeenCalledWith(5, 'Maintenance'));
  });
});
