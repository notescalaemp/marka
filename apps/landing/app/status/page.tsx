import type { Metadata } from "next";
import { StatusPage } from "@/components/StatusPage";

export const metadata: Metadata = {
  title: "Status — Marka",
  description: "Status operacional da API e dos serviços do Marka.",
};

export default function StatusRoute() {
  return <StatusPage />;
}
