import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import * as WebBrowser from "expo-web-browser";

interface InitiatePaymentParams {
  product: string;
  amount_bdt: number;
  application_id?: string;
}

export function useInitiatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: InitiatePaymentParams) => {
      const { data } = await api.post("/payments/initiate", params);
      return data as { payment_id: string; payment_url: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function usePaymentHistory() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data } = await api.get("/payments/history");
      return data as Array<{
        id: string;
        product: string;
        amount_bdt: number;
        status: string;
        created_at: string;
      }>;
    },
  });
}

export async function openPaymentGateway(paymentUrl: string) {
  return WebBrowser.openBrowserAsync(paymentUrl, {
    dismissButtonStyle: "close",
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
  });
}
