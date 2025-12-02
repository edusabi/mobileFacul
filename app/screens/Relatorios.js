import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { supabase } from "../api/SupabaseClient";

const Relatorios = () => {
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [faturamentoAno, setFaturamentoAno] = useState(0);
  const [vendasDia, setVendasDia] = useState(0);
  const [vendasMes, setVendasMes] = useState(0);
  const [lucro, setLucro] = useState(0);

  useEffect(() => {
    fetchRelatorios();
  }, []);

  const fetchRelatorios = async () => {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
    const inicioAno = new Date(hoje.getFullYear(), 0, 1).toISOString();

    try {
      // ========= VENDAS DO DIA ===========
      const { data: vendasDiaData } = await supabase
        .from("vendas")
        .select("id,total")
        .gte("data", inicioDia);

      setVendasDia(vendasDiaData.length);

      // ========= VENDAS DO MÊS ===========
      const { data: vendasMesData } = await supabase
        .from("vendas")
        .select("id,total")
        .gte("data", inicioMes);

      setVendasMes(vendasMesData.length);

      // ========= FATURAMENTO DO MÊS ===========
      const faturamentoMesCalc = vendasMesData.reduce(
        (acc, v) => acc + (v.total || 0),
        0
      );
      setFaturamentoMes(faturamentoMesCalc);

      // ========= FATURAMENTO DO ANO ===========
      const { data: vendasAnoData } = await supabase
        .from("vendas")
        .select("total")
        .gte("data", inicioAno);

      const faturamentoAnoCalc = vendasAnoData.reduce(
        (acc, v) => acc + (v.total || 0),
        0
      );
      setFaturamentoAno(faturamentoAnoCalc);

      // ========= LUCRO ===========
      const { data: lucroData } = await supabase
        .from("vendas")
        .select("subtotal,total");

      const lucroCalc = lucroData.reduce((acc, v) => {
        const lucroVenda = (v.total || 0) - (v.subtotal || 0);
        return acc + lucroVenda;
      }, 0);

      setLucro(lucroCalc);
    } catch (error) {
      console.log("Erro ao carregar relatórios:", error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Relatórios</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Faturamento do Mês</Text>
        <Text style={styles.cardValue}>R$ {faturamentoMes.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Faturamento Anual</Text>
        <Text style={styles.cardValue}>R$ {faturamentoAno.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vendas do Dia</Text>
        <Text style={styles.cardValue}>{vendasDia}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vendas do Mês</Text>
        <Text style={styles.cardValue}>{vendasMes}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lucro Total</Text>
        <Text style={styles.cardValue}>R$ {lucro.toFixed(2)}</Text>
      </View>
    </ScrollView>
  );
};

export default Relatorios;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    padding: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },
});
