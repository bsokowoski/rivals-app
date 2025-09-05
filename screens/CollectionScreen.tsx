// screens/CollectionScreen.tsx
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useCollection } from "../contexts/CollectionContext";
import { CatalogItem, searchCatalog } from "../services/collectr";

const PADDING = 16;

const CollectionScreen: React.FC = () => {
  const { items, totalValue, currency, addOrIncrement, setQuantity, removeItem, refreshValuations, clearAll } =
    useCollection();

  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [pendingQty, setPendingQty] = useState("1");
  const [pendingCondition, setPendingCondition] = useState("NM");

  const runSearch = useCallback(async () => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const r = await searchCatalog(q.trim(), 30);
      setResults(r);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  }, [q]);

  const onSelect = useCallback(
    async (c: CatalogItem) => {
      const qty = Math.max(1, parseInt(pendingQty || "1", 10));
      await addOrIncrement(
        {
          catalogId: c.catalogId,
          name: c.name,
          setName: c.setName,
          number: c.number,
          rarity: c.rarity,
          imageUrl: c.imageUrl,
          condition: pendingCondition || "NM",
        },
        qty
      );
      setAdding(false);
      setQ("");
      setResults([]);
      setPendingQty("1");
      setPendingCondition("NM");
    },
    [addOrIncrement, pendingQty, pendingCondition]
  );

  const ValueHeader = () => (
    <View style={{ paddingHorizontal: PADDING, paddingTop: 8, paddingBottom: 12, gap: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>My Collection</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={refreshValuations}
            style={{ backgroundColor: "#222", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: "white" }}>Refresh Values</Text>
          </Pressable>
          <Pressable
            onPress={() => setAdding(true)}
            style={{ backgroundColor: "#e11", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>+ Add</Text>
          </Pressable>
        </View>
      </View>
      <View
        style={{
          backgroundColor: "#121212",
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: "#262626",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#aaa" }}>Estimated Market Value</Text>
        <Text style={{ color: "#0f0", fontSize: 20, fontWeight: "800" }}>
          {currency} {totalValue.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <FlatList
        ListHeaderComponent={<ValueHeader />}
        contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 80 }}
        data={items}
        keyExtractor={(i, idx) => `${i.catalogId}:${i.condition}:${idx}`}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#111",
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: 80, height: 112, borderRadius: 8, backgroundColor: "#222" }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "700" }} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={{ color: "#aaa", marginTop: 2 }} numberOfLines={1}>
                  {(item.setName || "—")}{item.number ? ` • #${item.number}` : ""}{item.rarity ? ` • ${item.rarity}` : ""}
                </Text>

                <View style={{ marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: "#2a2a2a",
                        borderRadius: 10,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Pressable
                        onPress={() => setQuantity(item.catalogId, Math.max(1, item.quantity - 1), item.condition)}
                        style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                      >
                        <Ionicons name="remove" size={18} color="#ddd" />
                      </Pressable>
                      <Text style={{ color: "white", minWidth: 24, textAlign: "center" }}>{item.quantity}</Text>
                      <Pressable
                        onPress={() => setQuantity(item.catalogId, item.quantity + 1, item.condition)}
                        style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                      >
                        <Ionicons name="add" size={18} color="#ddd" />
                      </Pressable>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        backgroundColor: "#222",
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#333",
                      }}
                    >
                      <Text style={{ color: "#ddd", fontSize: 12 }}>{item.condition || "NM"}</Text>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: "#0f0", fontWeight: "800" }}>
                      {item.currency || "USD"} {(item.lastPrice ?? 0).toFixed(2)}
                    </Text>
                    <Text style={{ color: "#aaa", fontSize: 12 }}>
                      Line: {(item.currency || "USD")} {(((item.lastPrice ?? 0) * item.quantity)).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10, gap: 12 }}>
                  <Pressable
                    onPress={() => removeItem(item.catalogId, item.condition)}
                    style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: "#2a2a2a" }}
                  >
                    <Text style={{ color: "#fff" }}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: "#aaa", textAlign: "center", marginTop: 40 }}>
            Your collection is empty. Tap “+ Add” to start tracking.
          </Text>
        }
      />

      {/* Add modal */}
      <Modal visible={adding} animationType="slide" onRequestClose={() => setAdding(false)} transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: "#0b0b0b",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              minHeight: "65%",
              borderTopWidth: 1,
              borderColor: "#222",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Add to Collection</Text>
              <Pressable onPress={() => setAdding(false)}>
                <Ionicons name="close" size={22} color="#999" />
              </Pressable>
            </View>

            {/* Search input */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#141414",
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 44,
                borderWidth: 1,
                borderColor: "#222",
                marginTop: 12,
              }}
            >
              <Ionicons name="search" size={18} color="#888" />
              <TextInput
                placeholder="Search catalog (name, set, number)"
                placeholderTextColor="#777"
                value={q}
                onChangeText={setQ}
                onSubmitEditing={runSearch}
                style={{ color: "white", flex: 1 }}
                returnKeyType="search"
              />
              <Pressable onPress={() => { setQ(""); setResults([]); }}>
                <Ionicons name="close" size={18} color="#666" />
              </Pressable>
            </View>

            {/* Condition & Qty */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                <Text style={{ color: "#aaa" }}>Cond.</Text>
                <TextInput
                  value={pendingCondition}
                  onChangeText={setPendingCondition}
                  placeholder="NM"
                  placeholderTextColor="#777"
                  style={{
                    color: "white",
                    backgroundColor: "#141414",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#222",
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    flex: 1,
                  }}
                />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, width: 110 }}>
                <Text style={{ color: "#aaa" }}>Qty</Text>
                <TextInput
                  value={pendingQty}
                  onChangeText={setPendingQty}
                  keyboardType="number-pad"
                  style={{
                    color: "white",
                    backgroundColor: "#141414",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#222",
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    flex: 1,
                    textAlign: "center",
                  }}
                />
              </View>
            </View>

            {/* Results */}
            <View style={{ marginTop: 12, flex: 1 }}>
              {loading ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator color="#e11" />
                </View>
              ) : (
                <FlatList
                  data={results}
                  keyExtractor={(r) => r.catalogId}
                  ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => onSelect(item)}
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        padding: 10,
                        backgroundColor: "#101010",
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: "#1f1f1f",
                      }}
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: 55, height: 78, borderRadius: 6, backgroundColor: "#222" }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "white", fontWeight: "600" }} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={{ color: "#999" }} numberOfLines={1}>
                          {(item.setName || "—")}{item.number ? ` • #${item.number}` : ""}{item.rarity ? ` • ${item.rarity}` : ""}
                        </Text>
                      </View>
                      <View style={{ justifyContent: "center" }}>
                        <Ionicons name="add-circle" size={22} color="#e11" />
                      </View>
                    </Pressable>
                  )}
                  ListEmptyComponent={
                    q.trim().length === 0 ? (
                      <Text style={{ color: "#777", textAlign: "center", marginTop: 18 }}>
                        Search the catalog to add cards.
                      </Text>
                    ) : (
                      <Text style={{ color: "#777", textAlign: "center", marginTop: 18 }}>
                        No results. Try different terms.
                      </Text>
                    )
                  }
                />
              )}
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
              <Pressable
                onPress={runSearch}
                style={{ backgroundColor: "#222", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}
              >
                <Text style={{ color: "white" }}>Search</Text>
              </Pressable>
              <Pressable
                onPress={() => setAdding(false)}
                style={{ backgroundColor: "#2a2a2a", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 }}
              >
                <Text style={{ color: "white" }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Danger zone (optional): clear all */}
      {items.length > 0 && (
        <View style={{ position: "absolute", bottom: 16, right: 16 }}>
          <Pressable
            onPress={clearAll}
            style={{ backgroundColor: "#171717", borderWidth: 1, borderColor: "#2a2a2a", padding: 10, borderRadius: 12 }}
          >
            <Text style={{ color: "#999" }}>Clear All</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CollectionScreen;
