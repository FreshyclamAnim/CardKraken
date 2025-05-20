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
import { FontAwesome, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';


// Constants
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const cardMargin = 3;
const isWeb = Platform.OS === 'web' && screenWidth >= 600;
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

// TeamDetail Component
const TeamDetail = ({ teamList, theme }) => {
  const lifeData = useMemo(() => {
    const lifeMap = {};
    teamList.forEach(card => {
      const life = String(card.life || '-').trim();
      lifeMap[life] = (lifeMap[life] || 0) + card.count;
    });
    const lives = Object.keys(lifeMap).sort();
    return {
      labels: lives,
      data: lives.map(life => lifeMap[life]),
    };
  }, [teamList]);

  const powerData = useMemo(() => {
    const powerMap = {};
    teamList.forEach(card => {
      const power = parseInt(card.power, 10) || 0;
      powerMap[power] = (powerMap[power] || 0) + card.count;
    });
    const powers = Object.keys(powerMap).map(Number).sort((a, b) => a - b);
    return {
      labels: powers.map(String),
      data: powers.map(power => powerMap[power]),
    };
  }, [teamList]);

  const counterData = useMemo(() => {
    const counterMap = {};
    teamList.forEach(card => {
      const counter = parseInt(card.counter, 10) || 0;
      counterMap[counter] = (counterMap[counter] || 0) + card.count;
    });
    const counters = Object.keys(counterMap).map(Number).sort((a, b) => a - b);
    return {
      labels: counters.map(String),
      data: counters.map(counter => counterMap[counter]),
    };
  }, [teamList]);

  const attributeData = useMemo(() => {
    const attributeMap = {};
    teamList.forEach(card => {
      const attribute = card.attribute || 'None';
      attributeMap[attribute] = (attributeMap[attribute] || 0) + card.count;
    });
    const attributes = Object.keys(attributeMap).sort();
    return {
      labels: attributes,
      data: attributes.map(attr => attributeMap[attr]),
    };
  }, [teamList]);

  const triggerData = useMemo(() => {
    let noTriggerCount = 0;
    let hasTriggerCount = 0;

    teamList.forEach(card => {
      const trigger = card.trigger || '-';
      if (trigger === '-') {
        noTriggerCount += card.count;
      } else {
        hasTriggerCount += card.count;
      }
    });

    return {
      labels: ['No Trigger', 'Has Trigger'],
      data: [noTriggerCount, hasTriggerCount],
    };
  }, [teamList]);

  const featureData = useMemo(() => {
    const featureMap = {};
    teamList.forEach(card => {
      const feature = card.feature || 'None';
      featureMap[feature] = (featureMap[feature] || 0) + card.count;
    });
    const features = Object.keys(featureMap).sort();
    return {
      labels: features,
      data: features.map(feat => featureMap[feat]),
    };
  }, [teamList]);

  const chartWidth = isWeb ? Math.min(screenWidth / 3, 300) : (screenWidth - 24);

  const HorizontalBarChart = ({ title, data, labels, barColor }) => (
    <View style={[styles.chartWrapper, { width: chartWidth }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={styles.customChartContainer}>
        {labels.map((label, index) => (
          <View key={label} style={styles.barContainer}>
            <Text style={[styles.barLabel, { color: theme.chartLabel }]}>{label}</Text>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  { width: data[index] * 5, backgroundColor: barColor },
                ]}
              />
            </View>
            <Text style={[styles.barValue, { color: theme.chartValue }]}>{data[index]}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={[styles.teamDetailContainer, { backgroundColor: theme.background }]}>
      <View style={styles.chartRow}>
        <HorizontalBarChart
          title="Life"
          data={lifeData.data}
          labels={lifeData.labels}
          barColor="rgba(0, 123, 255, 0.8)"
        />
      </View>
      <View style={styles.chartRow}>
        <HorizontalBarChart
          title="Power"
          data={powerData.data}
          labels={powerData.labels}
          barColor="rgba(255, 99, 132, 0.8)"
        />
      </View>
      <View style={styles.chartRow}>
        <HorizontalBarChart
          title="Counter"
          data={counterData.data}
          labels={counterData.labels}
          barColor="rgba(75, 192, 192, 0.8)"
        />
      </View>
      <View style={styles.chartRow}>
        <HorizontalBarChart
          title="Attribute"
          data={attributeData.data}
          labels={attributeData.labels}
          barColor="rgba(255, 206, 86, 0.8)"
        />
      </View>
      <View style={styles.chartRow}>
        <HorizontalBarChart
          title="Trigger"
          data={triggerData.data}
          labels={triggerData.labels}
          barColor="rgba(153, 102, 255, 0.8)"
        />
      </View>
      <View style={styles.chartRow}>
        <HorizontalBarChart
          title="Feature"
          data={featureData.data}
          labels={featureData.labels}
          barColor="rgba(255, 159, 64, 0.8)"
        />
      </View>
    </ScrollView>
  );
};

// Ads Component
const AdsSection = ({ theme }) => (
  <View style={[styles.adsContainer, { backgroundColor: theme.background }]}>
    <Text style={[styles.adsText, { color: theme.text }]}>Advertisement Placeholder</Text>
  </View>
);

const shareImage = async () => {
  if (!selectedCard?.image_url) return;

  const uri = selectedCard.image_url;
  const filename = uri.split('/').pop();
  const fileUri = FileSystem.cacheDirectory + filename;

  const downloadResumable = FileSystem.createDownloadResumable(uri, fileUri);
  try {
    await downloadResumable.downloadAsync();
    await Sharing.shareAsync(fileUri);
  } catch (error) {
    console.error('分享失敗:', error);
  }
};

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

  //Import deck state
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');

  

  
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
        console.error('載入數據失敗:', error);
      }
    };
    loadData();
  }, []);

  // Generate Team Code
  useEffect(() => {
    if (teamList.length > 0) {
      const cardMap = {};
      teamList.forEach(card => {
        if (!card || !card.id || typeof card.id !== 'string') return;
        const cleanId = card.id.replace(/_p\d+$/i, '');
        cardMap[cleanId] = (cardMap[cleanId] || 0) + card.count;
      });
      const sortedIds = Object.keys(cardMap).sort(sortById);
      const code = sortedIds.map(id => `${cardMap[id]}x${id}`).join('\n');
      setTeamCode(code);
    } else {
      setTeamCode('');
    }
  }, [teamList]);

  // Theme Toggle
  const toggleTheme = async () => {
    const newTheme = theme === 'white' ? 'dark' : 'white';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('-:', error);
    }
  };

  const currentTheme = theme === 'white' ? whiteTheme : darkTheme;

  // Layout Calculations
  const containerWidth = useMemo(() => {
    const listPadding = isWeb ? 12 : 8;
    if (isWeb) {
      return isBarChartVisible ? (screenWidth * 0.4) - listPadding * 2 : (screenWidth * 0.5) - listPadding * 2;
    }
    return screenWidth - listPadding * 2;
  }, [isBarChartVisible]);

  const cardWidth = useMemo(() => {
    const flatListPaddingLeft = 8;
    const flatListPaddingRight = isWeb ? 24 : 16;
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

  // const matchesFeatureFilter = (card) => {
  //   if (!selectedFeature) return true;
  //   return card.feature === selectedFeature;
  // };

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

  // Team Management Functions
  const addToTeamList = (card) => {
    if (!card || !card.id) {
      setTeamCode('無法添加卡片：卡片缺少 id！');
      setIsModalVisible(true);
      return;
    }

    const hasLeaderCard = teamList.some(item => item.card_catalog === 'Leader');
    if (card.card_catalog === 'Leader' && hasLeaderCard) {
      setTeamCode('隊伍中已有一張 Leader 卡！');
      //setIsModalVisible(true);
      return;
    }
    if (getTotalCardCount() >= 51) {
      setTeamCode('隊伍卡片數量已達上限 (51 張)！');
      //setIsModalVisible(true);
      return;
    }
    const existingCard = teamList.find(item => item.id === card.id);
    if (existingCard && existingCard.count >= 4) {
      setTeamCode('此卡片已達上限 (4 張)！');
      //setIsModalVisible(true);
      return;
    }
    const updatedTeamList = existingCard
      ? teamList.map(item =>
          item.id === card.id ? { ...item, count: item.count + 1 } : item
        )
      : [...teamList, { ...card, count: 1 }];
    setTeamList(updatedTeamList);
  };

  const getTotalCardCount = () => {
    return teamList.reduce((total, card) => total + (card.count || 0), 0);
  };

  const removeCardFromTeam = (card) => {
    const updatedTeamList = teamList
      .map(item => {
        if (item.id === card.id) {
          if (item.count === 1) return null;
          return { ...item, count: item.count - 1 };
        }
        return item;
      })
      .filter(item => item !== null);
    setTeamList(updatedTeamList);
  };

  const clearTeamList = () => {
    setTeamList([]);
    setSelectedTeamName('');
  };

  const generateTeamCode = () => {
    if (teamList.length === 0) {
      setTeamCode('隊伍清單為空！');
      setIsModalVisible(true);
      return;
    }
  
    const cardMap = {};
    teamList.forEach(card => {
      if (!card || !card.id || typeof card.id !== 'string') {
        console.warn('無效的卡片 ID:', card);
        return;
      }
      const cleanId = card.id.replace(/_p\d+$/i, '');
      cardMap[cleanId] = (cardMap[cleanId] || 0) + card.count;
    });
  
    const sortedIds = Object.keys(cardMap).sort(sortById);
    const code = sortedIds.map(id => `${cardMap[id]}x${id}`).join('\n');
    setTeamCode(code);
    setIsModalVisible(true);
  
    // ✅ 自動複製到剪貼簿（只限 Web 平台）
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(code)
        .then(() => console.log('已複製到剪貼簿'))
        .catch(err => console.error('複製失敗:', err));
    }
  };
  

  const saveTeam = async () => {
    if (!teamNameInput.trim()) {
      setTeamCode('請輸入隊伍名稱！');
      setIsModalVisible(true);
      return;
    }
    if (teamList.length === 0) {
      setTeamCode('隊伍清單為空！');
      setIsModalVisible(true);
      return;
    }

    const newTeam = {
      name: teamNameInput.trim(),
      teamList,
      teamCode,
      deckDate: new Date().toISOString().slice(0, 10),// 存储当天日期，格式 YYYY-MM-DD

    };

    try {
      const updatedTeams = [...savedTeams.filter(t => t.name !== teamNameInput), newTeam];
      setSavedTeams(updatedTeams);
      await AsyncStorage.setItem('savedTeams', JSON.stringify(updatedTeams));
      setTeamNameInput('');
      setTeamCode(`Team "${newTeam.name}" saved！`);
      setIsModalVisible(true);
    } catch (error) {
      console.error('deck save fails:', error);
      setTeamCode('Save fails，please try again！');
      setIsModalVisible(true);
    }
  };

  const updateTeam = async () => {
    if (!selectedTeamName) {
      setTeamCode('Please select a team！');
      setIsModalVisible(true);
      return;
    }
    if (teamList.length === 0) {
      setTeamCode('Teamlist is empty！');
      setIsModalVisible(true);
      return;
    }

    const updatedTeam = {
      name: selectedTeamName,
      teamList,
      teamCode,
      deckDate: new Date().toISOString().slice(0, 10),// 每次更新也刷新日期
    };

    try {
      const updatedTeams = [...savedTeams.filter(t => t.name !== selectedTeamName), updatedTeam];
      setSavedTeams(updatedTeams);
      await AsyncStorage.setItem('savedTeams', JSON.stringify(updatedTeams));
      setTeamCode(`Team "${selectedTeamName}" updated！`);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Team update fails:', error);
      setTeamCode('Team update fails，please try again！');
      setIsModalVisible(true);
    }
  };

  const renameTeam = async () => {
    if (!newTeamName.trim()) {
      setTeamCode('Please enter deck name！');
      setIsModalVisible(true);
      return;
    }
    if (newTeamName === selectedTeamName) {
      setTeamCode('Same name as old name！');
      setIsModalVisible(true);
      return;
    }
    if (savedTeams.some(t => t.name === newTeamName.trim())) {
      setTeamCode('Deck name exisited！');
      setIsModalVisible(true);
      return;
    }

    try {
      const updatedTeams = savedTeams.map(team =>
        team.name === selectedTeamName
          ? { ...team, name: newTeamName.trim() }
          : team
      );
      setSavedTeams(updatedTeams);
      await AsyncStorage.setItem('savedTeams', JSON.stringify(updatedTeams));
      setSelectedTeamName(newTeamName.trim());
      setNewTeamName('');
      setIsRenameModalVisible(false);
      setTeamCode(`Deck name changed to: "${newTeamName.trim()}"！`);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Team name updated fails:', error);
      setTeamCode('Team name updated fails，please try again！');
      setIsModalVisible(true);
    }
  };

  const loadTeam = (teamName) => {
    const team = savedTeams.find(t => t.name === teamName);
    if (team) {
      setTeamList(team.teamList);
      setTeamCode(team.teamCode);
      setSelectedTeamName(teamName);
    }
  };

  const deleteTeam = async (teamName) => {
    try {
      const updatedTeams = savedTeams.filter(t => t.name !== teamName);
      setSavedTeams(updatedTeams);
      await AsyncStorage.setItem('savedTeams', JSON.stringify(updatedTeams));
      if (selectedTeamName === teamName) {
        setTeamList([]);
        setTeamCode('');
        setSelectedTeamName('');
      }
    } catch (error) {
      console.error('Team delete fail:', error);
      setTeamCode('Team delete fail，please try again！');
      setIsModalVisible(true);
    }
  };

  const sortedTeamList = [...teamList].sort((a, b) => {
    if (a.card_catalog === 'Leader' && b.card_catalog !== 'Leader') return -1;
    if (a.card_catalog !== 'Leader' && b.card_catalog === 'Leader') return 1;
    return String(b.life || '').localeCompare(String(a.life || ''));
  });

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
  const renderCard = ({ item, index }) => (
    <TouchableOpacity
      onPress={() => addToTeamList(item)}
      onLongPress={() => {
        setSelectedCard(item);
        setCurrentIndex(index);
      }}
      delayLongPress={300}
      style={[
        styles.cardContainer,
         { width: cardWidth },
         hoveredIndex === index && isWeb && styles.hoverEffect,
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
  
  

  const renderTeamList = ({ item }) => (
    <TouchableOpacity
      //onPress={() => removeCardFromTeam(item)}
      // 左鍵：加一張
      onPress={() => addToTeamList(item)}
      // 中鍵：減一張（並阻止中鍵預設開新頁行為）
      onMouseDown={(e) => {
        if (Platform.OS === 'web' && e.nativeEvent.button === 1) {
          e.preventDefault();
          removeCardFromTeam(item);
        }
      }}
      style={[styles.teamCardContainer, { width: cardWidth }]}
      onMouseEnter={(e) => handleMouseEnter(item, e)}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        source={{ uri: item.image_url }}
        style={[styles.cardImage, { width: cardWidth }]}
        resizeMode="contain"
      />
      <Text style={[styles.cardCount, { backgroundColor: currentTheme.cardCountBackground }]}>{item.count}</Text>
    </TouchableOpacity>
  );

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

  const toggleBarChart = () => {
    setIsBarChartVisible(!isBarChartVisible);
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
        {item || (onSelect === setSelectedSeries ? 'All Series' : onSelect === setSelectedGetInfo ? 'All' : onSelect === setSelectedFeature ? 'All feature' : 'All...')}
      </Text>
    </TouchableOpacity>
  );

  //Import deck code script
  const handleImportConfirm = () => {
    clearTeamList();//Clean teamlist first
    const lines = importText.split('\n');
    const newCards = [];
  
    for (const line of lines) {
      const match = line.trim().match(/(\d+)x([A-Z0-9\-]+)/);
      if (match) {
        const [, countStr, id] = match;
        const count = parseInt(countStr);
        const found = cardData.find(card => card.id === id);
        if (found) {
          newCards.push({ ...found, count });
        }
      }
    }
  
    const mergedTeam = [...teamList];
  
    for (const card of newCards) {
      const existing = mergedTeam.find(item => item.id === card.id);
      if (existing) {
        existing.count = Math.min(existing.count + card.count, 4);
      } else {
        if (card.card_catalog === 'Leader' && mergedTeam.some(c => c.card_catalog === 'Leader')) continue;
        mergedTeam.push({ ...card, count: Math.min(card.count, 4) });
      }
    }
    setTeamList(newCards); // 直接覆蓋整個隊伍
    //setTeamList(mergedTeam);
    setIsImportModalVisible(false);
    setImportText('');
  };


  //Export deck json script
  const handleExportTeam = async () => {
    if (!selectedTeamName) {
      alert('請選擇要導出的隊伍！');
      return;
    }
  
    const leaderCard = teamList.find(card => card.card_catalog === 'Leader');
    const otherMembers = teamList
      .filter(card => card.card_catalog !== 'Leader')
      .map(card => ({
        memberID: card.id,
        memberCount: card.count,
      }));
  
    const deckData = {
      leaderID: leaderCard ? leaderCard.id : '',
      members: otherMembers,
      deckDate: new Date().toISOString().slice(0, 10),
      deckColor: '',
      deckName: selectedTeamName || 'Unnamed Deck',
    };
  
    const filename = `${deckData.deckName}_${deckData.deckDate}.json`;
    const json = JSON.stringify(deckData, null, 2);
  
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, json);
      await Sharing.shareAsync(fileUri);
    }
  };
  
  const handleExportAllTeams = async () => {
    try {
      const stored = await AsyncStorage.getItem('savedTeams');
      if (!stored) {
        alert('No teams to export!');
        return;
      }
  
      const parsedTeams = JSON.parse(stored);
  
      // 轉換格式
      const exportData = parsedTeams.map(team => {
        const leaderCard = team.teamList.find(card => card.card_catalog === 'Leader');
        const members = team.teamList
          .filter(card => card.card_catalog !== 'Leader')
          .map(card => ({
            memberID: card.id,
            memberCount: card.count
          }));
  
        return {
          leaderID: leaderCard ? leaderCard.id : '',
          members,
          deckDate: new Date().toISOString().slice(0, 10),
          deckColor: '',
          deckName: team.name
        };
      });
  
      const filename = `All_Decks_${new Date().toISOString().slice(0, 10)}.json`;
      const json = JSON.stringify(exportData, null, 2);
  
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const fileUri = FileSystem.documentDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, json);
        await Sharing.shareAsync(fileUri);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed!');
    }
  };
  
  
  //Import deck json script
  const handleImportTeams = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const imported = JSON.parse(text);
  
        if (!imported.leaderID || !Array.isArray(imported.members)) {
          alert('格式錯誤，請確認是正確的 Deck JSON 格式');
          return;
        }
  
        // 轉換成 teamList 格式
        const newTeamList = [];
  
        const leaderCard = cardData.find(card => card.id === imported.leaderID);
        if (leaderCard) {
          newTeamList.push({ ...leaderCard, count: 1 });
        }
  
        for (const member of imported.members) {
          const card = cardData.find(c => c.id === member.memberID);
          if (card) {
            newTeamList.push({ ...card, count: Math.min(member.memberCount, 4) });
          }
        }
  
        setTeamList(newTeamList);
        setTeamCode('');
        setSelectedTeamName(imported.deckName || 'Imported Deck');
        alert('導入成功！');
      } catch (err) {
        console.error('導入失敗:', err);
        alert('導入失敗！請檢查檔案格式');
      }
    };
  
    reader.readAsText(file);
  };

  const handleImportAllTeams_old = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const imported = JSON.parse(text);
  
        if (!Array.isArray(imported)) {
          alert('格式錯誤，請確認是 Decks JSON 陣列');
          return;
        }
  
        const newTeams = imported.map(deck => {
          const teamList = [];
  
          const leaderCard = cardData.find(card => card.id === deck.leaderID);
          if (leaderCard) {
            teamList.push({ ...leaderCard, count: 1 });
          }
  
          for (const member of deck.members) {
            const card = cardData.find(c => c.id === member.memberID);
            if (card) {
              teamList.push({ ...card, count: Math.min(member.memberCount, 4) });
            }
          }
  
          return {
            name: deck.deckName || 'Imported Deck',
            teamList,
            teamCode: '', // Optional, can regenerate
          };
        });
  
        const existing = await AsyncStorage.getItem('savedTeams');
        const existingTeams = existing ? JSON.parse(existing) : [];
  
        const merged = [...existingTeams, ...newTeams];
  
        await AsyncStorage.setItem('savedTeams', JSON.stringify(merged));
        setSavedTeams(merged);
        alert('導入完成！');
      } catch (err) {
        console.error('導入失敗:', err);
        alert('導入失敗！請檢查檔案格式');
      }
    };
  
    reader.readAsText(file);
  };

  const handleImportAllTeams = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const imported = JSON.parse(text);
  
        if (!Array.isArray(imported)) {
          alert('格式錯誤，請確認是 Decks JSON 陣列');
          return;
        }
  
        const existing = await AsyncStorage.getItem('savedTeams');
        const existingTeams = existing ? JSON.parse(existing) : [];
        const existingNames = existingTeams.map(team => team.name);
  
        const newTeams = [];
  
        for (const deck of imported) {
          if (!deck.deckName || existingNames.includes(deck.deckName)) {
            console.log(`跳過已存在的 deck: ${deck.deckName}`);
            continue; // ⛔️ 跳過已存在的 deck
          }
  
          const teamList = [];
  
          const leaderCard = cardData.find(card => card.id === deck.leaderID);
          if (leaderCard) {
            teamList.push({ ...leaderCard, count: 1 });
          }
  
          for (const member of deck.members) {
            const card = cardData.find(c => c.id === member.memberID);
            if (card) {
              teamList.push({ ...card, count: Math.min(member.memberCount, 4) });
            }
          }
  
          newTeams.push({
            name: deck.deckName || 'Imported Deck',
            teamList,
            teamCode: '', // 可選擇生成
          });
        }
  
        if (newTeams.length === 0) {
          alert('沒有新 Deck 被導入，所有名稱都已存在！');
          return;
        }
  
        const merged = [...existingTeams, ...newTeams];
  
        await AsyncStorage.setItem('savedTeams', JSON.stringify(merged));
        setSavedTeams(merged);
        alert(`成功導入 ${newTeams.length} 個新 Deck！`);
      } catch (err) {
        console.error('導入失敗:', err);
        alert('導入失敗！請檢查檔案格式');
      }
    };
  
    reader.readAsText(file);
  };
  
  
  
  
  




  return (
    <View
      style={[
        styles.container,
        {
          flexDirection: isWeb ? 'row' : 'column',
          backgroundColor: currentTheme.background,
        },
      ]}
    >
      {
        // Web Layout
        <>
          {/* CardList */}
          <View style={[styles.listContainer, { flex: 0.45 }]}>
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
              contentContainerStyle={[styles.list, { paddingRight: isWeb ? 24 : 16 }]}
              initialNumToRender={20}
              windowSize={5}
            />
          </View>

          <View style={[styles.splitter, { backgroundColor: currentTheme.splitter, borderColor: currentTheme.splitterBorder }]} />

          {/* TeamList */}
          <View style={[styles.listContainer, { flex: 0.45 }]}>
            <View style={styles.teamListHeader}>
              <Text style={[styles.listTitle, { color: currentTheme.text }, getTotalCardCount() > 51 && { color: 'red' }]}>
                Total ({getTotalCardCount()} / 51) <Text>   </Text>
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollableButtonContainer}>
                <View style={styles.buttonContainer}>
                  
                  <TextInput
                    placeholder="Deck Name..."
                    value={teamNameInput}
                    onChangeText={setTeamNameInput}
                    style={[styles.searchBar, { borderColor: currentTheme.border, backgroundColor: currentTheme.background, color: currentTheme.text }]}
                    placeholderTextColor={currentTheme.secondaryText}
                  />
                  {/* Add the save deck button */}
                  <TouchableOpacity onPress={saveTeam} style={[styles.saveButton, { backgroundColor: currentTheme.saveButton }]}>
                    <Text style={[styles.saveButtonText, { color: currentTheme.buttonText }]}>Save</Text>
                  </TouchableOpacity>
                    
                  {/* Add the clear team list button */}
                  <TouchableOpacity onPress={clearTeamList} style={[styles.clearButton, { backgroundColor: currentTheme.clearButton }]}>
                    <Text style={[styles.clearButtonText, { color: currentTheme.buttonText }]}>Clean</Text>
                  </TouchableOpacity>

                  {/* Add the Generate code button */}
                  <TouchableOpacity onPress={generateTeamCode} style={[styles.genCodeButton, { backgroundColor: currentTheme.genCodeButton }]}>
                    <Text style={[styles.genCodeButtonText, { color: currentTheme.buttonText }]}>Gen Code</Text>
                  </TouchableOpacity>

                  {/* Add the Import deck button */}
                  <TouchableOpacity
                    onPress={() => setIsImportModalVisible(true)}
                    style={[styles.genCodeButton, { backgroundColor: currentTheme.genCodeButton }]}
                  >
                    <Text style={[styles.genCodeButtonText, { color: currentTheme.buttonText }]}>Paste</Text>
                  </TouchableOpacity>

                  {/* Add the Export deck button */}
                  <TouchableOpacity
                    onPress={handleExportAllTeams}
                    style={[styles.genCodeButton, { backgroundColor: currentTheme.genCodeButton }]}
                  >
                    <Text style={[styles.genCodeButtonText, { color: currentTheme.buttonText }]}>Export</Text>
                  </TouchableOpacity>

                  {/* ✅ 加在這裡 */}
                  {Platform.OS === 'web' && (
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportAllTeams}
                      style={{ marginLeft: 8 }}
                    />
                  )}



                </View>
              </ScrollView>
            </View>

          
              <View style={styles.dropdownContainer}>
                <View style={styles.dropdownWrapper}>
                <DropdownButton
                    label={selectedTeamName || 'Saved Decks'}
                    selected={!!selectedTeamName}
                    onPress={() => setIsTeamModalVisible(true)}
                    theme={theme}
                  />
                  {selectedTeamName && (
                    <>
                      <TouchableOpacity
                        onPress={() => { setNewTeamName(selectedTeamName); setIsRenameModalVisible(true); }}
                        style={[styles.renameButton, { backgroundColor: currentTheme.renameButton }]}
                      >
                        <Text style={[styles.renameButtonText, { color: currentTheme.buttonText }]}>Edit Name</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={updateTeam} style={[styles.updateButton, { backgroundColor: currentTheme.updateButton }]}>
                        <Text style={[styles.updateButtonText, { color: currentTheme.buttonText }]}>Update</Text>
                      </TouchableOpacity>

                      {/* Delete Team Button */}
                      <TouchableOpacity
                        onPress={() => deleteTeam(selectedTeamName)}
                        style={[styles.deleteButton, { backgroundColor: currentTheme.deleteButton }]}
                      >
                        <Text style={[styles.deleteButtonText, { color: currentTheme.buttonText }]}>Delete</Text>
                      </TouchableOpacity>

                      {/* Chart Button */}
                      <TouchableOpacity
                        onPress={() => setIsChartModalVisible(true)}
                        style={[styles.updateButton, { backgroundColor: currentTheme.modalButton }]}
                      >
                        <FontAwesome name="bar-chart" size={16} color={currentTheme.buttonText} />
                        
                      </TouchableOpacity>


                    </>
                  )}
                </View>
              </View>

              <Text style={[styles.listTitle, { color: currentTheme.text }]}>* Left click +1 , middle click -1</Text>
            

            <FlatList
              data={sortedTeamList}
              keyExtractor={item => item.id}
              renderItem={renderTeamList}
              numColumns={numColumns}
              key={numColumns}
              contentContainerStyle={[styles.list, { paddingRight: isWeb ? 24 : 16 }]}
              initialNumToRender={20}
              windowSize={5}
            />
            {!isBarChartVisible && (
              <TouchableOpacity onPress={toggleBarChart} style={[styles.verticalToggleButton, { backgroundColor: currentTheme.buttonBackground }]}>
                <Text style={[styles.verticalToggleButtonText, { color: currentTheme.buttonText }]}>顯示圖表</Text>
              </TouchableOpacity>
            )}
          </View>

          
          <View style={[styles.splitter, { backgroundColor: currentTheme.splitter, borderColor: currentTheme.splitterBorder }]} />

            

          {/* Hover */}
          <View style={[styles.listContainer, { flex:0.2,height: screenHeight }]}> 
            {/* Google Ads (測試用 Banner) */}
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
      }

      {/* Tooltip (Web only) 
      {isWeb && hoveredCard && (
        <View
          style={[
            styles.tooltip,
            {
              top: tooltipPosition.y - 10,
              left: tooltipPosition.x + 0,
              backgroundColor: currentTheme.tooltipBackground,
              flexDirection: 'row', // 加這個讓它左右排列
              width: 600, // ✅ 固定寬度
              maxWidth: 800, // ✅ 或你可以限制最大寬度
              padding: 8,
            },
          ]}
        >
          {/* 圖片區（左邊） 
          <Image
            source={{ uri: hoveredCard.image_url }}
            style={{
              width: 240,
              height: 400,
              marginRight: 12,
              borderRadius: 4,
              backgroundColor: '#fff',
            }}
            resizeMode="contain"
          />

          {/* 資訊區（右邊） 
          <View style={{ flex: 1 }}>
            <Text style={[styles.tooltipText, { color: currentTheme.tooltipText }]}>
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Name: </Text>
              {hoveredCard.card_name || '-'}
            </Text>
            <Text style={[styles.tooltipText, { color: currentTheme.tooltipText }]}>
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>ID: </Text>
              {hoveredCard.id || '-'}
            </Text>
            <Text style={[styles.tooltipText, { color: currentTheme.tooltipText }]}>
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Effect: </Text>
              {hoveredCard.text || '-'}
            </Text>
            <Text style={[styles.tooltipText, { color: currentTheme.tooltipText }]}>
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Trigger: </Text>
              {hoveredCard.trigger || '-'}
            </Text>
            <Text style={[styles.tooltipText, { color: currentTheme.tooltipText }]}>
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipLabel }]}>Feature: </Text>
              {hoveredCard.feature || '-'}
            </Text>
            <Text style={[styles.tooltipText, { color: currentTheme.tooltipText }]}>
              <Text style={[styles.tooltipLabel, { color: currentTheme.tooltipText }]}> **Long press for more detail: </Text>
            </Text>
          </View>
        </View>
      )}*/}


      {/* Modals */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Deck Code</Text>
            <ScrollView style={styles.modalTextContainer}>
              <Text style={[styles.modalText, { color: currentTheme.modalText }]}>{teamCode}</Text>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: currentTheme.modalButton }]}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>關閉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        {/*Edit Team name */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRenameModalVisible}
        onRequestClose={() => setIsRenameModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>修改牌組名稱</Text>
            <TextInput
              placeholder="輸入新牌組名稱..."
              value={newTeamName}
              onChangeText={setNewTeamName}
              style={[styles.searchBar, { borderColor: currentTheme.border, backgroundColor: currentTheme.background, color: currentTheme.text, marginBottom: 16 }]}
              placeholderTextColor={currentTheme.secondaryText}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.deleteButton, marginRight: 8 }]}
                onPress={() => { setNewTeamName(''); setIsRenameModalVisible(false); }}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.modalButton }]}
                onPress={renameTeam}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>Cancel</Text>
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
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Where to get</Text>
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

      {/* Team Modal */}
       <Modal
              animationType="slide"
              transparent={true}
              visible={isTeamModalVisible}
              onRequestClose={() => setIsTeamModalVisible(false)}
            >
              <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
                <View style={[styles.modalContent, { backgroundColor: currentTheme.modalBackground }]}>
                  <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Deck:</Text>
                  {/* <FlatList
                    data={['', ...savedTeams.map(team => team.name)]}
                    keyExtractor={item => item || 'default'}
                    renderItem={({ item }) => {
                      if (item === '') {
                        return (
                          <TouchableOpacity
                            style={[styles.modalOption, { backgroundColor: currentTheme.modalBackground, flexDirection: 'row', alignItems: 'center', marginBottom: 8 }]}
                            onPress={() => {
                              setTeamList([]);
                              setTeamCode('');
                              setSelectedTeamName('');
                              setIsTeamModalVisible(false);
                            }}
                          >
                            <Text style={[styles.modalOptionText, { color: currentTheme.modalText }]}>New Deck</Text>
                          </TouchableOpacity>
                        );
                      }
      
                      const team = savedTeams.find(t => t.name === item);
                      const leaderCard = team?.teamList?.find(card => card.card_catalog === 'Leader');
                      const leaderImage = leaderCard?.image_url;
      
                      return (
                        <TouchableOpacity
                          style={[styles.modalOption, { backgroundColor: item === selectedTeamName ? currentTheme.selectedButtonBackground : currentTheme.modalBackground, flexDirection: 'row', alignItems: 'center', marginBottom: 8, padding: 8 }]}
                          onPress={() => {
                            loadTeam(item);
                            setIsTeamModalVisible(false);
                          }}
                        >
                          {leaderImage && (
                            <Image
                              source={{ uri: leaderImage }}
                              style={{ width: 40, height: 60, borderRadius: 4, marginRight: 8 }}
                              resizeMode="contain"
                            />
                          )}
                          <Text
                            style={{
                              color: item === selectedTeamName ? currentTheme.selectedButtonText : currentTheme.modalText,
                              fontSize: 14,
                              flexShrink: 1,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  /> */}
                  <FlatList
                    data={['', ...savedTeams.map(team => team.name)]}
                    keyExtractor={item => item || 'default'}
                    // 改成 3 欄，你可以依需求調整
                    numColumns={3}
                    key={3}
                    // 每行項目左右平均分佈
                    columnWrapperStyle={{ justifyContent: 'flex-start' }}
                    contentContainerStyle={{ padding: 8 }}
                    renderItem={({ item }) => {
                      // 預留 New Deck 欄位
                      if (item === '') {
                        return (
                          <TouchableOpacity
                            style={styles.modalGridItem}
                            onPress={() => {
                              setTeamList([]);
                              setTeamCode('');
                              setSelectedTeamName('');
                              setIsTeamModalVisible(false);
                            }}
                          >
                            <View style={[styles.modalGridImage, { backgroundColor: '#ccc' }]} />
                            <View style={styles.modalGridOverlay}>
                              <Text style={styles.modalGridText}>New Deck</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }
                      const team = savedTeams.find(t => t.name === item);
                      const leaderCard = team?.teamList.find(c => c.card_catalog === 'Leader');
                      const leaderImage = leaderCard?.image_url;

                      // 取得並格式化日期（假設 deckDate 是 ISO 字串）
                      const deckDateRaw = team?.deckDate;
                      const deckDateDisplay = deckDateRaw
                      ? new Date(deckDateRaw).toLocaleDateString('zh-Hans', {
                          year: 'numeric',
                         month: '2-digit',
                          day: '2-digit',
                         })   : '';
                      return (
                        <TouchableOpacity
                          style={styles.modalGridItem}
                          onPress={() => {
                            loadTeam(item);
                            setIsTeamModalVisible(false);
                          }}
                        >
                          {leaderImage && (
                            <Image
                              source={{ uri: leaderImage }}
                              style={styles.modalGridImage}
                              resizeMode="cover"
                            />
                          )}
                          <View style={styles.modalGridOverlay}>
                           {/* 顯示日期 */}
                            {deckDateDisplay.length > 0 && (
                              <Text style={styles.modalDateText} numberOfLines={1}>
                                {deckDateDisplay}
                              </Text>
                           )}

                            <Text style={styles.modalGridText} numberOfLines={1} ellipsizeMode="tail">
                              {item}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />






      
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: currentTheme.deleteButton }]}
                    onPress={() => setIsTeamModalVisible(false)}
                  >
                    <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
                      
      {/* Chart Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isChartModalVisible}
        onRequestClose={() => setIsChartModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Chart</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <TeamDetail teamList={teamList} theme={currentTheme} />
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: currentTheme.modalButton, marginTop: 12 }]}
              onPress={() => setIsChartModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Card Detail Modal */}
      <Modal visible={!!selectedCard} animationType="fade" transparent>
       <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={[styles.modalCardBox, {
              width: isWeb ? 800 : '100%',
              flexDirection:'column',
              backgroundColor: currentTheme.background, //'#fff', // ⬅ 加這句強制白底
              borderRadius: 12,
              padding: 16,
          }]}>
              {/* 左邊圖片 */}
              <View style={{ width: isWeb ? '50%' : '100%', alignItems: 'center' }}>
                <Image
                  source={{ uri: selectedCard?.image_url }}
                  style={{
                    width: isWeb ? '100%' : 300,
                    height: isWeb ? 400 : 400,
                    resizeMode: 'contain',
                    borderRadius: 8,
                  }}
                />
              </View>

              {/* 右邊文字資訊 */}
              <View style={[styles.modalDetails, isWeb ? { width: '50%', paddingLeft: 16 } : { width: '100%', marginTop: 16 }]}>
                <Text style={[styles.modalTitle, { color: currentTheme.text }]}>{selectedCard?.card_name}</Text>
                
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><MaterialIcons name="numbers" color={currentTheme.text} /> Id: {selectedCard?.id}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><MaterialIcons name="star" color={currentTheme.text} /> Rare: {selectedCard?.card_grade}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><MaterialIcons name="attach-money" color={currentTheme.text} /> Cost: {selectedCard?.life}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><MaterialIcons name="flash-on" color={currentTheme.text} /> Power: {selectedCard?.power}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><MaterialIcons name="palette" color={currentTheme.text} /> Color: {selectedCard?.color}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><FontAwesome5 name="fist-raised" color={currentTheme.text} /> Attribute: {selectedCard?.attribute}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><Entypo name="shield" color={currentTheme.text} /> Counter: {selectedCard?.counter}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><MaterialIcons name="category" color={currentTheme.text} /> Type: {selectedCard?.card_catalog}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><MaterialIcons name="book" color={currentTheme.text} /> Feature: {selectedCard?.feature}</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}><MaterialIcons name="notes" color={currentTheme.text} /> Effect:</Text>
                <Text style={[styles.detailLabel, { color: currentTheme.text }]}>{selectedCard?.text}</Text>
                <Text style={styles.detailLabel}><MaterialIcons name="collections-bookmark" /> Card Set(s): {selectedCard?.get_info}</Text>

                {/* 下方按鈕列 */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                  <TouchableOpacity
                    onPress={() => {
                      const prevIndex = (currentIndex - 1 + filteredCards.length) % filteredCards.length;
                      setSelectedCard(filteredCards[prevIndex]);
                      setCurrentIndex(prevIndex);
                    }}
                    style={[styles.closeBtn, { margin: 4 }]}
                  >
                    <Text style={[styles.closeText, { color: currentTheme.text }]}>← Prev</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      const nextIndex = (currentIndex + 1) % filteredCards.length;
                      setSelectedCard(filteredCards[nextIndex]);
                      setCurrentIndex(nextIndex);
                    }}
                    style={[styles.closeBtn, { margin: 4 }]}
                  >
                    <Text style={[styles.closeText, { color: currentTheme.text }]}>Next →</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (!favorites.includes(selectedCard.id)) {
                        setFavorites([...favorites, selectedCard.id]);
                      } else {
                        setFavorites(favorites.filter(id => id !== selectedCard.id));
                      }
                    }}
                    style={[styles.closeBtn, { margin: 4 }]}
                  >
                    <Text style={[styles.closeText, { color: currentTheme.text }]}>
                      {favorites.includes(selectedCard?.id) ? '💖 Unfavorite' : '🤍 Favorite'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (isWeb) {
                        navigator.clipboard?.writeText(selectedCard.image_url);
                      } else {
                        shareImage();
                      }
                    }}
                    style={[styles.closeBtn, { margin: 4 }]}
                  >
                    <Text style={[styles.closeText, { color: currentTheme.text }]}>📤 Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => {setSelectedCard(null);setCurrentIndex(0);}} style={[styles.closeBtn, { margin: 4 }]}>
                    <Text style={[styles.closeText, { color: currentTheme.text }]}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
                      
        {/* Import Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isImportModalVisible}
        onRequestClose={() => setIsImportModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: currentTheme.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Paste Deck Code</Text>
            <TextInput
                placeholder="Place your cardlist，example：4xOP10-005, Remember to Save your deck after!"
                value={importText}
                onChangeText={setImportText}
                multiline
                numberOfLines={15} // 高度（可自行調整）
                textAlignVertical="top"
                style={[
                  styles.searchBar,
                  {
                    height: 160, // 高度可調整
                    borderColor: currentTheme.border,
                    backgroundColor: currentTheme.background,
                    color: currentTheme.text,
                    marginBottom: 16,
                  },
                ]}
                placeholderTextColor={currentTheme.secondaryText}
              />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.deleteButton, marginRight: 8 }]}
                onPress={() => setIsImportModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: currentTheme.modalButton }]}
                onPress={handleImportConfirm}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.buttonText }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      
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
    flexDirection: isWeb ? 'row' : 'column',
    alignItems: isWeb ? 'center' : 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdown: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: isWeb ? 0 : 8,
    marginHorizontal: isWeb ? 4 : 0,
    paddingHorizontal: 8,
  },
  otherFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // ✅ 加上這行
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4, // 可選，讓按鈕之間有間距
    maxWidth: isWeb ? 600 : '100%',
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
  },
  modalGridItem: {
    width: `30%`,           // 三欄時每格約 30%
    aspectRatio: 0.7,       // 與卡片一致的比例
    marginBottom: 12,
    position: 'relative',   // 讓 overlay 絕對定位有效
  },
  // 圖片填滿格子
  modalGridImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 0.7,
    borderRadius: 6,
  },
  // 文字遮罩區塊
  modalGridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 4,
  },
   modalDateText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'center',
  },
  // 覆蓋文字
  modalGridText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },
  
  

});