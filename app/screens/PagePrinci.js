import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from '../api/SupabaseClient'; 

const PagePrinci = ({navigation}) => {
  const [userName, setUserName] = useState('...');
  const [loading, setLoading] = useState(true);

  const recentSales = [
    { id: 192, date: '2025-09-01', client: 'Dado Vaquinha', total: 370.00 },
    { id: 191, date: '2025-08-31', client: 'Kátia Silva', total: 120.00 },
    { id: 190, date: '2025-06-26', client: 'Márcia & Souza', total: 85.00 },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;
    console.log('Usuário autenticado:', user);

    if (user) {
      const firstName = user.user_metadata?.nome || user.email?.split('@')[0];

      setUserName(firstName);
    } else {
      setUserName('Visitante');
    }
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error.message);
    setUserName('Visitante');
  } finally {
    setLoading(false);
  }
};


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

      <View style={styles.metricsRow}>
        <MetricCard title="Total de Vendas (Mês)" value="R$ 0.0" color="#1E90FF" />
        <MetricCard title="Produtos em Estoque" value="0" color="#3CB371" />
        <MetricCard title="Clientes Cadastrados" value="0" color="#DC143C" />
      </View>

      {/* Botões de Ação */}
      <View style={styles.actionsRow}>
        <ActionButton title="Nova Venda" color="#3CB371" onPress={() => navigation.navigate('NovaVenda')} />
        <ActionButton title="Clientes" color="#1E90FF" onPress={() => navigation.navigate('Clientes')} />
        <ActionButton title="Produtos" color="#9932CC" onPress={() => navigation.navigate('Produtos')} />
        <ActionButton title="Relatórios" color="#FF8C00" onPress={() => navigation.navigate('Relatorios')} />
      </View>


      {/* Tabela de Últimas Vendas */}
      <Text style={styles.sectionTitle}>Últimas Vendas</Text>
      <View style={styles.table}>
        {/* Cabeçalho da Tabela */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, { flex: 0.5 }]}>ID</Text>
          <Text style={[styles.headerCell, { flex: 1.5 }]}>Data</Text>
          <Text style={[styles.headerCell, { flex: 3 }]}>Cliente</Text>
          <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
        </View>

        {/* Linhas da Tabela */}
        {recentSales.map((sale) => (
          <View key={sale.id} style={styles.tableRow}>
            <Text style={[styles.dataCell, { flex: 0.5 }]}>{sale.id}</Text>
            <Text style={[styles.dataCell, { flex: 1.5 }]}>{sale.date}</Text>
            <Text style={[styles.dataCell, { flex: 3 }]}>{sale.client}</Text>
            <Text style={[styles.dataCell, { flex: 1.5, textAlign: 'right' }]}>R$ {sale.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// --- Componentes Reutilizáveis ---

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

// --- Estilos (Styles) ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f2f5', // Cor de fundo leve
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
  // Métricas
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
  // Ações/Botões
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
  // Tabela
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