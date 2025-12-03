import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { supabase } from '../api/SupabaseClient';

const Produtos = () => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [custo, setCusto] = useState(''); // <--- Novo Estado para Custo
  const [estoque, setEstoque] = useState('');
  const [loading, setLoading] = useState(false);

  const salvarProduto = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório');
      return;
    }
    if (!preco.trim() || isNaN(preco)) {
      Alert.alert('Erro', 'Preço de venda inválido');
      return;
    }
    // Validação do Custo (opcional, mas se preenchido deve ser número)
    if (custo.trim() && isNaN(custo)) {
      Alert.alert('Erro', 'Preço de custo inválido');
      return;
    }
    if (estoque.trim() && isNaN(estoque)) {
      Alert.alert('Erro', 'Estoque deve ser número');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('produtos')
      .insert([
        {
          nome,
          preco: parseFloat(preco),
          custo: custo ? parseFloat(custo) : 0, // <--- Envia o Custo (ou 0 se vazio)
          estoque: estoque ? parseInt(estoque) : 0,
        },
      ]);

    setLoading(false);

    if (error) {
      Alert.alert('Erro ao salvar', error.message);
    } else {
      Alert.alert('Sucesso', 'Produto cadastrado!');
      setNome('');
      setPreco('');
      setCusto(''); // <--- Limpa o campo custo
      setEstoque('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cadastro de Produtos</Text>

      <Text style={styles.label}>Nome do Produto</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Sela de Couro"
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>Preço de Venda (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        value={preco}
        onChangeText={setPreco}
        keyboardType="numeric"
      />

      {/* --- Novo Campo de Custo --- */}
      <Text style={styles.label}>Preço de Custo (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00 (Quanto você pagou/gastou)"
        value={custo}
        onChangeText={setCusto}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Quantidade em Estoque</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        value={estoque}
        onChangeText={setEstoque}
        keyboardType="numeric"
      />

      <TouchableOpacity 
        style={styles.botaoSalvar} 
        onPress={salvarProduto}
        disabled={loading}
      >
        <Text style={styles.textoBotao}>
          {loading ? 'Salvando...' : 'Salvar Produto'}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15, // Aumentei um pouco o espaçamento
    fontSize: 16,
  },
  botaoSalvar: {
    backgroundColor: '#4CAF50', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  textoBotao: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Produtos;