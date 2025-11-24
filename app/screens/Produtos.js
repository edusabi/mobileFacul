import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
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

      <Button
        title={loading ? 'Salvando...' : 'Salvar Produto'}
        onPress={salvarProduto}
      />
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
});

export default Produtos;
