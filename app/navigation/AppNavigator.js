import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../screens/Login";
import Home from "../screens/Home";
import Registro from "../screens/Registro";
import PagePrinci from "../screens/PagePrinci";
import NovaVenda from "../screens/NovaVenda";
import Clientes from "../screens/Clientes";
import Produtos from "../screens/Produtos";
import Relatorios from "../screens/Relatorios";

const Stack = createNativeStackNavigator();

const AppNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Registro" component={Registro} />
        <Stack.Screen name="PagePrinci" component={PagePrinci} />
        <Stack.Screen name="NovaVenda" component={NovaVenda} options={{ title: 'Nova Venda' }} />
        <Stack.Screen name="Clientes" component={Clientes} />
        <Stack.Screen name="Produtos" component={Produtos} />
        <Stack.Screen name="Relatorios" component={Relatorios} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;