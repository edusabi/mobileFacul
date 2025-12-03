import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useFocusEffect } from '@react-navigation/native'; // Importante para atualizar ao abrir
import { supabase } from "../api/SupabaseClient";

const Relatorios = () => {
  const [faturamentoMes, setFaturamentoMes] = useState(0);
  const [faturamentoAno, setFaturamentoAno] = useState(0);
  const [vendasDia, setVendasDia] = useState(0);
  const [vendasMes, setVendasMes] = useState(0);
  const [lucro, setLucro] = useState(0);

  // useFocusEffect garante que os dados recarreguem toda vez que você entrar na tela
  useFocusEffect(
    useCallback(() => {
      fetchRelatorios();
    }, [])
  );

  // Função para corrigir fuso horário e pegar data local correta
  const toLocalISO = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString();
  };

  const fetchRelatorios = async () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const dia = hoje.getDate();

    // Datas ajustadas
    const inicioDia = toLocalISO(new Date(ano, mes, dia)); // Hoje 00:00
    const inicioMes = toLocalISO(new Date(ano, mes, 1));   // Dia 1 do mês 00:00
    const inicioAno = toLocalISO(new Date(ano, 0, 1));     // Dia 1 de Jan 00:00

    try {
      // ========= VENDAS DO DIA (Quantidade) ===========
      const { data: vendasDiaData } = await supabase
        .from("vendas")
        .select("id")
        .gte("data", inicioDia);

      setVendasDia(vendasDiaData ? vendasDiaData.length : 0);

      // ========= VENDAS DO MÊS (Quantidade e Faturamento) ===========
      const { data: vendasMesData } = await supabase
        .from("vendas")
        .select("total")
        .gte("data", inicioMes);

      if (vendasMesData) {
        setVendasMes(vendasMesData.length);
        const fatMes = vendasMesData.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
        setFaturamentoMes(fatMes);
      }

      // ========= FATURAMENTO DO ANO ===========
      const { data: vendasAnoData } = await supabase
        .from("vendas")
        .select("total")
        .gte("data", inicioAno);

      if (vendasAnoData) {
        const fatAno = vendasAnoData.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
        setFaturamentoAno(fatAno);
      }

      // ========= LUCRO REAL (Venda - Custo) ===========
      // Aqui buscamos os itens vendidos e o custo do produto associado
      const { data: itensVendidos, error: errLucro } = await supabase
        .from("venda_itens")
        .select(`
          quantidade,
          valor_unit,
          produtos ( custo )
        `);

      if (errLucro) {
        console.error("Erro ao buscar dados de lucro:", errLucro.message);
      } else if (itensVendidos) {
        const lucroTotalCalc = itensVendidos.reduce((acc, item) => {
          const qtd = Number(item.quantidade) || 0;
          const valorVenda = Number(item.valor_unit) || 0;
          
          // Se não tiver custo cadastrado, considera 0 (mas o ideal é ter)
          const custoProduto = item.produtos ? Number(item.produtos.custo) : 0;

          // Lucro = (Preço Venda - Custo) * Quantidade
          const lucroItem = (valorVenda - custoProduto) * qtd;
          return acc + lucroItem;
        }, 0);

        setLucro(lucroTotalCalc);
      }

    } catch (error) {
      console.log("Erro geral ao carregar relatórios:", error.message);
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

      <View style={styles.row}>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Vendas do Dia</Text>
            <Text style={styles.cardValue}>{vendasDia}</Text>
          </View>
          <View style={[styles.card, styles.halfCard]}>
            <Text style={styles.cardTitle}>Vendas do Mês</Text>
            <Text style={styles.cardValue}>{vendasMes}</Text>
          </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lucro Estimado (Total)</Text>
        <Text style={[styles.cardValue, { color: '#2ecc71' }]}>R$ {lucro.toFixed(2)}</Text>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCard: {
    width: '48%', 
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
  obs: {
      fontSize: 10,
      color: '#999',
      marginTop: 5,
      fontStyle: 'italic'
  }
});