import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ProfitResult } from "@/domain/diagnostic/types";
import { getPublicResult } from "@/server/services/get-public-result";
import { ApiError } from "@/server/http/errors";
import { ResultView } from "@/components/result/ResultView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seu Raio-X do Lucro — Konvert",
  robots: { index: false, follow: false },
};

interface ResultPageProps {
  params: Promise<{ token: string }>;
}

/**
 * Server Component: reads the public result directly from the service
 * (no client round trip to the API) and renders it. `getPublicResult`
 * only ever surfaces a not-found `ApiError` here — anything else is a
 * genuine bug and is left to propagate to the error boundary rather than
 * being swallowed.
 */
export default async function ResultPage({ params }: ResultPageProps) {
  const { token } = await params;

  const data = await getPublicResult(token).catch((error: unknown) => {
    if (error instanceof ApiError && error.code === "not_found") {
      notFound();
    }
    throw error;
  });

  return (
    <ResultView
      formulaVersion={data.formulaVersion}
      deliveryType={data.deliveryType}
      mainChannel={data.mainChannel}
      result={data.result as ProfitResult}
    />
  );
}
