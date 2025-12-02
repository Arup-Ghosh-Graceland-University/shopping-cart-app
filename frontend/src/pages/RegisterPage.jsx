// src/pages/RegisterPage.jsx
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setServerError("");
      await api.post("/auth/register", { name, email, password });

      alert("Registration successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      console.error("Registration failed:", err);
      setServerError(
        err.response?.data?.message || "Something went wrong."
      );
    }
  }

  return (
    <Box maxW="480px">
      <Heading mb={6}>Sign Up</Heading>

      <Box as="form" onSubmit={handleSubmit}>
        {/* Name */}
        <Box mb={4}>
          <Text
            as="label"
            htmlFor="name"
            fontWeight="medium"
            mb={1}
            display="block"
          >
            Name
          </Text>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            bg="white"
          />
        </Box>

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
            placeholder="Choose a password"
            bg="white"
          />
        </Box>

        {serverError && (
          <Text color="red.500" fontSize="sm" mb={3}>
            {serverError}
          </Text>
        )}

        {/* Primary button - explicitly styled so text is always visible */}
        <Button
          type="submit"
          w="100%"
          py={3}
          mt={1}
          borderRadius="md"
          bg="green.500"
          color="white"
          fontWeight="semibold"
          _hover={{ bg: "green.600" }}
          _active={{ bg: "green.700" }}
        >
          Create Account
        </Button>
      </Box>

      <Text mt={4}>
        Already have an account?{" "}
        <Text as={Link} to="/login" color="blue.500" fontWeight="medium">
          Login
        </Text>
      </Text>
    </Box>
  );
}
