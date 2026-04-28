import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';

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
        <Text style={styles.buttonText}>Continue with Email</Text>
      </TouchableOpacity>

      {/* Google Auth - will integrate later */}
      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={() => console.log('Google Auth Here')}
      >
        <Image
          source={require('../../assets/google.png')}
          style={styles.googleIcon}
        />
        <Text style={[styles.buttonText, { color: '#444' }]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      <Text style={styles.terms}>
        By continuing, you agree to our{' '}
        <Text style={styles.link}>Terms of Use</Text> and{' '}
        <Text style={styles.link}>Privacy Policy</Text>.
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
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
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
