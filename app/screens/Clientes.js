import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../api/SupabaseClient";

const Clientes = () => {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  const salvarCliente = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome é obrigatório");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("clientes")
      .insert([{ nome, telefone, endereco, cpf }]);

    setLoading(false);

    if (error) {
      Alert.alert("Erro ao salvar", error.message);
    } else {
      Alert.alert("Sucesso", "Cliente cadastrado");
      setNome("");
      setTelefone("");
      setEndereco("");
      setCpf("");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cadastro de Clientes</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="Endereço"
        value={endereco}
        onChangeText={setEndereco}
      />

      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={telefone}
        onChangeText={setTelefone}
      />

      <TextInput
        style={styles.input}
        placeholder="Cpf"
        value={cpf}
        onChangeText={setCpf}
      />

      <TouchableOpacity
        style={styles.botaoSalvar}
        onPress={salvarCliente}
        disabled={loading} // Desabilita o botão enquanto estiver carregando
      >
               {" "}
        <Text style={styles.textoBotao}>
                    {loading ? "Salvando..." : "Salvar"}       {" "}
        </Text>
             {" "}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  botaoSalvar: {
    backgroundColor: "#4CAF50", // 🟢 Cor Verde para Salvar (Ação Primária)
    padding: 12,
    borderRadius: 8,
    alignItems: "center", // Centraliza o texto horizontalmente
    justifyContent: "center", // Centraliza o texto verticalmente
    marginTop: 10, // Um pequeno espaçamento acima dos inputs
    elevation: 3, // Sombra (Android)
    shadowColor: "#000", // Sombra (iOS)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  textoBotao: {
    color: "#FFFFFF", // ⚪ Texto Branco
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Clientes;
