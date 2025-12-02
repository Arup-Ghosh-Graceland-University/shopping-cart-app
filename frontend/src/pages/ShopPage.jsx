// src/pages/ShopPage.jsx
import {
  Box,
  Heading,
  SimpleGrid,
  Text,
  Button,
  Image,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import api from "../api";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        setError("");
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load products. Please try again.");
      }
    }

    fetchProducts();
  }, []);

  async function handleAddToCart(productId) {
    try {
      await api.post("/cart", { productId });
      alert("Added to cart");
    } catch (err) {
      console.error("Could not add to cart:", err);
      alert(
        err.response?.data?.message || "Could not add to cart. Server error."
      );
    }
  }

  return (
    <Box>
      <Heading mb={4}>Shop</Heading>

      {error && (
        <Text mb={4} color="red.500">
          {error}
        </Text>
      )}

      <SimpleGrid columns={[1, 2, 3]} spacing={4}>
        {products.map((p) => (
          <Box
            key={p._id}
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            bg="white"
            boxShadow="sm"
          >
            {p.image && (
              <Image
                src={p.image}
                alt={p.name}
                mb={3}
                borderRadius="md"
                w="100%"
                h="180px"
                objectFit="cover"
              />
            )}

            <Heading size="md" mb={1}>
              {p.name}
            </Heading>

            {p.category && (
              <Badge colorScheme="purple" mb={2}>
                {p.category}
              </Badge>
            )}

            <Text fontWeight="bold" mb={1}>
              ${p.price}
            </Text>

            <Text fontSize="sm" color="gray.600" mb={2}>
              {p.description}
            </Text>

            <Text fontSize="sm" mb={2}>
              Stock:{" "}
              <Text as="span" fontWeight="bold">
                {p.stock}
              </Text>
            </Text>

            <Button
              onClick={() => handleAddToCart(p._id)}
              isDisabled={p.stock <= 0}
              w="100%"
              py={2}
              mt={1}
              borderRadius="md"
              bg="blue.500"
              color="white"
              fontWeight="semibold"
              _hover={{ bg: "blue.600" }}
              _active={{ bg: "blue.700" }}
              _disabled={{
                bg: "gray.200",
                color: "gray.500",
                cursor: "not-allowed",
              }}
            >
              {p.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </Button>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
