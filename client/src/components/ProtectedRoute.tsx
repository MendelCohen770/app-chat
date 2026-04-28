import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/useUser';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const userContext = useUser();

  if (!userContext?.isHydrated) {
    return null;
  }

  if (!userContext?.user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
