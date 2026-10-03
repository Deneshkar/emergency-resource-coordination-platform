import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/AuthContext';
vi.mock('../../context/AuthContext', () => ({ useAuth: vi.fn() }));
afterEach(cleanup);
function mount(state) {
  useAuth.mockReturnValue(state);
  render(<MemoryRouter initialEntries={['/secure']}><Routes>
    <Route path="/login" element={<p>Login destination</p>} />
    <Route path="/secure" element={<ProtectedRoute allowedRoles={['Coordinator']}><p>Protected content</p></ProtectedRoute>} />
  </Routes></MemoryRouter>);
}
describe('QMS protected routes', () => {
  it('WEB01 redirects anonymous visitors to login', () => {
    mount({ isAuthenticated: false, isLoading: false });
    expect(screen.getByText('Login destination')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
  it('WEB02 blocks the Citizen role', () => {
    mount({ isAuthenticated: true, isLoading: false, user: { role: 'Citizen' } });
    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
  it('WEB03 renders content for Coordinator', () => {
    mount({ isAuthenticated: true, isLoading: false, user: { role: 'Coordinator' } });
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
  it('WEB04 keeps content hidden while credentials are loading', () => {
    mount({ isAuthenticated: false, isLoading: true });
    expect(screen.getByText('Verifying security credentials...')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
