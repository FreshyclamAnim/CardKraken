import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ComingSoonScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // 你可以改成深色主題 '#121212'
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333', // 你可以改色
  },
});
