import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../api/SupabaseClient'; 

const PagePrinci = ({navigation}) => {
  const [userName, setUserName] = useState('...');
  const [loading, setLoading] = useState(true);

  const [recentSales, setRecentSales] = useState([]);
  const [clientesQtd, setClientesQtd] = useState(0);
  const [produtosQtd, setProdutosQtd] = useState(0);
  const [totalMes, setTotalMes] = useState(0);

  useEffect(() => {
    fetchUserData();
    fetchRecentSales();
    fetchClientesQtd();
    fetchProdutosQtd();
    fetchTotalDoMes();
  }, []);

  // ------- Buscar Usuário -------
  const fetchUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        const firstName = user.user_metadata?.nome || user.email?.split('@')[0];
        setUserName(firstName);
      } else {
        setUserName('Visitante');
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error.message);
      setUserName('Visitante');
    } finally {
      setLoading(false);
    }
  };

  // ------- Buscar Últimas 3 vendas -------
  const fetchRecentSales = async () => {
    try {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          data,
          total,
          clientes:cliente_id ( nome )
        `)
        .order('data', { ascending: false })
        .limit(3);

      if (error) throw error;

      const formatted = data.map(item => ({
        id: item.id,
        date: item.data ? item.data.split("T")[0] : "",
        client: item.clientes?.nome || "Sem nome",
        total: item.total ?? 0,
      }));

      setRecentSales(formatted);

    } catch (e) {
      console.error('Erro ao buscar vendas:', e.message);
    }
  };

  // ------- TOTAL DE CLIENTES -------
  const fetchClientesQtd = async () => {
    const { count, error } = await supabase
      .from("clientes")   // ← AJUSTE AQUI
      .select("id", { count: "exact", head: true });

    if (!error) setClientesQtd(count);
  };

  // ------- TOTAL DE PRODUTOS -------
  const fetchProdutosQtd = async () => {
    const { count, error } = await supabase
      .from("produtos")
      .select("id", { count: "exact", head: true });

    if (!error) setProdutosQtd(count);
  };

  // ------- TOTAL DE VENDAS DO MÊS -------
  const fetchTotalDoMes = async () => {
    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1).toISOString();

      const { data, error } = await supabase
        .from("vendas")
        .select("total")
        .gte("data", inicioMes)
        .lt("data", fimMes);

      if (error) throw error;

      const soma = data.reduce((acc, v) => acc + (v.total || 0), 0);
      setTotalMes(soma);

    } catch (e) {
      console.log("Erro ao buscar total do mês:", e.message);
    }
  };

  // ------- LOADING -------
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Bem-vindo(a), {userName}!</Text>
      </View>

      {/* ---- MÉTRICAS ---- */}
      <View style={styles.metricsRow}>
        <MetricCard title="Total de Vendas (Mês)" value={`R$ ${totalMes.toFixed(2)}`} color="#1E90FF" />
        <MetricCard title="Produtos em Estoque" value={produtosQtd} color="#3CB371" />
        <MetricCard title="Clientes Cadastrados" value={clientesQtd} color="#DC143C" />
      </View>

      {/* Botões */}
      <View style={styles.actionsRow}>
        <ActionButton title="Nova Venda" color="#3CB371" onPress={() => navigation.navigate('NovaVenda')} />
        <ActionButton title="Clientes" color="#1E90FF" onPress={() => navigation.navigate('Clientes')} />
        <ActionButton title="Produtos" color="#9932CC" onPress={() => navigation.navigate('Produtos')} />
        <ActionButton title="Relatórios" color="#FF8C00" onPress={() => navigation.navigate('Relatorios')} />
      </View>

      {/* Últimas Vendas */}
      <Text style={styles.sectionTitle}>Últimas Vendas</Text>
      <View style={styles.table}>

        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Data</Text>
          <Text style={[styles.headerCell, { flex: 3 }]}>Cliente</Text>
          <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
        </View>

        {recentSales.map((sale) => (
          <View key={sale.id} style={styles.tableRow}>
            <Text style={[styles.dataCell, { flex: 0.5 }]}>{sale.id}</Text>
            <Text style={[styles.dataCell, { flex: 1.5 }]}>{sale.date}</Text>
            <Text style={[styles.dataCell, { flex: 3 }]}>{sale.client}</Text>
            <Text style={[styles.dataCell, { flex: 1.5, textAlign: 'right' }]}>
              R$ {sale.total.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// --------------------------------------------------------------------

const MetricCard = ({ title, value, color }) => (
  <View style={[styles.card, { backgroundColor: color }]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

const ActionButton = ({ title, color, onPress }) => (
  <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

// --------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 20,
  },

  card: {
    width: '30%',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 10,
    minHeight: 80,
    justifyContent: 'center',
  },

  cardTitle: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '400',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 10,
  },

  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },

  table: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e6e8eb',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },

  headerCell: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#444',
    paddingHorizontal: 8,
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  dataCell: {
    fontSize: 11,
    color: '#333',
    paddingHorizontal: 8,
  },
});

export default PagePrinci;
