import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  // ... component ke andar ...
  const navigate = useNavigate();
  expect(linkElement).toBeInTheDocument();
});
