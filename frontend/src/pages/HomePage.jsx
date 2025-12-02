// src/pages/HomePage.jsx
import { Box, Heading, Text } from "@chakra-ui/react";

export default function HomePage() {
  return (
    <Box>
      <Heading mb={4}>Welcome to Mini Shop</Heading>
      <Text mb={2}>
        This React app demonstrates a complete flow: Sign Up, Login with httpOnly cookies,
        Shopping Cart, Checkout, and Order History.
      </Text>
      <Text>
        Use the navigation at the top to register, log in, and start shopping.
      </Text>
    </Box>
  );
}
