import { Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ScreenWrapper } from "@/components/layout/ScreenWrapper";
import { usePaymentHistory } from "@/hooks/usePayments";

function statusColor(status: string) {
  switch (status) {
    case "paid":
      return "#10B981";
    case "pending":
      return "#F59E0B";
    case "failed":
      return "#EF4444";
    default:
      return "#9CA3AF";
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PaymentsScreen() {
  const { data: payments, isLoading, refetch } = usePaymentHistory();

  return (
    <ScreenWrapper>
      <View style={{ flex: 1, backgroundColor: "#111827", padding: 20 }}>
        <Text
          style={{
            color: "white",
            fontSize: 24,
            fontWeight: "900",
            marginBottom: 16,
            marginTop: 8,
          }}
        >
          Payments
        </Text>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#9CA3AF" }}>Loading...</Text>
          </View>
        ) : !payments || payments.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>💳</Text>
            <Text style={{ color: "#9CA3AF", fontSize: 16, textAlign: "center" }}>
              No payments yet
            </Text>
            <Text
              style={{
                color: "#6B7280",
                fontSize: 13,
                textAlign: "center",
                marginTop: 4,
              }}
            >
              Your payment history will appear here
            </Text>
          </View>
        ) : (
          <FlashList
            data={payments}
            estimatedItemSize={80}
            keyExtractor={(item) => item.id}
            onRefresh={refetch}
            refreshing={isLoading}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "#1F2937",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 15,
                      fontWeight: "700",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {item.product.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <View
                    style={{
                      backgroundColor: statusColor(item.status) + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: statusColor(item.status),
                        fontSize: 12,
                        fontWeight: "700",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: "#9CA3AF", fontSize: 13 }}>
                    ৳ {item.amount_bdt.toLocaleString()}
                  </Text>
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
