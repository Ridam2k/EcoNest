import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ThemeProvider } from "./components/ui/theme-provider.jsx";

const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({ routeTree });

// Render the app
const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
