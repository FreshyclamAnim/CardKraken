//Riftbound_CardListWeb.tsx
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
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import cardData from '../../assets/data/riftbound_Data_EN.json';
// 在最上面和下面这些 import 同级位置，加入：
import imageMap from '../../assets/images/riftbound_images/FHD';
import PlaceholderImg from '../../assets/images/riftbound_images/Riftbound_Placeholder.webp';


import DropdownButton from '../DropdownButton';
import CardDetailModal from '../CardDetailModal';
import { FontAwesome, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';


// Constants
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const cardMargin = 3;

//placeholder card size
// 计算占位图宽高比
const placeholderRatio = Image.resolveAssetSource
  ? Image.resolveAssetSource(PlaceholderImg).height / Image.resolveAssetSource(PlaceholderImg).width
  : 390 / 280;


const colors = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'];
const catalogOptions = [...new Set(cardData.map(card => card.card_catalog).filter(Boolean))];
const prefixPriority = [
  ...Array.from({ length: 99 }, (_, i) => `OP${String(99 - i).padStart(2, '0')}`),
  'EB',
  'PBR',
  'ST',
];

function CardImage({ cardId, width }: { cardId: string; width: number }) {
  const source = imageMap[cardId] ?? PlaceholderImg;
  return (
    <Image
      source={source}
      style={{
        width,
        height: width * placeholderRatio,
        borderRadius: 6,
      }}
      resizeMode="contain"
    />
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

// Sort Function
const sortById = (a, b) => {
  const idA = typeof a === 'string' ? a : '';
  const idB = typeof b === 'string' ? b : '';

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

  const prefixA = getPrefix(idA);
  const prefixB = getPrefix(idB);

  if (prefixA !== prefixB) {
    const indexA = prefixPriority.indexOf(prefixA);
    const indexB = prefixPriority.indexOf(prefixB);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  }

  const mainNumberA = getMainNumber(idA);
  const mainNumberB = getMainNumber(idB);
  if (mainNumberA !== mainNumberB) {
    return mainNumberA - mainNumberB;
  }

  const suffixNumberA = getSuffixNumber(idA);
  const suffixNumberB = getSuffixNumber(idB);
  return suffixNumberA - suffixNumberB;
};


// Ads Component
const AdsSection = ({ theme }) => (
  <View style={[styles.adsContainer, { backgroundColor: theme.background }]}>
    <Text style={[styles.adsText, { color: theme.text }]}>Advertisement Placeholder</Text>
  </View>
);


export default function CardlistScreen() {
  // State Hooks
  
  const [searchText, setSearchText] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [selectedCosts, setSelectedCosts] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedGetInfo, setSelectedGetInfo] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [selectedOthers, setSelectedOthers] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [teamList, setTeamList] = useState([]);
  //const [numColumns, setNumColumns] = useState(8);
  const initialNumColumns = screenWidth >= 1200 ? 8 : screenWidth >= 800 ? 6 : 4;
  const [numColumns, setNumColumns] = useState(initialNumColumns);
  const [autoLayout, setAutoLayout] = useState(true); // ✅ 預設為 Auto 模式

  const [isBarChartVisible, setIsBarChartVisible] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [savedTeams, setSavedTeams] = useState([]);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [teamNameInput, setTeamNameInput] = useState('');
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [theme, setTheme] = useState('white');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [favorites, setFavorites] = useState([]);
  //Long press for card detail
  const [selectedCard, setSelectedCard] = useState(null);  // 詳細資訊用
  const [currentIndex, setCurrentIndex] = useState(0);     // 支援 Prev / Next

  //Layout State
  const [containerLayout, setContainerLayout] = useState({ width: screenWidth, height: screenHeight });


  // 新增这三行
  const [selectedGrades, setSelectedGrades]       = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes]         = useState<string[]>([]);




  // Chart Modal State
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);

  // Modal Visibility States
  const [isSeriesModalVisible, setIsSeriesModalVisible] = useState(false);
  const [isGetInfoModalVisible, setIsGetInfoModalVisible] = useState(false);
  const [isFeatureModalVisible, setIsFeatureModalVisible] = useState(false);
  const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);

  // Filter Options
  // 取出所有颜色、去重并拆分 Fury,Chaos 这种格式
  const colorOptions = [
    ...new Set(
      cardData
        .flatMap(c => (c.color || '').split(',').map(s => s.trim()))
        .filter(Boolean)
    )
  ];

  // 取出所有稀有度
  const gradeOptions = [...new Set(cardData.map(c => c.grade))];

  // 取出所有大类
  const categoryOptions = [...new Set(cardData.map(c => c.category))];

  // 取出所有阵营/类型，拆分多类型
  const typeOptions = [
    ...new Set(
      cardData
        .flatMap(c => (c.type || '').split(',').map(s => s.trim()))
        .filter(Boolean)
    )
  ];

  // 取出所有系列，并按你想要的顺序排序
  const seriesOptions = [
    '', 
    ...[...new Set(cardData.map(c => c.series).filter(Boolean))]
      .sort((a, b) => /* 自定义排序逻辑 */ 0)
  ];

  // 取出所有 getInfo 来源
  const getInfoOptions = [
    '', 
    ...[...new Set(cardData.map(c => c.getInfo).filter(Boolean))]
  ];


  

  
  useEffect(() => {
    const handleResize = ({ window }) => {
      if (autoLayout) {
        const width = window.width;
        if (width >= 1200) {
          setNumColumns(8);
        } else if (width >= 800) {
          setNumColumns(6);
        } else {
          setNumColumns(4);
        }
      }
    };
  
    const subscription = Dimensions.addEventListener('change', handleResize);
    return () => subscription?.remove();
  }, [autoLayout]);
  

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedTeams = await AsyncStorage.getItem('savedTeams');
        if (storedTeams) {
          setSavedTeams(JSON.parse(storedTeams));
        }
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme) {
          setTheme(storedTheme);
        }
      } catch (error) {
        console.error('Load Data Error:', error);
      }
    };
    loadData();
  }, []);

  
  // Theme Toggle
  const toggleTheme = async () => {
    const newTheme = theme === 'white' ? 'dark' : 'white';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('儲存主題失敗:', error);
    }
  };

  const currentTheme = theme === 'white' ? whiteTheme : darkTheme;

  // Layout Calculations
  const containerWidth = useMemo(() => {
    const listPadding = 12;
    return isBarChartVisible ? (containerLayout.width * 0.75) - listPadding * 2 : (containerLayout.width * 0.5) - listPadding * 2;
    
  }, [isBarChartVisible, containerLayout.width]);
  

  const cardWidth = useMemo(() => {
    const flatListPaddingLeft = 8;
    const flatListPaddingRight = 24;
    const flatListPadding = flatListPaddingLeft + flatListPaddingRight;
    const totalMargin = numColumns > 1 ? (numColumns - 1) * cardMargin * 2 : 0;
    const availableWidth = containerWidth - flatListPadding - totalMargin;
    return availableWidth / numColumns;
  }, [numColumns, containerWidth]);


  // at the top of your component, after `const [searchText, setSearchText] = useState('')`
