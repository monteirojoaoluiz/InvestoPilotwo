import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../client/src/pages/Dashboard';

describe('Dashboard page', () => {
  it('renders heading', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Stack16 Dashboard/i)).toBeTruthy();
  });
});
