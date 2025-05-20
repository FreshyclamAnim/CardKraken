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

import cardData from '../../assets/data/All_Data_EN.json';
import DropdownButton from '../DropdownButton';
import CardDetailModal from '../CardDetailModal';
import { FontAwesome, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';


// Constants
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const cardMargin = 3;

const colors = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow'];
const catalogOptions = [...new Set(cardData.map(card => card.card_catalog).filter(Boolean))];
const prefixPriority = [
  ...Array.from({ length: 99 }, (_, i) => `OP${String(99 - i).padStart(2, '0')}`),
  'EB',
  'PBR',
  'ST',
];



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



  // Chart Modal State
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);

  // Modal Visibility States
  const [isSeriesModalVisible, setIsSeriesModalVisible] = useState(false);
  const [isGetInfoModalVisible, setIsGetInfoModalVisible] = useState(false);
  const [isFeatureModalVisible, setIsFeatureModalVisible] = useState(false);
  const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);

  // Filter Options
  const costOptions = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  const seriesOptions = ['', ...[...new Set(cardData.map(card => card.series).filter(Boolean))].sort((a, b) => {
    const prefixOrder = { OP: 1, EB: 2, ST: 3, P: 4 };

    const parse = (s) => {
      const match = s.match(/([A-Z]+)(\d+)/);
      return match ? { prefix: match[1], number: parseInt(match[2]) } : { prefix: 'ZZZ', number: 0 };
    };

    const pa = parse(a);
    const pb = parse(b);

    const prefixCompare = (prefixOrder[pa.prefix] || 99) - (prefixOrder[pb.prefix] || 99);
    if (prefixCompare !== 0) return prefixCompare;

    return pb.number - pa.number; // bigger number first
  })];
  const getInfoOptions = ['', ...[...new Set(cardData.map(card => card.get_info).filter(Boolean))].sort((a, b) => a.localeCompare(b))];
  //const featureOptions = ['', ...[...new Set(cardData.map(card => card.feature).filter(Boolean))].sort((a, b) => a.localeCompare(b))];
  const featureOptions = [
    '',
    ...[...new Set(
      cardData
        .flatMap(card => (card.feature || '').split('/').map(f => f.trim()))
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b))
  ];
  
  const otherFilters = [
    'Blocker',
    'On Play',
    'Rush',
    'Main',
    'Once Per Turn',
    'Banish',
    'When Attacking',
    'Opponent\'s Turn',
    'On K.O.',
    'Your Turn',
    'End Of Your Turn',
    'On your Opponent\'s Attack',
    'Counter 1K',
    'Counter 2K',
    '-1000',
    '-2000',
    '-3000',
    '-4000',
    '-5000',
    '-6000',
    '-7000',
    '+1000',
    '+2000',
    '+3000',
    '+4000',
    '+5000',
    '+6000',
    '-1 cost',
    '-2 cost',
    '-3 cost',
    '-4 cost',
    '-5 cost',
    '-6 cost',
    '-7 cost',
    '+1 cost',
    '+2 cost',
    '+3 cost',
    '+4 cost',
    '+5 cost',
    '+6 cost',
    '+7 cost',

  ];
  const attributeFilters = ['Slash', 'Ranged', 'Wisdom', 'Strike', 'Special'];

  

  
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

  // Filter Logic
  const matchesSearch = (card) => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      String(card.id ?? '').toLowerCase().includes(searchLower) ||
      String(card.card_name ?? '').toLowerCase().includes(searchLower) ||
      String(card.life ?? '').toLowerCase().includes(searchLower) ||
      String(card.counter ?? '').toLowerCase().includes(searchLower) ||
      String(card.trigger ?? '').toLowerCase().includes(searchLower) ||
      String(card.power ?? '').toLowerCase().includes(searchLower) ||
      String(card.text ?? '').toLowerCase().includes(searchLower) ||
      String(card.attribute ?? '').toLowerCase().includes(searchLower) ||
      String(card.feature ?? '').toLowerCase().includes(searchLower) ||
      String(card.series ?? '').toLowerCase().includes(searchLower) ||
      String(card.get_info ?? '').toLowerCase().includes(searchLower) ||
      String(card.cost ?? '').toLowerCase().includes(searchLower)
    );
  };

  const matchesColorFilter = (card) => {
    if (selectedColors.length === 0) return true;
    const cardColors = (card.color || '').split('/').map(c => c.trim());
    return selectedColors.some(color => cardColors.includes(color));
  };

  const matchesCatalogFilter = (card) => {
    if (selectedCatalogs.length === 0) return true;
    return selectedCatalogs.includes(card.card_catalog);
  };

  const matchesCostFilter = (card) => {
    if (selectedCosts.length === 0) return true;
    const cost = String(card.life || '');
    return selectedCosts.includes(cost);
  };

  const matchesSeriesFilter = (card) => {
    if (!selectedSeries) return true;
    return card.series === selectedSeries;
  };

  const matchesGetInfoFilter = (card) => {
    if (!selectedGetInfo) return true;
    return card.get_info === selectedGetInfo;
  };

  const matchesFeatureFilter = (card) => {
    if (!selectedFeature) return true;
    const cardFeatures = (card.feature || '').split('/').map(f => f.trim());
    return cardFeatures.includes(selectedFeature);
  };

  const normalize = (str) =>
    str.replace(/[\u2013\u2212\u2014]/g, '-').toLowerCase(); // 換成標準減號
  
  const matchesOtherFilters = (card) => {
    if (selectedOthers.length === 0) return true;
  
    const text = normalize(String(card.text ?? ''));
    const counter = normalize(String(card.counter ?? ''));
  
    return selectedOthers.every(filter => {
      const filterLower = normalize(filter);
  
      if (filterLower === 'counter 1k') {
        return counter.includes('1000');
      }
      if (filterLower === 'counter 2k') {
        return counter.includes('2000');
      }
  
      return text.includes(filterLower) || text.includes(`[${filterLower}]`);
    });
  };

  const matchesAttributeFilters = (card) => {
    if (selectedAttributes.length === 0) return true;
    const attribute = String(card.attribute ?? '').toLowerCase();
    return selectedAttributes.some(attr => attribute.toLowerCase().includes(attr.toLowerCase()));
  };

  const filteredCards = useMemo(() => {
    return cardData
      .filter(
        card =>
          matchesSearch(card) &&
          matchesColorFilter(card) &&
          matchesCatalogFilter(card) &&
          matchesCostFilter(card) &&
          matchesSeriesFilter(card) &&
          matchesGetInfoFilter(card) &&
          matchesFeatureFilter(card) &&
          matchesOtherFilters(card) &&
          matchesAttributeFilters(card)
      )
      .sort(sortById);
  }, [
    searchText,
    selectedColors,
    selectedCatalogs,
    selectedCosts,
    selectedSeries,
    selectedGetInfo,
    selectedFeature,
    selectedOthers,
    selectedAttributes,
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
      <Image
        source={{ uri: item.image_url }}
        style={[styles.cardImage, { width: cardWidth }]}
        resizeMode="contain"
      />
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
            <Text style={[styles.clearFiltersText, { color: currentTheme.buttonText }]}><MaterialIcons name="refresh" size={16} color={currentTheme.text} /></Text>
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
            <Text style={[styles.themeButtonText, { color: currentTheme.text }]}>{theme === 'white' ? <MaterialIcons name="bedtime" size={16} color={currentTheme.text} /> : <MaterialIcons name="sunny" size={16} color={currentTheme.text} />}</Text>
        </TouchableOpacity>

        </View>
    </View>

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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableFilterContainer}>
            <View style={styles.colorFilterContainer}>
            {colors.map(color => (
                <TouchableOpacity
                key={color}
                style={[styles.filterButton, { borderColor: currentTheme.border, backgroundColor: selectedColors.includes(color) ? currentTheme.selectedButtonBackground : currentTheme.background }]}
                onPress={() => toggleColorFilter(color)}
                >
                <Text style={[styles.filterButtonText, { color: selectedColors.includes(color) ? currentTheme.selectedButtonText : currentTheme.text }]}>{color}</Text>
                </TouchableOpacity>
            ))}
            </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableFilterContainer}>
            <View style={styles.costFilterContainer}>
            {costOptions.map(cost => (
                <TouchableOpacity
                key={cost}
                style={[styles.filterButton, { borderColor: currentTheme.border, backgroundColor: selectedCosts.includes(cost) ? currentTheme.selectedButtonBackground : currentTheme.background }]}
                onPress={() => toggleCostFilter(cost)}
                >
                <Text style={[styles.filterButtonText, { color: selectedCosts.includes(cost) ? currentTheme.selectedButtonText : currentTheme.text }]}>{cost}</Text>
                </TouchableOpacity>
            ))}
            </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableFilterContainer}>
            <View style={styles.otherFilterContainer}>
            {otherFilters.map(filter => (
                <TouchableOpacity
                key={filter}
                style={[styles.filterButton, { borderColor: currentTheme.border, backgroundColor: selectedOthers.includes(filter) ? currentTheme.selectedButtonBackground : currentTheme.background }]}
                onPress={() => toggleOtherFilter(filter)}
                >
                <Text style={[styles.filterButtonText, { color: selectedOthers.includes(filter) ? currentTheme.selectedButtonText : currentTheme.text }]}>{filter}</Text>
                </TouchableOpacity>
            ))}
            </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableFilterContainer}>
            <View style={[styles.dropdownFilterContainer, { flexDirection: 'row' }]}>
                <DropdownButton
                label={selectedSeries || 'Series'}
                selected={!!selectedSeries}
                onPress={() => setIsSeriesModalVisible(true)}
                theme={theme}
                />
                <DropdownButton
                label={selectedGetInfo || 'Where to get'}
                selected={!!selectedGetInfo}
                onPress={() => setIsGetInfoModalVisible(true)}
                theme={theme}
                />
                <DropdownButton
                label={selectedFeature || 'Feature'}
                selected={!!selectedFeature}
                onPress={() => setIsFeatureModalVisible(true)}
                theme={theme}
                />
            </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableFilterContainer}>
            <View style={styles.attributeFilterContainer}>
            {attributeFilters.map(attr => (
                <TouchableOpacity
                key={attr}
                style={[styles.filterButton, { borderColor: currentTheme.border, backgroundColor: selectedAttributes.includes(attr) ? currentTheme.selectedButtonBackground : currentTheme.background }]}
                onPress={() => toggleAttributeFilter(attr)}
                >
                <Text style={[styles.filterButtonText, { color: selectedAttributes.includes(attr) ? currentTheme.selectedButtonText : currentTheme.text }]}>{attr}</Text>
                </TouchableOpacity>
            ))}
            </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableFilterContainer}>
            <View style={styles.catalogFilterContainer}>
            {catalogOptions.map(catalog => (
                <TouchableOpacity
                key={catalog}
                style={[styles.filterButton, { borderColor: currentTheme.border, backgroundColor: selectedCatalogs.includes(catalog) ? currentTheme.selectedButtonBackground : currentTheme.background }]}
                onPress={() => toggleCatalogFilter(catalog)}
                >
                <Text style={[styles.filterButtonText, { color: selectedCatalogs.includes(catalog) ? currentTheme.selectedButtonText : currentTheme.text }]}>{catalog}</Text>
                </TouchableOpacity>
            ))}
            </View>
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
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Name: </Text>{hoveredCard.card_name || '-'}
              </Text>
              <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>ID: </Text>{hoveredCard.id || '-'}
              </Text>
              <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Effect: </Text>{hoveredCard.text || '-'}
              </Text>
              <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Trigger: </Text>{hoveredCard.trigger || '-'}
              </Text>
              <Text style={[styles.tooltipText, { color: currentTheme.text }]}> 
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Feature: </Text>{hoveredCard.feature || '-'}
              </Text>
              <Text style={[styles.modalText, { color: currentTheme.text }]}>Long press for more detail</Text>
          </View>
          </View>
      )}

    {/* Google Ads (測試用 Banner) */}

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

      {/* Feature Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFeatureModalVisible}
        onRequestClose={() => setIsFeatureModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Feature</Text>
              <FlatList
                data={featureOptions}
                keyExtractor={item => item || 'default'}
                renderItem={({ item }) => renderOption({ item, onSelect: (value) => { setSelectedFeature(value); setIsFeatureModalVisible(false); }, currentValue: selectedFeature })}
              />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: currentTheme.deleteButton }]}
              onPress={() => setIsFeatureModalVisible(false)}
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
    aspectRatio: 0.7,
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