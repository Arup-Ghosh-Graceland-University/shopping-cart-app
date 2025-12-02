// src/components/Navbar.jsx
import {
  Box,
  Flex,
  Button,
  Heading,
  Spacer,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <Box bg="gray.900" color="white" px={6} py={3} mb={6}>
      <Flex align="center">
        {/* App title */}
        <Heading size="md">
          <ChakraLink as={Link} to="/" _hover={{ textDecoration: "none" }}>
            Mini Shop
          </ChakraLink>
        </Heading>

        <Spacer />

        {/* Links + user actions */}
        <Flex gap={6} align="center" fontWeight="medium">
          <ChakraLink
            as={Link}
            to="/shop"
            _hover={{ color: "purple.300", textDecoration: "none" }}
          >
            Shop
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="/cart"
            _hover={{ color: "purple.300", textDecoration: "none" }}
          >
            Cart
          </ChakraLink>
          <ChakraLink
            as={Link}
            to="/orders"
            _hover={{ color: "purple.300", textDecoration: "none" }}
          >
            Orders
          </ChakraLink>

          {user ? (
            <>
              <Box>Hi, {user.name}</Box>
              <Button
                onClick={handleLogout}
                fontWeight="semibold"
                bg="gray.100"
                color="gray.800"
                px={6}
                py={2}
                borderRadius="md"
                _hover={{ bg: "gray.200" }}
                _active={{ bg: "gray.300" }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                as={Link}
                to="/login"
                variant="outline"
                borderColor="blue.400"
                color="blue.300"
                px={5}
                py={2}
                borderRadius="md"
                _hover={{ bg: "blue.600", borderColor: "blue.600", color: "white" }}
              >
                Login
              </Button>
              <Button
                as={Link}
                to="/register"
                bg="green.500"
                color="white"
                px={5}
                py={2}
                borderRadius="md"
                fontWeight="semibold"
                _hover={{ bg: "green.600" }}
                _active={{ bg: "green.700" }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}
