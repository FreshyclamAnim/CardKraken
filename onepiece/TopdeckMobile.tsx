import React, { useEffect, useState , useRef} from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, Modal, Dimensions, ScrollView,Platform,
} from 'react-native';
import topdeckData from '../../assets/data/TopDeck_2025.json';
import allCardData from '../../assets/data/All_Data_EN.json';

import { MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';





const screenWidth = Dimensions.get('window').width;

  // 獲取螢幕寬度
const cardMinWidth = 120; // 最小卡片寬度
const cardMargin = 8; // 卡片間距

const numColumnsForShare = 4;
const shareCardMargin = 5; // 卡片間距
const shareCardWidth = (screenWidth - shareCardMargin * 3 * numColumnsForShare) / numColumnsForShare;


export default function TopdeckMobileScreen() {

  const viewShotRef = useRef();

  const [theme, setTheme] = useState<'white' | 'dark'>('dark');
  const currentTheme = theme === 'white' ? whiteTheme : darkTheme;

  const [topdeckList, setTopdeckList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  

  



  // 動態計算每行幾張卡片, teamlist cardlist
  const numColumns = 3;
  const cardWidth = (screenWidth - cardMargin * 3 * numColumns) / numColumns;


  

  const [selectedCard, setSelectedCard] = useState(null);

  const sortById = (a, b) => {
    const getPrefix = (id) => {
      const match = id.match(/^(OP\d{2}|EB|PBR|ST)/i);
      return match ? match[0].toUpperCase() : '';
    };
  
    const getMainNumber = (id) => {
      const match = id.match(/(?:OP\d{2}|EB|PBR|ST)-(\d{3})/i);
      return match ? parseInt(match[1], 10) : 0;
    };
  
    const getSuffixNumber = (id) => {
      const match = id.match(/_p(\d+)/i);
      return match ? parseInt(match[1], 10) : -1;
    };
  
    const prefixPriority = [
      ...Array.from({ length: 99 }, (_, i) => `OP${String(99 - i).padStart(2, '0')}`),
      'EB', 'PBR', 'ST',
    ];
  
    const prefixA = getPrefix(a);
    const prefixB = getPrefix(b);
  
    if (prefixA !== prefixB) {
      const indexA = prefixPriority.indexOf(prefixA);
      const indexB = prefixPriority.indexOf(prefixB);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    }
  
    const mainNumberA = getMainNumber(a);
    const mainNumberB = getMainNumber(b);
    if (mainNumberA !== mainNumberB) {
      return mainNumberA - mainNumberB;
    }
  
    const suffixNumberA = getSuffixNumber(a);
    const suffixNumberB = getSuffixNumber(b);
    return suffixNumberA - suffixNumberB;
  };
  

  const generateTeamCode = async () => {
    if (!selectedDeck || !selectedDeck.members || selectedDeck.members.length === 0) {
      alert('No cards in the deck!');
      return;
    }
  
    const cardMap = {};
  
    selectedDeck.members.forEach(card => {
      const cleanId = card.memberID.replace(/_p\d+$/i, '');
      cardMap[cleanId] = (cardMap[cleanId] || 0) + card.memberCount;
    });
  
    const sortedIds = Object.keys(cardMap).sort(sortById);
    const memberCode = sortedIds.map(id => `${cardMap[id]}x${id}`).join('\n');

    // Leader ID + 卡片代碼
    const leaderCode = `1x${selectedDeck.leaderID}`;
    const fullCode = `${leaderCode}\n${memberCode}`;

    // ✅ 複製到剪貼簿
    await Clipboard.setStringAsync(fullCode);

    alert(`Deck Code copied to clipboard:\n${fullCode}`);
  };

  const shareCapturedImage = async () => {
    if (!viewShotRef.current) {
      alert('ViewShot reference is missing.');
      return;
    }
  
    try {
      const uri = await viewShotRef.current.capture();
      console.log('Captured URI:', uri);
  
      // 分享圖片
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Team List',
        UTI: 'public.png', // iOS 專用
      });
  
    } catch (error) {
      console.error('分享拼圖失敗:', error);
      alert('無法分享拼圖');
    }
  };
  



  useEffect(() => {
    const enriched = topdeckData.map(deck => {
      const leaderCard = allCardData.find(card => card.id === deck.leaderID);
      return {
        ...deck,
        leaderImage: leaderCard?.image_url ?? '',
        leaderName: leaderCard?.card_name ?? '',
      };
    });
    setTopdeckList(enriched);
    setFilteredList(enriched);
  }, []);

  useEffect(() => {
    const lower = searchText.toLowerCase();
    const result = topdeckList.filter(deck =>
      deck.leaderName.toLowerCase().includes(lower) ||
      deck.deckOwner.toLowerCase().includes(lower) ||
      deck.deckDate.toLowerCase().includes(lower) ||
      deck.placement.toLowerCase().includes(lower)||
      deck.deckColor.toLowerCase().includes(lower)||
      deck.leaderID.toLowerCase().includes(lower)||
      deck.deckFrom.toLowerCase().includes(lower)
    );
    setFilteredList(result);
  }, [searchText, topdeckList]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.deckItem, { borderColor: currentTheme.border }]}
      onPress={() => setSelectedDeck(item)}
    >
      <Image source={{ uri: item.leaderImage }} style={styles.deckImage} />
      <View style={styles.overlay}>
        <Text style={[styles.deckOwner, { color: currentTheme.text }]}>{item.leaderName}</Text>
        <Text style={[styles.deckOwner, { color: currentTheme.text }]}>{item.deckOwner}</Text>
        <Text style={[styles.deckText, { color: currentTheme.text }]}>{item.placement}</Text>
        <Text style={[styles.deckText, { color: currentTheme.text }]}>{item.deckDate}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={currentTheme.secondaryText}
          style={[styles.searchInput, { color: currentTheme.text, borderColor: currentTheme.border, backgroundColor: currentTheme.background }]}
        />
        <TouchableOpacity onPress={() => setSearchText('')}>
          <MaterialIcons name="refresh" size={18} color={currentTheme.text} />
        </TouchableOpacity>
      </View>

      {/* Topdeck List */}
      <FlatList
        data={filteredList}
        keyExtractor={(item, index) => `${item.deckName}_${index}`}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.deckRow}
      />

      {/* Team List Modal */}
      <Modal visible={!!selectedDeck} animationType="slide" transparent={false} onRequestClose={() => setSelectedDeck(null)}>
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
        
          <Text style={[styles.title, { color: currentTheme.text }]}>Deck List</Text>

          {/* Team List Scrollable Area */}
         
          <ScrollView contentContainerStyle={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20 }}>
            
            {/* Leader 卡片放最前 */}
            {selectedDeck && (() => {
              const leaderCard = allCardData.find(c => c.id === selectedDeck.leaderID);
              return (
                <TouchableOpacity
                  key={`leader_${selectedDeck.leaderID}`}
                  style={[styles.cardContainer, { width: cardWidth, borderColor: currentTheme.border, marginBottom: 12 }]}
                  onPress={() => setSelectedCard(leaderCard)}
                >
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: leaderCard?.image_url }} style={styles.cardImage} />
                    <View style={[styles.countOverlay, { backgroundColor: 'blue' }]}>
                      <Text style={styles.countText}>1</Text>
                    </View>
                  </View>
                  <Text style={{ color: currentTheme.text, textAlign: 'center', marginTop: 4 }}>{leaderCard?.id}</Text>
                </TouchableOpacity>
              );
            })()}

            {/* 其他 Members */}
            {selectedDeck?.members.map((item, index) => {
              const cardInfo = allCardData.find(c => c.id === item.memberID);
              return (
                <TouchableOpacity
                  key={`${item.memberID}_${index}`}
                  style={[styles.cardContainer, { width: cardWidth, borderColor: currentTheme.border, marginBottom: 12 }]}
                  onPress={() => setSelectedCard(cardInfo)}
                >
                  {/* 圖片區域 */}
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: cardInfo?.image_url }} style={styles.cardImage} />
                    <View style={styles.countOverlay}>
                      <Text style={styles.countText}>{item.memberCount}</Text>
                    </View>
                  </View>
                  {/* ID 文字 */}
                  <Text style={{ color: currentTheme.text, textAlign: 'center', marginTop: 4 }}>{cardInfo?.id}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>


          {/* 🔹 Fixed Buttons at Bottom 🔹 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
            {/* Close */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.deleteButton, flex: 1, marginHorizontal: 5 }]}
              onPress={() => setSelectedDeck(null)}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>

            {/* Gen Code */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.genCodeButton, flex: 1, marginHorizontal: 5 }]}
              onPress={generateTeamCode}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Gen Code</Text>
            </TouchableOpacity>

            {/* Share Image */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.saveButton, flex: 1, marginHorizontal: 5 }]}
              onPress={() => setScreenshotModalVisible(true)}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Share</Text>
            </TouchableOpacity>

          </View>

        </View>
      </Modal>




      {/* Card Detail Modal */}
      <Modal visible={!!selectedCard} animationType="slide" transparent onRequestClose={() => setSelectedCard(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBoxFixed, { backgroundColor: currentTheme.background }]}>

            {/* 🔹 Ads Placeholder 🔹 */}
            <View style={[styles.adsContainer, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.adsText, { color: currentTheme.text }]}>[Ad Placeholder]</Text>
            </View>

            {/* 圖片區（固定高度） */}
          

            {/* 卡片文字內容（可滾動） */}
            <View style={{ maxHeight: 500, marginTop: 5, width: '100%' }}>
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 20 }}>

              <Image
                source={{ uri: selectedCard?.image_url }}
                style={{
                  width: '100%',
                  height: 280,
                  resizeMode: 'contain',
                  borderRadius: 8,
                }}
                onError={(error) => console.log('Image Load Error:', error.nativeEvent.error)}
              />

                <Text style={[styles.modalTitle, { color: currentTheme.text, textAlign: 'center' }]}>{selectedCard?.card_name}</Text>
                <Text style={[styles.modalText, { color: currentTheme.text }]}>
                  <MaterialIcons name="numbers" color={currentTheme.text} /> Id: {selectedCard?.id}
                </Text>
                <Text style={[styles.modalText, { color: currentTheme.text }]}>
                  <MaterialIcons name="notes" color={currentTheme.text} /> Effect:
                </Text>
                <Text style={[styles.modalText, { color: currentTheme.text }]}>{selectedCard?.text}</Text>
                <Text style={[styles.modalText, { color: currentTheme.text }]}>
                  <MaterialIcons name="book" color={currentTheme.text} /> Feature:
                </Text>
                <Text style={[styles.modalText, { color: currentTheme.text }]}>{selectedCard?.feature}</Text>
                <Text style={[styles.modalText, { color: currentTheme.text }]}>
                  <MaterialIcons name="flash-on" color={currentTheme.text} /> Trigger: {selectedCard?.trigger}
                </Text>
                <Text style={[styles.modalText, { color: currentTheme.text }]}>
                  <MaterialIcons name="collections-bookmark" color={currentTheme.text} /> Card Set(s): {selectedCard?.get_info}
                </Text>
              </ScrollView>
            </View>

            {/* 關閉按鈕 */}
           
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.saveButton, height:50, marginHorizontal: 5 }]}
              onPress={() => setSelectedCard(null)}
              >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

  
  
      {/* Share Image Modal */}
      <Modal
        visible={screenshotModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setScreenshotModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background, flex: 1 }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Share Team List</Text>

          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0 }} captureMode="mount" style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'flex-start', paddingBottom: 20 }}>
              
              {/* Leader 卡片放最前 */}
              {selectedDeck && (() => {
                const leaderCard = allCardData.find(c => c.id === selectedDeck.leaderID);
                return (
                  <TouchableOpacity
                    key={`leader_${selectedDeck.leaderID}`}
                    style={[styles.shareCardContainer, { width: shareCardWidth, borderColor: currentTheme.border, marginBottom: 12 }]}
                    onPress={() => setSelectedCard(leaderCard)}
                  >
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: leaderCard?.image_url }} style={styles.shareCardImage} />
                      <View style={[styles.countOverlay, { backgroundColor: 'blue' }]}>
                        <Text style={styles.countText}>1</Text>
                      </View>
                    </View>
                    <Text style={{ color: currentTheme.text, textAlign: 'center', marginTop: 4 }}>{leaderCard?.id}</Text>
                  </TouchableOpacity>
                );
              })()}

              {/* 其他 Members */}
              {selectedDeck?.members.map((item, index) => {
                const cardInfo = allCardData.find(c => c.id === item.memberID);
                return (
                  <TouchableOpacity
                    key={`${item.memberID}_${index}`}
                    style={[styles.shareCardContainer, { width: shareCardWidth, borderColor: currentTheme.border, marginBottom: 12 }]}
                    onPress={() => setSelectedCard(cardInfo)}
                  >
                    {/* 圖片區域 */}
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: cardInfo?.image_url }} style={styles.cardImage} />
                      <View style={styles.countOverlay}>
                        <Text style={styles.countText}>{item.memberCount}</Text>
                      </View>
                    </View>
                    {/* ID 文字 */}
                    <Text style={{ color: currentTheme.text, textAlign: 'center', marginTop: 4 }}>{cardInfo?.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ViewShot>
            {/* 🔹 分享圖片的提示文字 */}        

          {/* 🔹 關閉與分享按鈕 🔹 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
            {/* Close */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.deleteButton, flex: 1, marginHorizontal: 5 }]}
              onPress={() => setScreenshotModalVisible(false)}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>

            {/* Share 拼圖 */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.saveButton, flex: 1, marginHorizontal: 5 }]}
              onPress={shareCapturedImage}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>



  
        {/* Ads Placeholder */}
        <View style={[styles.adsContainer, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.adsText, { color: currentTheme.text }]}>[Ad Placeholder]</Text>
        </View>



    </View>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 16,
    marginRight: 8,
  },
  deckRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  deckItem: {
    width: '48%',
    aspectRatio: 0.7,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  deckImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    width: '100%',
  },
  deckOwner: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  deckText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  cardContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    marginHorizontal: cardMargin,
  },
  shareCardContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    width:10,
    position: 'relative',
    marginHorizontal: shareCardMargin,
  },
  
  imageWrapper: {
    aspectRatio: 0.7,
    width: '100%',
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  shareCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  countOverlay: {
    position: 'absolute',
    top: 8,
    alignSelf: 'flex-end',
    backgroundColor: 'red',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBoxFixed: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 10,
    padding: 10,
  },
  adsContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adsText: {
    fontSize: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 18,
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
    marginTop: 10,
  },
  
 
  

});
