import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { buildApiUrl } from '../config.js';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'TOKEN_REFRESH':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for stored tokens on app start
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken && refreshToken) {
      // Verify token and get user data
      fetchUserData();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        logout();
        return;
      }

      const response = await fetch(buildApiUrl('/api/auth/user'), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: userData
        });
      } else if (response.status === 401) {
        // Token expired, try to refresh
        console.log('Token expired, attempting refresh...');
        const refreshSuccess = await refreshTokens();
        if (refreshSuccess) {
          // Retry fetching user data
          await fetchUserData();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      logout();
    }
  };

  const login = async (credentials) => {
    try {
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Login URL:', buildApiUrl('/api/auth/login'));
      
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data keys:', Object.keys(data));

      if (response.ok) {
        console.log('=== LOGIN SUCCESS ===');
        console.log('Access token received:', !!data.accessToken);
        console.log('Refresh token received:', !!data.refreshToken);
        console.log('User data received:', !!data.user);
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        console.log('Tokens stored in localStorage');
        console.log('Access token length:', data.accessToken?.length);
        console.log('Refresh token length:', data.refreshToken?.length);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: data
        });
        
        console.log('Login state updated');
        return { success: true, user: data.user };
      } else {
        console.error('Login failed:', response.status, data);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(buildApiUrl('/api/auth/student/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        // Do NOT auto-login after registration. Require explicit login.
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch(buildApiUrl('/api/auth/logout'), { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshTokens = async () => {
    try {
      console.log('=== FRONTEND REFRESH TOKENS ===');
      const refreshToken = localStorage.getItem('refreshToken');
      console.log('Refresh token from localStorage:', refreshToken ? 'Present' : 'Missing');
      console.log('Refresh token length:', refreshToken?.length);
      
      if (!refreshToken) {
        console.log('No refresh token available, logging out');
        logout();
        return false;
      }

      console.log('Sending refresh request to:', buildApiUrl('/api/auth/refresh'));
      const response = await fetch(buildApiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ refreshToken })
      });

      console.log('Refresh response status:', response.status);
      console.log('Refresh response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Refresh successful, new tokens received');
        console.log('New access token length:', data.accessToken?.length);
        console.log('New refresh token length:', data.refreshToken?.length);
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        dispatch({
          type: 'TOKEN_REFRESH',
          payload: data
        });
        
        console.log('Tokens updated in state and localStorage');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Refresh failed:', response.status, errorData);
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      const response = await fetch(buildApiUrl('/api/users/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.accessToken}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({
          type: 'UPDATE_USER',
          payload: data.user
        });
        try {
          if (data.user?.studentProfile?.onboarded) {
            localStorage.setItem('onboarded', 'true');
          }
        } catch {}
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Failed to update profile' };
    }
  };

  // Utility function to make authenticated requests with automatic token refresh
  const authenticatedFetch = async (url, options = {}) => {
    let accessToken = state.accessToken || localStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('No access token available');
    }
    
    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    };
    
    try {
      const response = await fetch(url, { ...options, headers });
      
      // If token expired, try to refresh and retry
      if (response.status === 401) {
        console.log('Token expired during request, attempting refresh...');
        const refreshSuccess = await refreshTokens();
        
        if (refreshSuccess) {
          // Get new token and retry
          const newToken = localStorage.getItem('accessToken');
          headers.Authorization = `Bearer ${newToken}`;
          
          const retryResponse = await fetch(url, { ...options, headers });
          return retryResponse;
        } else {
          // Refresh failed, logout
          logout();
          throw new Error('Authentication failed');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    refreshTokens,
    updateUserProfile,
    authenticatedFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
