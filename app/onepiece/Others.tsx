import { View, Text, TouchableOpacity, StyleSheet, Image, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const size = 40; // 自訂圖示尺寸

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}>
      

      <TouchableOpacity onPress={() => router.push('/onepiece')}>
        <Image
          source={{ uri: isDark
            ? 'https://raw.githubusercontent.com/Freshyclam/OPTCGDB/refs/heads/main/onepiece-logo-white.png'
            : 'https://raw.githubusercontent.com/Freshyclam/OPTCGDB/refs/heads/main/onepiece-logo-black.png'
          }}
          style={{ width: size * 6, height: size * 1.5 }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/riftbound')}>
        <Image
          source={{ uri: isDark
            ? 'https://raw.githubusercontent.com/Freshyclam/riftbound/refs/heads/main/Riftbound_logo.png'
            : 'https://raw.githubusercontent.com/Freshyclam/riftbound/refs/heads/main/Riftbound_logo.png'
          }}
          style={{ width: size * 6, height: size * 1.5 }}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});
