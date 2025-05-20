//CardListMobile.tsx

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  Platform,
  BackHandler,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cardData from '../../assets/data/All_Data_EN.json';
import { MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';




const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const cardMargin = 3;

const colors = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'];
const costOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const attributeFilters = ['Slash', 'Ranged', 'Wisdom', 'Strike', 'Special'];
const catalogOptions = [...new Set(cardData.map(card => card.card_catalog).filter(Boolean))];
const seriesOptions = ['', ...[...new Set(cardData.map(card => card.series).filter(Boolean))].sort()];
const getInfoOptions = ['', ...[...new Set(cardData.map(card => card.get_info).filter(Boolean))].sort()];
const featureOptions = ['', ...[...new Set(cardData.flatMap(card => (card.feature || '').split('/').map(f => f.trim())).filter(Boolean))].sort()];


const otherFilters = [
  'Blocker', 'On Play', 'Rush', 'Main', 'Once Per Turn', 'Banish', 'When Attacking',
  'Opponent\'s Turn', 'On K.O.', 'Your Turn', 'End Of Your Turn', 'On your Opponent\'s Attack',
  'Counter 1K', 'Counter 2K', '-1000', '-2000', '-3000', '-4000', '-5000', '-6000', '-7000',
  '+1000', '+2000', '+3000', '+4000', '+5000', '+6000', '-1 cost', '-2 cost', '-3 cost',
  '-4 cost', '-5 cost', '-6 cost', '-7 cost', '+1 cost', '+2 cost', '+3 cost', '+4 cost',
  '+5 cost', '+6 cost', '+7 cost'
];


const whiteTheme = {
  background: '#fff', text: '#000', border: '#ccc',
  selectedButtonBackground: '#333', selectedButtonText: '#fff',
};

const darkTheme = {
  background: '#121212', text: '#fff', border: '#444',
  selectedButtonBackground: '#888', selectedButtonText: '#fff',
};
// Ads Component
const AdsSection = ({ theme }) => (
  <View style={[styles.adsContainer, { backgroundColor: theme.background }]}>
    <Text style={[styles.adsText, { color: theme.text }]}>Advertisement Placeholder</Text>
  </View>
);

export default function CardlistMobile() {
  const [searchText, setSearchText] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedCosts, setSelectedCosts] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [theme, setTheme] = useState('white');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  // 新增狀態
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedGetInfo, setSelectedGetInfo] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [selectedOthers, setSelectedOthers] = useState([]);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [isSeriesModalVisible, setIsSeriesModalVisible] = useState(false);
  const [isGetInfoModalVisible, setIsGetInfoModalVisible] = useState(false);
  const [isFeatureModalVisible, setIsFeatureModalVisible] = useState(false);


  const currentTheme = theme === 'white' ? whiteTheme : darkTheme;
  const numColumns = screenWidth < 360 ? 3 : screenWidth < 480 ? 4 : 5;

  {/*Github json*/}
  const [cardData, setCardData] = useState([]);

  useEffect(() => {
    const loadCardData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/Freshyclam/OPTCGDB/main/All_Data_EN.json');
        const data = await response.json();
        setCardData(data);
      } catch (error) {
        console.error('Error loading card data:', error);
      }
    };

    loadCardData();
  }, []);



  useEffect(() => {
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('theme');
      if (saved) setTheme(saved);
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (selectedCard) {
        setSelectedCard(null); // ✅ 關閉 Modal
        return true; // ✅ 攔截返回
      }
      return false; // 👈 沒開 Modal 就不攔截
    };
  
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  
    return () => backHandler.remove(); // ✅ 清除 listener
  }, [selectedCard]);
  

  useFocusEffect(
    useMemo(() => {
      const onBackPress = () => {
        if (selectedCard) {
          setSelectedCard(null); // 👈 關掉 Modal
          return true; // ✅ 攔截返回事件
        }
        return false; // 👈 沒有選中卡片就讓返回繼續往下
      };
  
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
  
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [selectedCard])
  );
  

  const toggleTheme = async () => {
    const newTheme = theme === 'white' ? 'dark' : 'white';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const toggleItem = (item, setSelected, selectedList) => {
    setSelected(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const matchesSearch = (card) => {
    const searchLower = searchText.toLowerCase();
    return (
      card.card_name.toLowerCase().includes(searchLower) ||
      card.text.toLowerCase().includes(searchLower) ||
      card.life.toLowerCase().includes(searchLower) ||
      card.counter.toLowerCase().includes(searchLower) ||
      card.attribute.toLowerCase().includes(searchLower) ||
      card.card_catalog.toLowerCase().includes(searchLower) ||
      card.series.toLowerCase().includes(searchLower) ||
      card.get_info.toLowerCase().includes(searchLower) ||
      card.feature.toLowerCase().includes(searchLower) ||
      card.color.toLowerCase().includes(searchLower) ||
      card.id.toLowerCase().includes(searchLower)
    );
  };

  const matchesColor = (card) => {
    if (selectedColors.length === 0) return true;
    const cardColors = (card.color || '').split('/').map(c => c.trim());
    return selectedColors.some(c => cardColors.includes(c));
  };

  const matchesCost = (card) => {
    if (selectedCosts.length === 0) return true;
    return selectedCosts.includes(String(card.life || ''));
  };

  const matchesAttribute = (card) => {
    if (selectedAttributes.length === 0) return true;
    return selectedAttributes.some(attr => (card.attribute || '').toLowerCase().includes(attr.toLowerCase()));
  };

  const matchesCatalog = (card) => {
    if (selectedCatalogs.length === 0) return true;
    return selectedCatalogs.includes(card.card_catalog);
  };
  
  const matchesSeries = (card) => {
    if (!selectedSeries) return true;
    return card.series === selectedSeries;
  };
  
  const matchesGetInfo = (card) => {
    if (!selectedGetInfo) return true;
    return card.get_info === selectedGetInfo;
  };
  
  const matchesFeature = (card) => {
    if (!selectedFeature) return true;
    const cardFeatures = (card.feature || '').split('/').map(f => f.trim());
    return cardFeatures.includes(selectedFeature);
  };
  
  const normalize = (str) => str.replace(/[\u2013\u2212\u2014]/g, '-').toLowerCase();
  
  const matchesOther = (card) => {
    if (selectedOthers.length === 0) return true;
    const text = normalize(String(card.text || ''));
    const counter = normalize(String(card.counter || ''));
    return selectedOthers.every(filter => {
      const filterLower = normalize(filter);
      if (filterLower === 'counter 1k') return counter.includes('1000');
      if (filterLower === 'counter 2k') return counter.includes('2000');
      return text.includes(filterLower) || text.includes(`[${filterLower}]`);
    });
  };


  const filteredCards = useMemo(() => {
    return cardData.filter(card =>
      matchesSearch(card) &&
      matchesColor(card) &&
      matchesCost(card) &&
      matchesAttribute(card) &&
      matchesCatalog(card) &&
      matchesSeries(card) &&
      matchesGetInfo(card) &&
      matchesFeature(card) &&
      matchesOther(card)
    );
  }, [
    cardData,
    searchText,
    selectedColors,
    selectedCosts,
    selectedAttributes,
    selectedCatalogs,
    selectedSeries,
    selectedGetInfo,
    selectedFeature,
    selectedOthers
  ]);

  const renderCard = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCard(item);
        setCurrentIndex(index);
      }}
      style={[styles.cardContainer, { width: cardWidth }]}
    >
      <Image source={{ uri: item.image_url }} style={[styles.cardImage]} resizeMode="contain" />
    </TouchableOpacity>
  );

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedColors([]);
    setSelectedCosts([]);
    setSelectedAttributes([]);
    setSelectedCatalogs([]);
    setSelectedSeries('');
    setSelectedGetInfo('');
    setSelectedFeature('');
    setSelectedOthers([]);
  };

  const cardWidth = (screenWidth - cardMargin * 2 * numColumns - 16) / numColumns;

  return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search..."
            value={searchText}
            onChangeText={setSearchText}
            style={[styles.searchBar, { color: currentTheme.text, borderColor: currentTheme.border }]}
            placeholderTextColor={currentTheme.text}
          />
          <TouchableOpacity
            onPress={clearAllFilters}
            style={[styles.clearFiltersButton, { borderColor: currentTheme.border }]}
          >
            <MaterialIcons name="refresh" size={18} color={currentTheme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={{ color: currentTheme.text }}>{theme === 'white' ? 
              <MaterialIcons name="dark-mode" size={18} color={currentTheme.text} /> :
               <MaterialIcons name="light-mode" size={18} color={currentTheme.text} />}</Text>
          </TouchableOpacity>
        </View>
    
        <TouchableOpacity
          onPress={() => setFiltersExpanded(!filtersExpanded)}
          style={styles.toggleFilterButton}
        >
          <Text style={{ color: currentTheme.text }}>
            {filtersExpanded ? 'Hide Filter ▲' : 'Advance Filter ▼'}
          </Text>
        </TouchableOpacity>
    
        {filtersExpanded && (
          <View>
            {/* 現有篩選：Color */}
            <Text style={[styles.modalSectionTitle, { color: currentTheme.text }]}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {colors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[styles.filterButton, {
                    backgroundColor: selectedColors.includes(color) ? currentTheme.selectedButtonBackground : currentTheme.background,
                    borderColor: currentTheme.border
                  }]}
                  onPress={() => toggleItem(color, setSelectedColors, selectedColors)}
                >
                  <Text style={{ color: selectedColors.includes(color) ? currentTheme.selectedButtonText : currentTheme.text }}>{color}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
    
            {/* 現有篩選：Cost */}
            <Text style={[styles.modalSectionTitle, { color: currentTheme.text }]}>Cost</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {costOptions.map(cost => (
                <TouchableOpacity
                  key={cost}
                  style={[styles.filterButton, {
                    backgroundColor: selectedCosts.includes(cost) ? currentTheme.selectedButtonBackground : currentTheme.background,
                    borderColor: currentTheme.border
                  }]}
                  onPress={() => toggleItem(cost, setSelectedCosts, selectedCosts)}
                >
                  <Text style={{ color: selectedCosts.includes(cost) ? currentTheme.selectedButtonText : currentTheme.text }}>{cost}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
    
            {/* 新增篩選：Catalog */}
            <Text style={[styles.modalSectionTitle, { color: currentTheme.text }]}>Catalog</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {catalogOptions.map(catalog => (
                <TouchableOpacity
                  key={catalog}
                  style={[styles.filterButton, {
                    backgroundColor: selectedCatalogs.includes(catalog) ? currentTheme.selectedButtonBackground : currentTheme.background,
                    borderColor: currentTheme.border
                  }]}
                  onPress={() => toggleItem(catalog, setSelectedCatalogs, selectedCatalogs)}
                >
                  <Text style={{ color: selectedCatalogs.includes(catalog) ? currentTheme.selectedButtonText : currentTheme.text }}>{catalog}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
    
            {/* 新增篩選：Other Filters */}
            <Text style={[styles.modalSectionTitle, { color: currentTheme.text }]}>Other Filters</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {otherFilters.map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterButton, {
                    backgroundColor: selectedOthers.includes(filter) ? currentTheme.selectedButtonBackground : currentTheme.background,
                    borderColor: currentTheme.border
                  }]}
                  onPress={() => toggleItem(filter, setSelectedOthers, selectedOthers)}
                >
                  <Text style={{ color: selectedOthers.includes(filter) ? currentTheme.selectedButtonText : currentTheme.text }}>{filter}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
    
            {/* 新增下拉選單：Series, Get Info, Feature */}
            <Text style={[styles.modalSectionTitle, { color: currentTheme.text }]}>Advanced Filters</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <TouchableOpacity
                style={[styles.dropdownButton, { borderColor: currentTheme.border }]}
                onPress={() => setIsSeriesModalVisible(true)}
              >
                <Text style={{ color: currentTheme.text }}>{selectedSeries || 'Series'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownButton, { borderColor: currentTheme.border }]}
                onPress={() => setIsGetInfoModalVisible(true)}
              >
                <Text style={{ color: currentTheme.text }}>{selectedGetInfo || 'Where to Get'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownButton, { borderColor: currentTheme.border }]}
                onPress={() => setIsFeatureModalVisible(true)}
              >
                <Text style={{ color: currentTheme.text }}>{selectedFeature || 'Feature'}</Text>
              </TouchableOpacity>
            </View>
    
            {/* 現有篩選：Attribute */}
            <Text style={[styles.modalSectionTitle, { color: currentTheme.text }]}>Attribute</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {attributeFilters.map(attr => (
                <TouchableOpacity
                  key={attr}
                  style={[styles.filterButton, {
                    backgroundColor: selectedAttributes.includes(attr) ? currentTheme.selectedButtonBackground : currentTheme.background,
                    borderColor: currentTheme.border
                  }]}
                  onPress={() => toggleItem(attr, setSelectedAttributes, selectedAttributes)}
                >
                  <Text style={{ color: selectedAttributes.includes(attr) ? currentTheme.selectedButtonText : currentTheme.text }}>{attr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
    
        {/* 現有 FlatList */}
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          numColumns={numColumns}
          contentContainerStyle={styles.cardList}
        />

        {/* 🔹 Ads Placeholder 🔹 */}
        <View style={[styles.adsContainer, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.adsText, { color: currentTheme.text }]}>[Ad Placeholder]</Text>
        </View>
    
        {/* 現有卡片詳情 Modal */}
        <Modal visible={!!selectedCard} animationType="slide" transparent onRequestClose={() => setSelectedCard(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBoxFixed, { backgroundColor: currentTheme.background }]}>

              {/* 🔹 Ads Placeholder 加在這裡 🔹 */}
              <View style={[styles.adsContainer, { backgroundColor: currentTheme.background }]}>
                <Text style={[styles.adsText, { color: currentTheme.text }]}>[Ad Placeholder]</Text>
              </View>


              {/* 2. 卡片文字內容（可滾動） */}
              <View style={{ maxHeight: 500, marginTop: 5, width: '100%' }}>
                <ScrollView style={{ width: '100%' ,marginTop: 5}}>
                  <View style={{ width: '100%', height: 300, flexDirection: 'row', alignItems: 'center' }}>
                    {/* 左箭頭 */}
                    <TouchableOpacity
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => {
                        if (currentIndex > 0) {
                          const prevIndex = currentIndex - 1;
                          setCurrentIndex(prevIndex);
                          setSelectedCard(filteredCards[prevIndex]);
                        }
                      }}
                      disabled={currentIndex === 0}
                    >
                      <Text style={{ fontSize: 32, color: currentIndex === 0 ? 'transparent' : currentTheme.text }}>{'‹'}</Text>
                    </TouchableOpacity>

                    {/* 圖片 */}
                    <View style={{
                        width: '81%',
                        height: 300,
                        //backgroundColor: '#222', // 可見背景測試空間
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {selectedCard?.image_url ? (
                          <Image
                            source={{ uri: selectedCard.image_url }}
                            style={{
                              width: '100%',       // 避免擠滿
                              height: '100%',
                              resizeMode: 'contain',
                              borderRadius: 8,
                              backgroundColor: '#000', // 看圖片範圍
                            }}
                            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                          />
                        ) : (
                          <Text style={{ color: 'white' }}>No Image</Text>
                        )}
                      </View>


                    {/* 右箭頭 */}
                    <TouchableOpacity
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => {
                        if (currentIndex < filteredCards.length - 1) {
                          const nextIndex = currentIndex + 1;
                          setCurrentIndex(nextIndex);
                          setSelectedCard(filteredCards[nextIndex]);
                        }
                      }}
                      disabled={currentIndex === filteredCards.length - 1}
                    >
                      <Text style={{ fontSize: 32, color: currentIndex === filteredCards.length - 1 ? 'transparent' : currentTheme.text }}>{'›'}</Text>
                    </TouchableOpacity>
                  </View>
                      <Text> </Text>
                      
                      <Text style={[styles.modalTitle,{ color: currentTheme.text, marginTop: 10  }]}>{selectedCard?.card_name}</Text>
                      <Text style={[styles.modalText, { color: currentTheme.text }]}><MaterialIcons name="numbers" color={currentTheme.text} /> Id: {selectedCard?.id} </Text> 
                      <Text style={[styles.modalText, { color: currentTheme.text }]}><MaterialIcons name="notes" color={currentTheme.text} /> Effect:</Text>
                      <Text style={[styles.modalText, { color: currentTheme.text }]}> {selectedCard?.text}</Text>
                      <Text style={[styles.modalText, { color: currentTheme.text }]}><MaterialIcons name="book" color={currentTheme.text} /> Feature:</Text>
                      <Text style={[styles.modalText, { color: currentTheme.text }]}>{selectedCard?.feature}</Text> 
                      <Text style={[styles.modalText, { color: currentTheme.text }]}><MaterialIcons name="flash-on" color={currentTheme.text} /> Trigger: {selectedCard?.trigger}</Text>
                      <Text style={styles.modalText}><MaterialIcons name="collections-bookmark" /> Card Set(s): {selectedCard?.get_info}</Text>
                </ScrollView>
              </View>
              

              {/* 關閉按鈕 */}
              <TouchableOpacity onPress={() => setSelectedCard(null)} style={styles.closeButton}>
                <Text style={{ color: currentTheme.text }}>Close</Text>
              </TouchableOpacity>
              

            </View>
          </View>
        </Modal>



    
        {/* 新增下拉選單 Modal */}
        {/* Series Modal */}
        <Modal visible={isSeriesModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Select Series</Text>
              <FlatList
                data={seriesOptions}
                keyExtractor={item => item || 'default'}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalOption, {
                      backgroundColor: item === selectedSeries ? currentTheme.selectedButtonBackground : currentTheme.background
                    }]}
                    onPress={() => {
                      setSelectedSeries(item);
                      setIsSeriesModalVisible(false);
                    }}
                  >
                    <Text style={{ color: item === selectedSeries ? currentTheme.selectedButtonText : currentTheme.text }}>
                      {item || 'All Series'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                onPress={() => setIsSeriesModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={{ color: currentTheme.text }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    
        {/* Get Info Modal */}
        <Modal visible={isGetInfoModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Select Get Info</Text>
              <FlatList
                data={getInfoOptions}
                keyExtractor={item => item || 'default'}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalOption, {
                      backgroundColor: item === selectedGetInfo ? currentTheme.selectedButtonBackground : currentTheme.background
                    }]}
                    onPress={() => {
                      setSelectedGetInfo(item);
                      setIsGetInfoModalVisible(false);
                    }}
                  >
                    <Text style={{ color: item === selectedGetInfo ? currentTheme.selectedButtonText : currentTheme.text }}>
                      {item || 'All'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                onPress={() => setIsGetInfoModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={{ color: currentTheme.text }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    
        {/* Feature Modal */}
        <Modal visible={isFeatureModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Select Feature</Text>
              <FlatList
                data={featureOptions}
                keyExtractor={item => item || 'default'}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.modalOption, {
                      backgroundColor: item === selectedFeature ? currentTheme.selectedButtonBackground : currentTheme.background
                    }]}
                    onPress={() => {
                      setSelectedFeature(item);
                      setIsFeatureModalVisible(false);
                    }}
                  >
                    <Text style={{ color: item === selectedFeature ? currentTheme.selectedButtonText : currentTheme.text }}>
                      {item || 'All Features'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                onPress={() => setIsFeatureModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={{ color: currentTheme.text }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
    
        {/* 現有篩選 Modal */}
        <Modal visible={isFilterModalVisible} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { backgroundColor: currentTheme.background }]}>
              <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Filters</Text>
              {/* 保留現有篩選內容 */}
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} style={styles.closeButton}>
                <Text style={{ color: currentTheme.text }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  searchContainer: { flexDirection: 'row', marginBottom: 8 },
  searchBar: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 40,
  },
  themeToggle: { marginLeft: 8, justifyContent: 'center' },
  filterToggle: { alignSelf: 'flex-start', marginBottom: 12 },
  filterButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  cardContainer: { margin: cardMargin },
  cardImage: { aspectRatio: 0.7, borderRadius: 4, width: '100%' },
  cardList: { paddingBottom: 80 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '90%',
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center'
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'left',
    alignSelf: 'flex-start'
  },
  modalText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'left', // ✅ 改為置左
    alignSelf: 'stretch', // ✅ 確保整段文字寬度撐滿 ScrollView 寬度
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#ccc',
    marginTop: 16,
    alignSelf: 'center'
  },
  clearFiltersButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  toggleFilterButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  dropdownButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  modalOption: {
    padding: 10,
    borderRadius: 4,
    marginVertical: 2,
  },
  modalBoxFixed: {
    width: '90%',
    height: screenHeight * 0.85, // 👈 建議 85%
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  adsContainer: {
    height: screenHeight * 0.05,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  adsText: {
    fontSize: 14,
  },
  
  
});