const matchesSearch = card => {
  if (!searchText) return true;
  const q = searchText.toLowerCase();
  return (
    card.name.toLowerCase().includes(q) ||
    card.id.toLowerCase().includes(q) ||
    (card.effect || '').toLowerCase().includes(q) ||
    (card.subtitle || '').toLowerCase().includes(q)
  );
};


  // Filter Logic
  const matchesColor = card =>
    selectedColors.length === 0 ||
    card.color
      .split(',')
      .map(s => s.trim())
      .some(c => selectedColors.includes(c));
  
  const matchesGrade = card =>
    selectedGrades.length === 0 ||
    selectedGrades.includes(card.grade);
  
  const matchesCategory = card =>
    selectedCategories.length === 0 ||
    selectedCategories.includes(card.category);
  
  const matchesType = card =>
    selectedTypes.length === 0 ||
    card.type
      .split(',')
      .map(s => s.trim())
      .some(t => selectedTypes.includes(t));
  
  const matchesSeries = card =>
    !selectedSeries || card.series === selectedSeries;
  
  const matchesGetInfo = card =>
    !selectedGetInfo || card.getInfo === selectedGetInfo;
  

  const normalize = (str) =>
    str.replace(/[\u2013\u2212\u2014]/g, '-').toLowerCase(); // 換成標準減號
  


  const filteredCards = useMemo(() => {
    return cardData
      .filter(card =>
        matchesSearch(card) &&
        matchesColor(card) &&
        matchesGrade(card) &&
        matchesCategory(card) &&
        matchesType(card) &&
        matchesSeries(card) &&
        matchesGetInfo(card)
      )
      .sort(sortById);
  }, [
    searchText,
    selectedColors,
    selectedGrades,
    selectedCategories,
    selectedTypes,
    selectedSeries,
    selectedGetInfo,
  ]);
  

  //card detail left and right button
  useEffect(() => {
  
    const handleKeyDown = (e) => {
      if (!selectedCard) return;
  
      if (e.key === 'Escape') {
        setSelectedCard(null);
        setCurrentIndex(0);
      } else if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + filteredCards.length) % filteredCards.length;
        setSelectedCard(filteredCards[prevIndex]);
        setCurrentIndex(prevIndex);
      } else if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % filteredCards.length;
        setSelectedCard(filteredCards[nextIndex]);
        setCurrentIndex(nextIndex);
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard, currentIndex, filteredCards]);


  const getTotalCardCount = () => {
    return teamList.reduce((total, card) => total + (card.count || 0), 0);
  };


  // Event Handlers
  const handleMouseEnter = (card, event) => {
    if (Platform.OS === 'web') {
      setHoveredCard(card);
      setTooltipPosition({
        x: event.nativeEvent.pageX,
        y: event.nativeEvent.pageY,
      });
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setHoveredCard(null);
    }
  };

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedColors([]);
    setSelectedCatalogs([]);
    setSelectedCosts([]);
    setSelectedSeries('');
    setSelectedGetInfo('');
    setSelectedFeature('');
    setSelectedOthers([]);
    setSelectedAttributes([]);
  };

  const [hoveredIndex, setHoveredIndex] = useState(null);


  // Render Functions
  // Card Item
  const renderCard = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCard(item);
        setCurrentIndex(index);
      }}
      delayLongPress={300}
      style={[
        styles.cardContainer,
         { width: cardWidth },
         hoveredIndex === index && styles.hoverEffect,
        ]}
      onMouseEnter={(e) => {
        handleMouseEnter(item, e);     // Tooltip 功能 ✅
        setHoveredIndex(index);        // 動畫效果 ✅
      }}
      onMouseLeave={() => {
        handleMouseLeave();            // Tooltip 功能 ✅
        setHoveredIndex(null);         // 動畫結束 ✅
      }}
    >
      <Text>  </Text>
      <CardImage cardId={item.id} width={cardWidth} />



    </TouchableOpacity>
  );


  
  //Sare Image Function
  const shareImage = async () => {
      try {
        const fileUri = FileSystem.cacheDirectory + 'shared-card.jpg';
        const download = await FileSystem.downloadAsync(selectedCard.image_url, fileUri);
        if (!(await Sharing.isAvailableAsync())) {
          alert('Sharing is not available on this device');
          return;
        }
        await Sharing.shareAsync(download.uri);
      } catch (error) {
        console.error('分享圖片時發生錯誤:', error);
        alert('無法分享圖片');
      }
    };

  // Filter Toggle Functions
  const toggleColorFilter = (color) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(selectedColors.filter(c => c !== color));
    } else {
      setSelectedColors([...selectedColors, color]);
    }
  };

  const toggleCatalogFilter = (catalog) => {
    if (selectedCatalogs.includes(catalog)) {
      setSelectedCatalogs(selectedCatalogs.filter(c => c !== catalog));
    } else {
      setSelectedCatalogs([...selectedCatalogs, catalog]);
    }
  };

  const toggleCostFilter = (cost) => {
    if (selectedCosts.includes(cost)) {
      setSelectedCosts(selectedCosts.filter(c => c !== cost));
    } else {
      setSelectedCosts([...selectedCosts, cost]);
    }
  };

  const toggleOtherFilter = (filter) => {
    if (selectedOthers.includes(filter)) {
      setSelectedOthers(selectedOthers.filter(f => f !== filter));
    } else {
      setSelectedOthers([...selectedOthers, filter]);
    }
  };

  const toggleAttributeFilter = (attr) => {
    if (selectedAttributes.includes(attr)) {
      setSelectedAttributes(selectedAttributes.filter(a => a !== attr));
    } else {
      setSelectedAttributes([...selectedAttributes, attr]);
    }
  };

  const handleColumnChange = (columns) => {
    setNumColumns(columns);
  };

  // Render Modal Options
  const renderOption = ({ item, onSelect, currentValue }) => (
    <TouchableOpacity
      style={[
        styles.modalOption,
        {
          backgroundColor: item === currentValue ? currentTheme.selectedButtonBackground : currentTheme.modalBackground,
        },
      ]}
      onPress={() => onSelect(item)}
    >
      <Text
        style={[
          styles.modalOptionText,
          {
            color: item === currentValue ? currentTheme.selectedButtonText : currentTheme.modalText,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item || (onSelect === setSelectedSeries ? 'All Series' : onSelect === setSelectedGetInfo ? 'All' : onSelect === setSelectedFeature ? 'All feature' : 'Choose...')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: 'row' ,
          backgroundColor: currentTheme.background,
        },
      ]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerLayout({ width, height });
        if (autoLayout) {
          if (width >= 1200) setNumColumns(8);
          else if (width >= 800) setNumColumns(6);
          else setNumColumns(4);
        }
      }}
    >
    <>
    {/* CardList */}
    <View style={[styles.listContainer, { flex: 0.75 }]}>
    <View style={styles.searchContainer}>
        <TextInput
        placeholder="Search keywords..."
        value={searchText}
        onChangeText={setSearchText}
        style={[styles.searchBar, { borderColor: currentTheme.border, backgroundColor: currentTheme.background, color: currentTheme.text }]}
        placeholderTextColor={currentTheme.secondaryText}
        />
        {/*Clean filter */} 
        <TouchableOpacity
            style={[
            styles.clearFiltersButton,
            { borderColor: currentTheme.border, backgroundColor: currentTheme.background },
            ]}
            onPress={clearAllFilters}
        >
            <Text style={[styles.clearFiltersText, { color: currentTheme.buttonText }]}>🧹</Text>
        </TouchableOpacity>


        {/* Filter Options */}
        {/* Show Size Column */}
        
        
        <View style={styles.buttonGroup}>
        <TouchableOpacity
            style={[
            styles.columnButton,
            {
                borderColor: currentTheme.border,
                backgroundColor: !autoLayout && numColumns === 8 ? currentTheme.selectedButtonBackground : currentTheme.background,
            },
            ]}
            onPress={() => {
            setAutoLayout(false);
            setNumColumns(8);
            }}
        >
            <Text style={{ color: !autoLayout && numColumns === 8 ? currentTheme.selectedButtonText : currentTheme.text }}>S</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[
            styles.columnButton,
            {
                borderColor: currentTheme.border,
                backgroundColor: !autoLayout && numColumns === 6 ? currentTheme.selectedButtonBackground : currentTheme.background,
            },
            ]}
            onPress={() => {
            setAutoLayout(false);
            setNumColumns(6);
            }}
        >
            <Text style={{ color: !autoLayout && numColumns === 6 ? currentTheme.selectedButtonText : currentTheme.text }}>M</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[
            styles.columnButton,
            {
                borderColor: currentTheme.border,
                backgroundColor: !autoLayout && numColumns === 4 ? currentTheme.selectedButtonBackground : currentTheme.background,
            },
            ]}
            onPress={() => {
            setAutoLayout(false);
            setNumColumns(4);
            }}
        >
            <Text style={{ color: !autoLayout && numColumns === 4 ? currentTheme.selectedButtonText : currentTheme.text }}>L</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[
            styles.columnButton,
            {
                borderColor: currentTheme.border,
                backgroundColor: autoLayout ? currentTheme.selectedButtonBackground : currentTheme.background,
            },
            ]}
            onPress={() => setAutoLayout(true)}
        >
            <Text style={{ color: autoLayout ? currentTheme.selectedButtonText : currentTheme.text }}>Auto</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.themeButton, { borderColor: currentTheme.border, backgroundColor: currentTheme.background }]}
            onPress={toggleTheme}
        >
            <Text style={[styles.themeButtonText, { color: currentTheme.text }]}>{theme === 'white' ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>

        </View>
    </View>
    {/* Hide Filter Button}*/}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 }}>
        <TouchableOpacity onPress={() => setFiltersExpanded(!filtersExpanded)} style={styles.toggleFilterButton}>
        <Text style={[styles.toggleFilterText, { color: currentTheme.text }]}>
            {filtersExpanded ? 'Hide Filter ▲' : 'Advance Filter ▼'}
        </Text>
        </TouchableOpacity>

        <Text style={[styles.listTitle, { color: currentTheme.text }]}>
        Total {filteredCards.length} cards
        </Text>
    </View>


    {filtersExpanded && (
        <View>
        {/* 稀有度 */}
          <ScrollView horizontal>
            {gradeOptions.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.filterButton, selectedGrades.includes(g) && styles.selected]}
                onPress={() =>
                  setSelectedGrades(
                    selectedGrades.includes(g)
                      ? selectedGrades.filter(x => x !== g)
                      : [...selectedGrades, g]
                  )
                }
              >
                <Text>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 大类 */}
          <ScrollView horizontal>
            {categoryOptions.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.filterButton, selectedCategories.includes(c) && styles.selected]}
                onPress={() =>
                  setSelectedCategories(
                    selectedCategories.includes(c)
                      ? selectedCategories.filter(x => x !== c)
                      : [...selectedCategories, c]
                  )
                }
              >
                <Text>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 颜色 */}
          <ScrollView horizontal>
            {colorOptions.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.filterButton, selectedColors.includes(c) && styles.selected]}
                onPress={() =>
                  setSelectedColors(
                    selectedColors.includes(c)
                      ? selectedColors.filter(x => x !== c)
                      : [...selectedColors, c]
                  )
                }
              >
                <Text>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 阵营/类型 */}
          <ScrollView horizontal>
            {typeOptions.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.filterButton, selectedTypes.includes(t) && styles.selected]}
                onPress={() =>
                  setSelectedTypes(
                    selectedTypes.includes(t)
                      ? selectedTypes.filter(x => x !== t)
                      : [...selectedTypes, t]
                  )
                }
              >
                <Text>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
    )}

    <FlatList
        data={filteredCards}
        keyExtractor={item => item.id}
        renderItem={renderCard}
        numColumns={numColumns}
        key={`cardList-${numColumns}`}
        contentContainerStyle={[styles.list, { paddingRight:24  }]}
        initialNumToRender={20}
        windowSize={5}
    />
    </View>

    <View style={[styles.splitter, { backgroundColor: currentTheme.splitter, borderColor: currentTheme.splitterBorder }]} />

    {/* Hover */}
    <View style={[styles.listContainer, { flex:0.25,height: screenHeight }]}> 
    {/* Google Ads (測試用 Banner) */}
      <View style={{ alignItems: 'center', marginBottom: 10 }}>
      <iframe
          title="web-ads"
          style={{ width: 300, height: 50, border: 'none', overflow: 'hidden' }}
          src="https://your-adsense-code-or-test-ad-link"
      />
      </View>
    
        
    {hoveredCard && (
        <View style={{ flexDirection: 'column', padding: 8, backgroundColor: currentTheme.background, borderRadius: 8 }}>
        <Image
            source={{ uri: hoveredCard.image_url }}
            style={{ width: 280, height: 390, marginRight: 12, borderRadius: 4, }}
            resizeMode="contain"
        />
        <View style={{ flex: 0.4 }}>
            <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
            <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Name: </Text>{hoveredCard.name || '-'}
            </Text>
            <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
            <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>ID: </Text>{hoveredCard.id || '-'}
            </Text>

            <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
            <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Grade: </Text>{hoveredCard.grade || '-'}
            </Text>

            <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
            <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Effect: </Text>{hoveredCard.effect || '-'}
            </Text>
            
            <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
            <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Category: </Text>{hoveredCard.category || '-'}
            </Text>

            <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
            <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Power Cost: </Text>{hoveredCard.powerCost || '-'}
            </Text>

            <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
            <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Might: </Text>{hoveredCard.might || '-'}
            </Text>

            <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
            <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Feature: </Text>{hoveredCard.subtitle || '-'}
            </Text>
            <Text style={[styles.modalText, { color: currentTheme.text }]}>Long press for more detail</Text>
        </View>
        </View>
    )}

    {/* Google Ads (測試用 Banner) */}
    
    {/* Google Ads (測試用 Banner) 
    
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
        */}

    </View>
    </>

      {/* Series Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSeriesModalVisible}
        onRequestClose={() => setIsSeriesModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Series</Text>
              <FlatList
                data={seriesOptions}
                keyExtractor={item => item || 'default'}
                renderItem={({ item }) => renderOption({ item, onSelect: (value) => { setSelectedSeries(value); setIsSeriesModalVisible(false); }, currentValue: selectedSeries })}
              />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: currentTheme.deleteButton }]}
              onPress={() => setIsSeriesModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GetInfo Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isGetInfoModalVisible}
        onRequestClose={() => setIsGetInfoModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Get Info</Text>
              <FlatList
                data={getInfoOptions}
                keyExtractor={item => item || 'default'}
                renderItem={({ item }) => renderOption({ item, onSelect: (value) => { setSelectedGetInfo(value); setIsGetInfoModalVisible(false); }, currentValue: selectedGetInfo })}
              />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: currentTheme.deleteButton }]}
              onPress={() => setIsGetInfoModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Card Detail Modal */}
      <CardDetailModal
        visible={!!selectedCard}
        card={selectedCard}
        index={currentIndex}
        total={filteredCards.length}
        isFavorite={!!selectedCard && favorites.includes(selectedCard.id)}
        onPrev={() => {
          const prev = (currentIndex - 1 + filteredCards.length) % filteredCards.length;
          setCurrentIndex(prev);
          setSelectedCard(filteredCards[prev]);
        }}
        onNext={() => {
          const next = (currentIndex + 1) % filteredCards.length;
          setCurrentIndex(next);
          setSelectedCard(filteredCards[next]);
        }}
        onToggleFavorite={() => {
          if (!selectedCard) return;
          setFavorites(favs =>
            favs.includes(selectedCard.id)
              ? favs.filter(id => id !== selectedCard.id)
              : [...favs, selectedCard.id]
          );
        }}
        onShare={() => {
          if (selectedCard) {
            navigator.clipboard?.writeText(selectedCard.image_url);
          }
        }}
        onClose={() => {
          setSelectedCard(null);
          setCurrentIndex(0);
        }}
        theme={currentTheme}
      />



    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  listContainer: {
    paddingHorizontal: 8,
    position: 'relative',
  },
  barChartContainer: {
    paddingHorizontal: 4,
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
  splitter: {
    width: 5,
    backgroundColor: '#999',
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
  },
  verticalToggleButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalToggleButtonText: {
    fontSize: 14,
    writingDirection: 'vertical-rl',
    transform: [{ rotate: '180deg' }],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
  },
  searchBar: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginLeft: 4,
  },
  columnButtonText: {
    fontSize: 16,
  },
  themeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginLeft: 4,
  },
  themeButtonText: {
    fontSize: 20,
  },
  listTitle: {
    marginLeft: 12,
    marginBottom: 6,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 8,
  },
  cardContainer: {
    marginHorizontal: cardMargin,
  },
  cardImage: {
    borderRadius: 6,
  },
  teamCardContainer: {
    marginHorizontal: cardMargin,
    position: 'relative',
  },
  cardCount: {
    position: 'absolute',
    top: 5,
    right: 5,
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  filtersScrollView: {
    maxHeight: screenHeight * 0.3,
  },
  scrollableFilterContainer: {
    marginBottom: 16,
  },
  scrollableButtonContainer: {
    marginVertical: 8,
  },
  colorFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  costFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdown: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 5 ,
    marginHorizontal: 4 ,
    paddingHorizontal: 8,
  },
  otherFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // ✅ 加上這行
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4, // 可選，讓按鈕之間有間距
    maxWidth: 600 // 可選，限制容器的最大寬度,
  },
  
  attributeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  filterButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  filterButtonText: {
    fontSize: 14,
  },
  catalogFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  teamDetailContainer: {
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  chartRow: {
    marginVertical: 8,
  },
  chartWrapper: {
    marginBottom: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    width: '100%',
  },
  customChartContainer: {
    width: '100%',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    height: 20,
  },
  barLabel: {
    fontSize: 9,
    marginRight: 4,
    textAlign: 'right',
    width: 100,
    flexWrap: 'wrap',
  },
  
  barWrapper: {
    flex: 1,
    marginRight: 4,
  },
  bar: {
    height: 12,
    borderRadius: 4,
  },
  barValue: {
    fontSize: 10,
    marginLeft: 4,
    minWidth: 20,
  },
  teamListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  clearButtonText: {
    fontSize: 14,
  },
  genCodeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  genCodeButtonText: {
    fontSize: 14,
  },
  saveButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  saveButtonText: {
    fontSize: 14,
  },
  dropdownContainer: {
    marginHorizontal: 12,
    marginBottom: 8,
  },
  dropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  renameButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  renameButtonText: {
    fontSize: 14,
  },
  updateButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  updateButtonText: {
    fontSize: 14,
  },
  deleteButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  deleteButtonText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalTextContainer: {
    maxHeight: 300,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tooltip: {
    position: 'absolute',
    padding: 10,
    borderRadius: 8,
    maxWidth: 300,
    zIndex: 1000,
  },
  tooltipText: {
    fontSize: 14,
    marginBottom: 4,
  },
  tooltipLabel: {
    fontWeight: 'bold',
  },
  toggleFilterButton: {
    marginHorizontal: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  toggleFilterText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginLeft: 4,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  hoverEffect: {
    transform: [{ scale: 1.1 }],
    zIndex: 1,
    transition: 'transform 0.5s ease-in-out',
    boxShadow: '0 4px 12px rgba(0,0,0,1)',
  }
  

});