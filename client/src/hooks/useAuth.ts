import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Checking authentication status...');
    fetch('/api/auth/user', {
      credentials: 'include', // Include cookies for session
    })
      .then(res => {
        console.log('Auth check response status:', res.status);
        if (res.ok) {
          return res.json().then(user => {
            console.log('Authenticated user:', user.email);
            return true;
          });
        } else {
          console.log('Not authenticated - status:', res.status);
          return false;
        }
      })
      .then(setIsAuthenticated)
      .catch(error => {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { isAuthenticated, isLoading };
}