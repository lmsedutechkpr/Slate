import { UserRoles } from '../constants.js';

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions for this action' 
      });
    }
    
    next();
  };
};

export const requireAdmin = requireRole([UserRoles.ADMIN]);
export const requireInstructor = requireRole([UserRoles.INSTRUCTOR, UserRoles.ADMIN]);
export const requireStudent = requireRole([UserRoles.STUDENT]);
export const requireInstructorOrAdmin = requireRole([UserRoles.INSTRUCTOR, UserRoles.ADMIN]);
