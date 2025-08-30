import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { buildApiUrl } from '../lib/utils.js';

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
        
        // IMPORTANT: When restoring from localStorage, we need to include the tokens
        // because the /api/auth/user endpoint only returns user data, not tokens
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: userData.user,
            accessToken: accessToken, // Use the token from localStorage
            refreshToken: localStorage.getItem('refreshToken') // Use the refresh token from localStorage
          }
        });
      } else if (response.status === 401) {
        // Token expired, try to refresh
        const refreshSuccess = await refreshTokens();
        if (refreshSuccess) {
          // Retry fetching user data with new token
          await fetchUserData();
        } else {
          logout();
        }
      } else {
        console.error('Failed to fetch user data:', response.status);
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      logout();
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: data
        });
        
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
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        logout();
        return false;
      }

      const response = await fetch(buildApiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        // Update the state immediately
        dispatch({
          type: 'TOKEN_REFRESH',
          payload: data
        });
        
        // Also update the user data to ensure consistency
        if (data.user) {
          dispatch({
            type: 'UPDATE_USER',
            payload: data.user
          });
        }
        
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
    // Always get the latest token from localStorage to ensure freshness
    let accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      console.error('No access token available for request to:', url);
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
        const refreshSuccess = await refreshTokens();
        
        if (refreshSuccess) {
          // Get new token and retry
          const newToken = localStorage.getItem('accessToken');
          if (!newToken) {
            console.error('No new token after refresh');
            throw new Error('Token refresh failed');
          }
          
          headers.Authorization = `Bearer ${newToken}`;
          
          const retryResponse = await fetch(url, { ...options, headers });
          return retryResponse;
        } else {
          // Refresh failed, logout
          console.error('Token refresh failed, logging out');
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
    authenticatedFetch,
    authLoading: state.isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
