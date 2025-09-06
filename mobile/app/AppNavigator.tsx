import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import EventsScreen from './screens/EventsScreen';
import MyRegistrationsScreen from './screens/MyRegistrationsScreen';
import ScanScreen from './screens/ScanScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Events: undefined;
  MyRegistrations: undefined;
  Scan: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return null; // could render a splash loader

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="Events" component={EventsScreen} options={{ title: 'Events' }} />
            <Stack.Screen name="MyRegistrations" component={MyRegistrationsScreen} options={{ title: 'My Registrations' }} />
            <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Scan' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Login' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
