// src/pages/CheckoutPage.jsx
import {
  Box,
  Heading,
  Text,
  Button,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function CheckoutPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    async function doCheckout() {
      try {
        setError("");
        const res = await api.post("/checkout");
        setOrder(res.data.order);
      } catch (err) {
        console.error("Checkout failed:", err);
        setError(
          err.response?.data?.message || "Checkout failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    doCheckout();
  }, []);

  async function handleFinish() {
    await logout();
    navigate("/");
  }

  if (loading) {
    return (
      <Box>
        <Heading mb={4}>Processing Checkout...</Heading>
        <Spinner />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box>
        <Heading mb={4}>Checkout</Heading>
        <Text color="red.500" mb={3}>
          {error || "Something went wrong. Please go back to your cart."}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={4}>Order Summary</Heading>
      <Text>Order ID: {order.id}</Text>
      <Text>Subtotal: ${order.subtotal.toFixed(2)}</Text>
      <Text>Tax: ${order.tax.toFixed(2)}</Text>
      <Text fontWeight="bold">Total: ${order.total.toFixed(2)}</Text>

      <Text mt={4}>
        Your order has been saved in MongoDB. You will now be logged out to
        complete the full login → shop → checkout flow.
      </Text>

      <Button
        mt={4}
        w="100%"
        py={3}
        borderRadius="md"
        bg="blue.500"
        color="white"
        fontWeight="semibold"
        _hover={{ bg: "blue.600" }}
        _active={{ bg: "blue.700" }}
        onClick={handleFinish}
      >
        Finish &amp; Logout
      </Button>
    </Box>
  );
}
