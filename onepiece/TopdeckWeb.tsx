// screens/TopdeckScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, Platform, Dimensions,ImageBackground,ScrollView,
  TouchableOpacity,
} from 'react-native';

import topdeckData from '../../assets/data/TopDeck_2025.json';
//import allCardData from '../../assets/data/All_Data_EN.json';
import { TextInput } from 'react-native'; // 確保有匯入
import { MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';




const screenWidth = Dimensions.get('window').width;

// Theme Definitions
const whiteTheme = {
  background: '#fff',
  text: '#000',
  secondaryText: '#333',
  border: '#ccc',
  buttonBackground: '#333',
  buttonText: '#fff',
  selectedButtonBackground: '#333',
  selectedButtonText: '#fff',
  saveButton: '#2196F3',
  clearButton: '#ff4444',
  genCodeButton: '#4CAF50',
  renameButton: '#FFA500',
  updateButton: '#4CAF50',
  deleteButton: '#ff4444',
  modalBackground: '#fff',
  modalText: '#333',
  modalButton: '#4CAF50',
  tooltipBackground: 'rgba(0, 0, 0, 0.9)',
  tooltipText: '#fff',
  tooltipLabel: 'orange',
  splitter: '#999',
  splitterBorder: '#666',
  cardCountBackground: 'red',
  chartLabel: '#000',
  chartValue: '#000',
};

const darkTheme = {
  background: '#121212',
  text: '#fff',
  secondaryText: '#ccc',
  border: '#444',
  buttonBackground: '#555',
  buttonText: '#fff',
  selectedButtonBackground: '#888',
  selectedButtonText: '#fff',
  saveButton: '#1976D2',
  clearButton: '#d32f2f',
  genCodeButton: '#388E3C',
  renameButton: '#F57C00',
  updateButton: '#388E3C',
  deleteButton: '#d32f2f',
  modalBackground: '#1e1e1e',
  modalText: '#fff',
  modalButton: '#388E3C',
  tooltipBackground: 'rgba(255, 255, 255, 0.9)',
  tooltipText: '#000',
  tooltipLabel: '#ff9800',
  splitter: '#444',
  splitterBorder: '#222',
  cardCountBackground: '#b71c1c',
  chartLabel: '#fff',
  chartValue: '#fff',
};



// 省略 import 與 theme 定義部分（你已經設定好）

export default function TopdeckScreen() {
  const [theme, setTheme] = useState<'white' | 'dark'>('dark');
  const currentTheme = theme === 'white' ? whiteTheme : darkTheme;

  const [topdeckList, setTopdeckList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);


  const [allCardData, setAllCardData] = useState([]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Freshyclam/OPTCGDB/refs/heads/main/All_Data_EN.json')
      .then(response => response.json())
      .then(data => setAllCardData(data))
      .catch(error => console.error('載入卡片資料失敗:', error));
  }, []);

  useEffect(() => {
    if (allCardData.length === 0) return; // 沒資料就不處理
  
    const enriched = topdeckData.map(deck => {
      const leaderCard = allCardData.find(card => card.id === deck.leaderID);
      return {
        ...deck,
        leaderImage: leaderCard?.image_url ?? '',
        leaderName: leaderCard?.card_name ?? '',
        leaderColor: leaderCard?.color ?? '',
      };
    });
    setTopdeckList(enriched);
    setFilteredList(enriched);
  }, [allCardData]);

  const [topdeckData, setTopdeckRaw] = useState([]);
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Freshyclam/OPTCGDB/refs/heads/main/TopDeck_2025.json')
      .then(response => response.json())
      .then(data => setTopdeckRaw(data))
      .catch(error => console.error('載入 Topdeck 資料失敗:', error));
  }, []);

  useEffect(() => {
    if (allCardData.length === 0 || topdeckData.length === 0) return;
  
    const enriched = topdeckData.map(deck => {
      const leaderCard = allCardData.find(card => card.id === deck.leaderID);
      return {
        ...deck,
        leaderImage: leaderCard?.image_url ?? '',
        leaderName: leaderCard?.card_name ?? '',
        leaderColor: leaderCard?.color ?? '',
      };
    });
    setTopdeckList(enriched);
    setFilteredList(enriched);
  }, [allCardData, topdeckData]);
  


  useEffect(() => {
    const enriched = topdeckData.map(deck => {
      const leaderCard = allCardData.find(card => card.id === deck.leaderID);
      return {
        ...deck,
        leaderImage: leaderCard?.image_url ?? '',
        leaderName: leaderCard?.card_name ?? '',
        leaderColor: leaderCard?.color ?? '',
      };
    });
    setTopdeckList(enriched);
    setFilteredList(enriched);
  }, []);

  useEffect(() => {
    const lower = searchText.toLowerCase();
    const result = topdeckList.filter(deck =>
      deck.leaderID.toLowerCase().includes(lower) ||
      deck.leaderName.toLowerCase().includes(lower) ||
      deck.deckOwner.toLowerCase().includes(lower) ||
      deck.deckDate.toLowerCase().includes(lower) ||
      deck.placement.toLowerCase().includes(lower) ||
      deck.deckColor.toLowerCase().includes(lower)
    );
    setFilteredList(result);
  }, [searchText, topdeckList]);

  const renderItem = ({ item, index }) => {
    const isHovered = hoveredIndex === index;
    return (
      <View
        style={[
          styles.deckItem,
          isHovered && styles.deckItemHover,
          { borderColor: currentTheme.border },
        ]}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        onTouchEnd={() => setSelectedDeck(item)}
        onClick={() => setSelectedDeck(item)}
      >
        <ImageBackground
          source={{ uri: item.leaderImage }}
          style={[styles.deckImage, isHovered && styles.deckImageHover]}
          imageStyle={styles.imageBackgroundStyle}
        >
          <View style={styles.overlay}>
            <Text style={[styles.deckOwner, { color: currentTheme.text }]}>{item.leaderName}</Text>
            <Text style={[styles.deckOwner, { color: currentTheme.text }]}>{item.deckOwner}</Text>
            <Text style={[styles.deckText, { color: currentTheme.text }]}>{item.placement}</Text>
            <Text style={[styles.deckText, { color: currentTheme.text }]}>{item.tournament}</Text>
            <Text style={[styles.deckText, { color: currentTheme.text }]}>{item.deckDate}</Text>
          </View>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={{ flexDirection:  'row' , width: '100%', height: '100%', backgroundColor: currentTheme.background }}>
      {/* 左邊 Topdeck List */}
      <View style={[styles.leftPanel, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, margin: 10 }}>
          <TextInput
            placeholder="Search..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={currentTheme.secondaryText}
            style={[
              styles.searchInput,
              {
                flex: 1,
                backgroundColor: currentTheme.background,
                color: currentTheme.text,
                borderColor: currentTheme.border,
                marginBottom: 0,
                fontSize: 20,
              },
            ]}
          />

          {/* Clean Button */}
          <TouchableOpacity
            onPress={() => setSearchText('')}
            style={{
              padding: 8,
              backgroundColor: currentTheme.buttonBackground,
              borderRadius: 6,
              minWidth: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[styles.themeButtonText, { color: currentTheme.text }]}><MaterialIcons name="refresh" size={16} color={currentTheme.text} /></Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTheme(theme === 'white' ? 'dark' : 'white')}
            style={{
              padding: 8,
              backgroundColor: currentTheme.buttonBackground,
              borderRadius: 6,
              minWidth: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[styles.themeButtonText, { color: currentTheme.text }]}>{theme === 'white' ? <MaterialIcons name="bedtime" size={16} color={currentTheme.text} /> : <MaterialIcons name="sunny" size={16} color={currentTheme.text} />}</Text>
          </TouchableOpacity>
        </View>

        
        

        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => `${item.deckName}_${index}`}
          renderItem={renderItem}
          numColumns={4}
          columnWrapperStyle={styles.deckRow}
        />
      </View>

      {/* 中間 Team List */}
      <View style={[styles.middlePanel, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Team List</Text>
        {selectedDeck && (
          <TouchableOpacity
            onPress={() => {
              const memberMap = {};
              const leaderLine = `1x${selectedDeck.leaderID.replace(/_p\d+$/i, '')}`;
          
              selectedDeck.members.forEach(card => {
                const cleanId = card.memberID.replace(/_p\d+$/i, '');
                memberMap[cleanId] = (memberMap[cleanId] || 0) + card.memberCount;
              });
          
              const sortedIds = Object.keys(memberMap).sort();
              const memberLines = sortedIds.map(id => `${memberMap[id]}x${id}`);
              const fullCode = [leaderLine, ...memberLines].join('\n');
          
              if (Platform.OS === 'web' && navigator.clipboard) {
                navigator.clipboard.writeText(fullCode)
                  .then(() => alert('📋 Copied Deck！'))
                  .catch(() => alert('❌ Fail to copy Deck Code'));
              } else {
                alert(fullCode);
              }
            }}
            style={{
              paddingVertical: 4,
              paddingHorizontal: 12,
              backgroundColor: currentTheme.genCodeButton,
              borderRadius: 6,
              marginLeft: 8,
            }}
          >
            <Text style={{ color: currentTheme.buttonText }}>Gen Code</Text>
          </TouchableOpacity>
        
        )}
      </View>

        {selectedDeck ? (
          <FlatList
            data={
              selectedDeck
                ? [
                    {
                      memberID: selectedDeck.leaderID,
                      memberCount: 1,
                      isLeader: true, // 加一個標記辨識
                    },
                    ...selectedDeck.members.map(m => ({ ...m, isLeader: false })),
                  ]
                : []
            }
            keyExtractor={(item, index) => `${item.memberID}_${index}`}
            numColumns={4}
            
            columnWrapperStyle={{ justifyContent: 'flex-start' }} 
            renderItem={({ item }) => {
              const cardInfo = allCardData.find(c => c.id === item.memberID);
              return (
                <TouchableOpacity
                  style={[styles.cardWithCount, { borderColor: currentTheme.border }]}
                  onPress={() => {
                    const cardData = allCardData.find(c => c.id === item.memberID);
                    setSelectedCard(cardData);
                  }}
                >
                  <Image
                    source={{ uri: cardInfo?.image_url }}
                    style={styles.cardImage}
                  />
                  <View style={[styles.countBadge, { backgroundColor: currentTheme.cardCountBackground }]}>
                    <Text style={styles.countText}>
                      {item.isLeader ? 'Leader' : item.memberCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        
        ) : (
          <Text style={{ fontStyle: 'italic', color: currentTheme.secondaryText }}>Select the deck from decklist</Text>
        )}
      </View>

      {/* 右邊 Detail 區塊 */}
      <View style={[styles.rightPanel, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>Detail</Text>
        {/* Google Ads (測試用 Banner) */}
        {Platform.OS === 'web' ? (
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            <iframe
              title="web-ads"
              style={{ width: 300, height: 50, border: 'none', overflow: 'hidden' }}
              src="https://your-adsense-code-or-test-ad-link"
            />
          </View>
        ) : (
          <AdMobBanner
            bannerSize="mediumRectangle"
            adUnitID="ca-app-pub-3940256099942544/6300978111" // 測試用 ID
            servePersonalizedAds
            onDidFailToReceiveAdWithError={(err) => console.log('Ad error', err)}
          />
        )}




        {selectedCard ? (
          <ScrollView>
            <Image
              source={{ uri: selectedCard.image_url }}
              style={{ width: '100%', height: 300, resizeMode: 'contain', marginBottom: 10 }}
            />
            <Text style={[styles.detailText, { color: currentTheme.text }]}><Text style={[styles.label, { color: currentTheme.text }]}>Name:</Text> {selectedCard.card_name}</Text>
            <Text style={[styles.detailText, { color: currentTheme.text }]}><Text style={[styles.label, { color: currentTheme.text }]}>ID:</Text> {selectedCard.id}</Text>
            <Text style={[styles.detailText, { color: currentTheme.text }]}><Text style={[styles.label, { color: currentTheme.text }]}>Cost:</Text> {selectedCard.memberCost ?? '-'}</Text>
            <Text style={[styles.detailText, { color: currentTheme.text }]}><Text style={[styles.label, { color: currentTheme.text }]}>Power:</Text> {selectedCard.power ?? '-'}</Text>
            <Text style={[styles.detailText, { color: currentTheme.text }]}><Text style={[styles.label, { color: currentTheme.text }]}>Attribute:</Text> {selectedCard.attribute}</Text>
            <Text style={[styles.detailText, { color: currentTheme.text }]}><Text style={[styles.label, { color: currentTheme.text }]}>Color:</Text> {selectedCard.color}</Text>
            <Text style={[styles.detailText, { color: currentTheme.text }]}><Text style={[styles.label, { color: currentTheme.text }]}>Text:</Text> {selectedCard.text}</Text>
            <Text style={[styles.detailText, { color: currentTheme.text }]}><Text style={[styles.label, { color: currentTheme.text }]}>Trigger:</Text> {selectedCard.trigger}</Text>
          </ScrollView>
        ) : (
          <Text style={{ fontStyle: 'italic', color: currentTheme.secondaryText }}> Detail</Text>
        )}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row' ,
    width: '100%',
    height: '100%',
    
  },
  
  leftPanel: {
    width: '40%' ,
    padding: 10,
    //backgroundColor: '#ffffff',
    
    borderRightWidth:  1 ,
    borderColor: '#ccc',
  },
  middlePanel: {
    width: '40%',
    padding: 10,
    
    borderRightWidth:1 ,
    borderColor: '#ccc',
  },
  rightPanel: {
    width: '20%',
    padding: 10,
    
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  
  deckRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deckItem: {
    width: '23%',
    aspectRatio: 0.7,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
    transitionDuration: '150ms',
    transform: [{ scale: 1 }],
  },
  
  deckItemHover: {
    zIndex: 10,
    transform: [{ scale: 1.08 }],
    boxShadow: '0px 4px 12px rgba(0,0,0,0.3)',
  },
  
  deckImageHover: {
    transform: [{ scale: 1.05 }],
  },
  
  
  deckImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end', // 文字放底部
  },
  
  imageBackgroundStyle: {
    resizeMode: 'cover',
  },
  
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
  },
  
  deckOwner: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  
  deckText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 10,
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#fff',
  },

  cardWithCount: {
    position: 'relative',
    width: '23%',
    aspectRatio: 0.7,
    marginBottom: 12,
    marginRight: 6,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#aaa',
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  // Teamlist的數字徽章
  countBadge: {
    position: 'absolute',
    bottom: 0, // ❗ 往下移
    right: 73,
    backgroundColor: 'red',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  countText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16, // ❗ 數字放大
  },

  detailText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 18,
  },
  
  label: {
    fontWeight: 'bold',
    color: '#333',
  },

  themeButtonText: {
    fontSize: 20,
  },
  
  

  
  
});
