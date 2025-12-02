import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  StyleSheet, 
  TouchableOpacity // Importar TouchableOpacity
} from 'react-native';
import { supabase } from '../api/SupabaseClient';

const Produtos = () => {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [estoque, setEstoque] = useState('');
  const [loading, setLoading] = useState(false);

  const salvarProduto = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório');
      return;
    }
    if (!preco.trim() || isNaN(preco)) {
      Alert.alert('Erro', 'Preço inválido');
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
      setEstoque('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cadastro de Produtos</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome do produto"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="Preço (ex: 10.50)"
        value={preco}
        onChangeText={setPreco}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Estoque inicial"
        value={estoque}
        onChangeText={setEstoque}
        keyboardType="numeric"
      />

      {/* Substituí o Button pelo TouchableOpacity para estilizar */}
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  // Novos estilos para o botão verde
  botaoSalvar: {
    backgroundColor: '#4CAF50', // Verde
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3, // Sombra no Android
    shadowColor: '#000', // Sombra no iOS
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