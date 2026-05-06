import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AuthStartScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Email Login */}
      <TouchableOpacity
        style={[styles.button, styles.emailButton]}
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons name="mail-outline" size={20} color="#888" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Continue with Email</Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        By continuing, you agree to our{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('TermsOfUse')}>Terms of Use</Text> and{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 20,
  },
  logo: {
    width: 300,
    height: 90,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    marginVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  buttonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },
  terms: {
    marginTop: 20,
    textAlign: 'center',
    color: '#999',
    width: '85%',
    fontSize: 13,
    lineHeight: 18,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#666',
  },
});
