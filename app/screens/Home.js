import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image  } from 'react-native';

const Home = ({ navigation }) => {
  return (
    <View style={styles.container}>

      <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain"/>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#007BFF' }]}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#28A745' }]}
        onPress={() => navigation.navigate('Registro')}
      >
        <Text style={styles.buttonText}>Registro</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    width: '80%',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
   logo: {
    padding: 25,
    margin: 50,
    width: 300,
    height: 300,
  },
});

export default Home;
