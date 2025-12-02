// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { Center, Spinner } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // While checking /auth/me, show loading spinner
  if (loading) {
    return (
      <Center mt={10}>
        <Spinner />
      </Center>
    );
  }

  // If no user -> redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user exists -> render child route
  return children;
}
