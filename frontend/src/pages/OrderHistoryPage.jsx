// src/pages/OrderHistoryPage.jsx
import {
  Box,
  Heading,
  Text,
  Stack,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import api from "../api";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setError("");
        const res = await api.get("/orders/my");
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError("Failed to load orders.");
      }
    }

    loadOrders();
  }, []);

  return (
    <Box>
      <Heading mb={4}>Order History</Heading>

      {error && (
        <Text mb={3} color="red.500">
          {error}
        </Text>
      )}

      {orders.length === 0 ? (
        <Text>You have not placed any orders yet.</Text>
      ) : (
        <Stack spacing={4}>
          {orders.map((order) => (
            <Box
              key={order.id}
              borderWidth="1px"
              borderRadius="md"
              p={3}
              bg="white"
            >
              <Text fontWeight="bold" mb={1}>
                Order ID: {order.id}
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Date: {new Date(order.createdAt).toLocaleString()}
              </Text>

              <Text mb={2}>
                Subtotal: ${order.subtotal.toFixed(2)} | Tax: $
                {order.tax.toFixed(2)} |{" "}
                <Text as="span" fontWeight="bold">
                  Total: ${order.total.toFixed(2)}
                </Text>
              </Text>

              <Box borderTopWidth="1px" borderColor="gray.200" mt={2} pt={2}>
                <Text fontWeight="bold" mb={1}>
                  Items:
                </Text>
                {order.items.map((item, index) => (
                  <Box key={index} mb={1}>
                    <Text>
                      {item.name}{" "}
                      {item.category && (
                        <Badge ml={2} colorScheme="purple">
                          {item.category}
                        </Badge>
                      )}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {item.quantity} x ${item.price.toFixed(2)}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
