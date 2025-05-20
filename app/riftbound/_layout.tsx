import { Drawer } from 'expo-router/drawer';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome, MaterialIcons, FontAwesome5, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, Image } from 'react-native'; // 加上 Image



export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const textColor = theme.colors.text;
  
  const isDark = colorScheme === 'dark';

  return (
    <ThemeProvider value={theme}>
      <Drawer
        screenOptions={{
          drawerPosition: 'left',
          drawerStyle: {
            width: 240,
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            title: '', // 不顯示標題
            drawerLabel: () => null, // 完全移除文字
            drawerIcon: ({ focused, size }) => (
              <Image
              source={{ uri: isDark 
                ? 'https://raw.githubusercontent.com/Freshyclam/riftbound/refs/heads/main/Riftbound_logo.png' 
                : 'https://raw.githubusercontent.com/Freshyclam/riftbound/refs/heads/main/Riftbound_logo.png' }}
              
                style={{ width: size * 5, height: size * 2 }}

                resizeMode="contain"
              />
            ),
          }}
        />


        <Drawer.Screen 
          name="Cardlist" 
          options={{ 
            drawerLabel: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="search" size={24} color={textColor} />
                <Text style={{ color: textColor, marginLeft: 8 }}>Card List</Text>
              </View>
            ) 
          }}
        />
        <Drawer.Screen 
          name="Builder" 
          options={{ 
            drawerLabel: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="cards-playing" size={24} color={textColor} />
                <Text style={{ color: textColor, marginLeft: 8 }}>Builder</Text>
              </View>
            ) 
          }} 
        />
        <Drawer.Screen 
          name="Topdeck" 
          options={{ 
            drawerLabel: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="bar-chart" size={24} color={textColor} />
                <Text style={{ color: textColor, marginLeft: 8 }}>Top Decks</Text>
              </View>
            ) 
          }} 
        />

        <Drawer.Screen 
          name="Others" 
          options={{ 
            drawerLabel: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="more-vert" size={24} color={textColor} />
                <Text style={{ color: textColor, marginLeft: 8 }}>Others</Text>
              </View>
            ) 
          }} 
        />
        
      </Drawer>
      {/*<StatusBar style="auto" />*/}
    </ThemeProvider>
  );
}
