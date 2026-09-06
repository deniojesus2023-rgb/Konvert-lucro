import type { Metadata } from "next";
import { DiagnosticWizard } from "@/components/diagnostic/DiagnosticWizard";

export const metadata: Metadata = {
  title: "Raio-X do Lucro — Konvert",
};

export default function RaioXPage() {
  return <DiagnosticWizard />;
}
