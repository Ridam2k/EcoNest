import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const userAuth = localStorage.getItem("userAuth");
    if (!userAuth || !JSON.parse(userAuth)?.token) {
      throw redirect({
        to: "/login"
      });
    }
  },
});
