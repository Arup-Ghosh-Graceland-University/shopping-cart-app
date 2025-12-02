// src/pages/CartPage.jsx
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

// icon buttons
import { MdAdd, MdRemove, MdDelete } from "react-icons/md";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Load cart from backend
  async function loadCart() {
    try {
      setError("");
      const res = await api.get("/cart");
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Failed to load cart:", err);
      setError("Failed to load cart.");
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  function calculateSubtotal() {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  async function updateQuantity(productId, newQty) {
    try {
      await api.put(`/cart/${productId}`, { quantity: newQty });
      await loadCart(); // reload cart from backend
    } catch (err) {
      console.error("Failed to update cart:", err);
      alert(
        err.response?.data?.message || "Failed to update cart. Server error."
      );
    }
  }

  async function removeItem(productId) {
    try {
      await api.delete(`/cart/${productId}`);
      await loadCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
      alert("Failed to remove item.");
    }
  }

  const subtotal = calculateSubtotal();
  const taxRate = 0.07;
  const tax = +(subtotal * taxRate).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  return (
    <Box>
      <Heading mb={4}>Your Cart</Heading>

      {error && (
        <Text mb={3} color="red.500">
          {error}
        </Text>
      )}

      {items.length === 0 ? (
        <Text>Your cart is empty.</Text>
      ) : (
        <>
          {items.map((item) => (
            <Flex
              key={item.productId}
              align="center"
              mb={4}
              borderWidth="1px"
              borderRadius="lg"
              p={4}
              bg="white"
              boxShadow="sm"
            >
              <Box flex="1">
                <Text fontWeight="bold" fontSize="lg">
                  {item.name}
                </Text>
                {item.category && (
                  <Text fontSize="sm" color="gray.500">
                    Category: {item.category}
                  </Text>
                )}
                <Text fontSize="sm" color="gray.700">
                  ${item.price} x {item.quantity}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  Line total: ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </Box>

              {/* Quantity + Remove controls with icons */}
              <Flex align="center" gap={2}>
                {/* Decrease */}
                <Button
                  aria-label="Decrease quantity"
                  size="sm"
                  p={0}
                  w="32px"
                  h="32px"
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.300"
                  borderRadius="full"
                  _hover={{ bg: "gray.100" }}
                  _active={{ bg: "gray.200" }}
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                >
                  <MdRemove size={18} color="#1F2933" />
                </Button>

                <Text
                  fontWeight="medium"
                  minW="20px"
                  textAlign="center"
                >
                  {item.quantity}
                </Text>

                {/* Increase */}
                <Button
                  aria-label="Increase quantity"
                  size="sm"
                  p={0}
                  w="32px"
                  h="32px"
                  bg="white"
                  borderWidth="1px"
                  borderColor="gray.300"
                  borderRadius="full"
                  _hover={{ bg: "gray.100" }}
                  _active={{ bg: "gray.200" }}
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                >
                  <MdAdd size={18} color="#1F2933" />
                </Button>

                {/* Remove */}
                <Button
                  aria-label="Remove item"
                  size="sm"
                  p={0}
                  w="36px"
                  h="36px"
                  bg="red.500"
                  borderRadius="full"
                  _hover={{ bg: "red.600" }}
                  _active={{ bg: "red.700" }}
                  onClick={() => removeItem(item.productId)}
                >
                  <MdDelete size={18} color="#FFFFFF" />
                </Button>
              </Flex>
            </Flex>
          ))}

          <Box
            mt={4}
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            bg="white"
            boxShadow="sm"
          >
            <Text>Subtotal: ${subtotal.toFixed(2)}</Text>
            <Text>Tax (7%): ${tax.toFixed(2)}</Text>
            <Text fontWeight="bold">Total: ${total.toFixed(2)}</Text>
          </Box>

          <Button
            mt={5}
            bg="green.500"
            color="white"
            fontWeight="semibold"
            px={6}
            py={3}
            borderRadius="md"
            _hover={{ bg: "green.600" }}
            _active={{ bg: "green.700" }}
            onClick={() => navigate("/checkout")}
          >
            Go to Checkout
          </Button>
        </>
      )}
    </Box>
  );
}
