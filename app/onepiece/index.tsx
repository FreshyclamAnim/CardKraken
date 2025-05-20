import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, SafeAreaView, Linking, useColorScheme } from 'react-native';

export default function HomeScreen() {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentTheme = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    border: isDark ? '#444' : '#eee',
    secondaryText: isDark ? '#aaa' : '#666',
    categoryText: isDark ? '#ccc' : '#888',
  };

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Freshyclam/OPTCGDB/refs/heads/main/OPTCG_News.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('HTTP status ' + response.status);
        }
        return response.json();
      })
      .then(data => {
        setNews(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('載入新聞資料失敗:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>News</Text>
      {isLoading ? (
        <Text style={{ padding: 16, color: currentTheme.text }}>Loading...</Text>
      ) : error ? (
        <Text style={{ padding: 16, color: 'red' }}>錯誤：{error}</Text>
      ) : (
        <FlatList
          data={news}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.newsItem, { borderColor: currentTheme.border }]}>
              <TouchableOpacity onPress={() => item.link && Linking.openURL(item.link)}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.newsImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>

              <View style={styles.newsText}>
                <Text style={[styles.newsCategory, { color: currentTheme.categoryText }]}>{item.category}</Text>
                <Text style={[styles.newsTitle, { color: currentTheme.text }]}>{item.title}</Text>
                <Text style={[styles.newsDate, { color: currentTheme.secondaryText }]}>📅 {item.date}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  newsItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
  },
  newsImage: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 8,
  },
  newsText: {
    flex: 1,
    justifyContent: 'center',
  },
  newsCategory: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 4,
  },
  newsDate: {
    fontSize: 12,
  },
});
