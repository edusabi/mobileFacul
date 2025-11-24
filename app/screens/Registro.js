import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { supabase } from '../api/SupabaseClient';

const Registro = ({ navigation }) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // Função de cadastro
  const handleRegister = async () => {
    if (!nome || !email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    try {
      // 🔹 1. Cria o usuário na autenticação do Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome }, // Armazena o nome como metadado
        },
      });

      if (error) {
        Alert.alert('Erro no cadastro', error.message);
        return;
      }

      // 🔹 2. Salva informações complementares na tabela 'usuarios'
      // (sem senha, pois já está segura no Auth)
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert([{ nome, email }]);

      if (insertError) {
        Alert.alert('Erro ao salvar dados', insertError.message);
        return;
      }

      Alert.alert(
        'Sucesso 🎉',
        'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
      );

      navigation.navigate('Registro');

      setNome('');
      setEmail('');
      setSenha('');
    } catch (err) {
      Alert.alert('Erro inesperado', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkText}>Já tem conta? Clique aqui</Text>
      </TouchableOpacity>
            
    </View>
  );
};

export default Registro;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  linkText: {
    margin: 20,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
