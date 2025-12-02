// src/pages/LoginPage.jsx
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setServerError("");
      const res = await api.post("/auth/login", { email, password });

      login(res.data.user);
      alert("Login successful!");
      navigate("/shop");
    } catch (err) {
      console.error("Login failed:", err);
      setServerError(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }

  return (
    <Box maxW="480px">
      <Heading mb={6}>Login</Heading>

      <Box as="form" onSubmit={handleSubmit}>
        {/* Email */}
        <Box mb={4}>
          <Text
            as="label"
            htmlFor="email"
            fontWeight="medium"
            mb={1}
            display="block"
          >
            Email
          </Text>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            bg="white"
          />
        </Box>

        {/* Password */}
        <Box mb={4}>
          <Text
            as="label"
            htmlFor="password"
            fontWeight="medium"
            mb={1}
            display="block"
          >
            Password
          </Text>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            bg="white"
          />
        </Box>

        {serverError && (
          <Text color="red.500" fontSize="sm" mb={3}>
            {serverError}
          </Text>
        )}

        <Button
          type="submit"
          w="100%"
          py={3}
          mt={1}
          borderRadius="md"
          bg="blue.500"
          color="white"
          fontWeight="semibold"
          _hover={{ bg: "blue.600" }}
          _active={{ bg: "blue.700" }}
        >
          Login
        </Button>
      </Box>

      <Text mt={4}>
        New user?{" "}
        <Text as={Link} to="/register" color="green.500" fontWeight="medium">
          Create an account
        </Text>
      </Text>
    </Box>
  );
}
