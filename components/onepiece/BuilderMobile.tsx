import React, { useEffect, useState , useRef} from 'react';
import {
  Alert , View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity, Modal, Dimensions, ScrollView,Platform, findNodeHandle as rnFindNodeHandle,
} from 'react-native';

import allCardData from '../../assets/data/All_Data_EN.json';


import { MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard'

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import * as DocumentPicker from 'expo-document-picker';

import AsyncStorage from '@react-native-async-storage/async-storage';



// ─── Web 上補上 findNodeHandle polyfill ───────────────────────────────
// React Native Web 若無此函式，按 back 時就會噴錯
if (Platform.OS === 'web') {
  (global as any).findNodeHandle = rnFindNodeHandle;
}
const screenWidth = Dimensions.get('window').width;

  // 獲取螢幕寬度
const cardMinWidth = 120; // 最小卡片寬度
const cardMargin = 8; // 卡片間距

const numColumnsForShare = 4;
const shareCardMargin = 5; // 卡片間距
const shareCardWidth = (screenWidth - shareCardMargin * 3 * numColumnsForShare) / numColumnsForShare;




export default function BuilderMobileScreen() {

  const viewShotRef = useRef();

  const [theme, setTheme] = useState<'white' | 'dark'>('dark');
  const currentTheme = theme === 'white' ? whiteTheme : darkTheme;

  
  //const [filteredList, setFilteredList] = useState([]);
  // 全部 decks（用于搜索），和当前要渲染的 filteredList
  const [allDecks, setAllDecks] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(null);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  //TeamCode
  const [teamCode, setTeamCode] = useState<string>('');
  const [codeModalVisible, setCodeModalVisible] = useState<boolean>(false);

  //Import deck state
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [importText, setImportText] = useState('');

  //Paste deck
  const [teamList, setTeamList] = useState([]);
  const [selectedTeamName, setSelectedTeamName] = useState('');


   // 在组件函数体最上方（render 之前）加入：
  const renderItem = ({ item, index }) => {
    const leaderCard = allCardData.find(c => c.id === item.leaderID);
      return (
          <TouchableOpacity
            style={[styles.deckItem, { borderColor: currentTheme.border }]}
            onPress={() => {
              // 打开已有 Deck，记录它的索引，并弹出编辑 Modal
              setSelectedDeck(item);
              setSelectedDeckIndex(index);
              //setIsCardListModalVisible(true);
            }}
          >
            <Image source={{ uri: leaderCard?.image_url }} style={styles.deckImage} />
            <View style={styles.overlay}>
              <Text style={[styles.deckOwner, { color: currentTheme.text, fontSize: 16 }]}>
                {item.deckName || 'Unnamed Deck'}
              </Text>
              <Text style={[styles.deckOwner, { color: currentTheme.text }]}>
                {leaderCard?.card_name || 'Unknown Leader'}
              </Text>
              <Text style={[styles.deckText, { color: currentTheme.text }]}>
                {item.updatedAt
                  ? `Updated: ${item.updatedAt}`
                  : item.deckDate
                  ? `Created: ${item.deckDate}`
                  : 'No Date'}
              </Text>
            </View>
          </TouchableOpacity>
      );
  }

  const newDeck = {
    leaderID: null,
    members: [],
    deckDate: '',
    deckColor: '',
    deckName: '',
  };

  const handleAddCard = (card) => {
    if (!card) return;

    if (card.card_catalog === 'Leader') {
      if (selectedDeck?.leaderID) {
        alert('This deck already has a Leader!');
        return;
      }
      setSelectedDeck(prev => ({
        ...prev,
            leaderID: card.id,
      }));
        // 多选模式：选完 Leader 后不关 Modal，继续选成员
      return;
    }
  
    // 非 Leader 卡
    const currentCount = selectedDeck?.members.reduce((total, item) => total + item.memberCount, 0) || 0;
    if (currentCount >= 50) {
      alert('You can only have up to 51 cards besides Leader!');
      return;
    }
  
    const existingCard = selectedDeck.members.find(item => item.memberID === card.id);
    if (existingCard) {
      if (existingCard.memberCount >= 4) {
        alert('You can only have up to 4 copies of this card!');
        return;
      }
      const updatedMembers = selectedDeck.members.map(item =>
        item.memberID === card.id ? { ...item, memberCount: item.memberCount + 1 } : item
      );
      setSelectedDeck(prev => ({ ...prev, members: updatedMembers }));
    } else {
      const updatedMembers = [...selectedDeck.members, { memberID: card.id, memberCount: 1 }];
      setSelectedDeck(prev => ({ ...prev, members: updatedMembers }));
    }
  
    //setIsCardListModalVisible(false); // 添加後自動關閉
  };
  

  const validateDeck = () => {
    if (!deckNameInput.trim()) {
      alert('Please enter a Deck Name!');
      return false;
    }
  
    if (!selectedDeck?.leaderID) {
      alert('Please choose a Leader!');
      return false;
    }
  
    const leaderCard = allCardData.find(c => c.id === selectedDeck.leaderID);
    if (!leaderCard) {
      alert('Invalid Leader card!');
      return false;
    }
  
    const totalCards = selectedDeck.members.reduce((sum, item) => sum + item.memberCount, 0);
    if (totalCards > 51) {
      alert('Total members cannot exceed 51 cards!');
      return false;
    }
  
    return true;
  };
  

  const [deckNameInput, setDeckNameInput] = useState('');

  useEffect(() => {
    if (selectedDeck?.deckName) {
      setDeckNameInput(selectedDeck.deckName);
    } else {
      setDeckNameInput('');
    }
  }, [selectedDeck]);

  useEffect(() => {
    const loadDecks = async () => {
      if (Platform.OS === 'web') {
        const savedDecks = localStorage.getItem('decks');
        if (savedDecks) {
          setFilteredList(JSON.parse(savedDecks));
        }
      } else {
            const saved = await AsyncStorage.getItem('decks');
            const parsed = saved ? JSON.parse(saved) : [];
            // 全部 decks 和 filteredList 一次性载入
            setAllDecks(parsed);
            setFilteredList(parsed);

      }
    };
    loadDecks();
  }, []);

  useEffect(() => {
    const saveDecks = async () => {
      const jsonString = JSON.stringify(filteredList);
      if (Platform.OS === 'web') {
        localStorage.setItem('decks', jsonString);
      } else {
        await AsyncStorage.setItem('decks', JSON.stringify(allDecks));
        if (!searchText) setFilteredList(allDecks);
      }

    };
    saveDecks();
  }, [filteredList]);

  useEffect(() => {
    const persist = async () => {
      if (Platform.OS === 'web') {
        localStorage.setItem('decks', JSON.stringify(allDecks));
      } else {
        await AsyncStorage.setItem('decks', JSON.stringify(allDecks));
      }
    };
    persist();
  }, [allDecks]);



// 搜索函数，会筛 deckName、leaderID、以及根据 leaderID 拿到的 card_name
 const handleSearch = (text: string) => {
  setSearchText(text);
  const lower = text.toLowerCase();
  const filtered = allDecks.filter(deck => {
    // deckName 或 leaderID 包含
    if (deck.deckName.toLowerCase().includes(lower)) return true;
    if (deck.leaderID.toLowerCase().includes(lower)) return true;
    // 根据 leaderID 去找卡牌名字
    const leader = allCardData.find(c => c.id === deck.leaderID);
    return !!leader && leader.card_name.toLowerCase().includes(lower);
   });
   setFilteredList(filtered);
 };


  // 動態計算每行幾張卡片, teamlist cardlist
  const numColumns = 3;
  const cardWidth = (screenWidth - cardMargin * 3 * numColumns) / numColumns;


  const [isCardListModalVisible, setIsCardListModalVisible] = useState(false);
  const [cardSearchText, setCardSearchText] = useState('');

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

  const clearTeamList = () => {
    setTeamList([]);
    setSelectedTeamName('');
  };
  

  // const generateTeamCode = async () => {
  //   if (!selectedDeck || !selectedDeck.members || selectedDeck.members.length === 0) {
  //     alert('No cards in the deck!');
  //     return;
  //   }

  //   const cardMap = {};

  //   selectedDeck.members.forEach(card => {
  //     const cleanId = card.memberID.replace(/_p\d+$/i, '');
  //     cardMap[cleanId] = (cardMap[cleanId] || 0) + card.memberCount;
  //   });

  //   const sortedIds = Object.keys(cardMap).sort(sortById);
  //   const memberCode = sortedIds.map(id => `${cardMap[id]}x${id}`).join('\n');

  //   // Leader ID + 卡片代碼
  //   const leaderCode = `1x${selectedDeck.leaderID}`;
  //   const fullCode = `${leaderCode}\n${memberCode}`;

  //   // ✅ 複製到剪貼簿
  //   await Clipboard.setStringAsync(fullCode);

  //   alert(`Deck Code copied to clipboard:\n${fullCode}`);
  // };


  // const generateTeamCode = async () => {
  //   if (!selectedDeck || !selectedDeck.members || selectedDeck.members.length === 0) {
  //     Alert.alert('No cards in the deck!');
  //     return;
  //   }

  //   // 統計每張卡數量
  //   const cardMap: Record<string, number> = {};
  //   selectedDeck.members.forEach(card => {
  //     const cleanId = card.memberID.replace(/_p\d+$/i, '');
  //     cardMap[cleanId] = (cardMap[cleanId] || 0) + card.memberCount;
  //   });

  //   // 排序並組成 member code
  //   const sortedIds = Object.keys(cardMap).sort(sortById);
  //   const memberCode = sortedIds.map(id => `${cardMap[id]}x${id}`).join('\n');

  //   // Leader code + member code
  //   const leaderCode = `1x${selectedDeck.leaderID}`;
  //   const fullCode = `${leaderCode}\n${memberCode}`;

  //   //完整 Clipboard 复制流程，Web 下多重 fallback
  //   const copyToClipboardWeb = async (text: string) => {
  //     // 最新 API
  //     if (navigator.clipboard && navigator.clipboard.writeText) {
  //       await navigator.clipboard.writeText(text);
  //       return true;
  //     }
  //     // 传统 execCommand 方式
  //     const textarea = document.createElement('textarea');
  //     textarea.value = text;
  //     // 避免滚动条
  //     textarea.style.position = 'fixed';
  //     textarea.style.opacity = '0';
  //     document.body.appendChild(textarea);
  //     textarea.select();
  //     try {
  //       const success = document.execCommand('copy');
  //       return success;
  //     } finally {
  //       document.body.removeChild(textarea);
  //     }
  //   };

  //   try {
  //     if (Platform.OS === 'web') {
  //       const ok = await copyToClipboardWeb(fullCode);
  //       if (!ok) throw new Error('execCommand failed');
  //     } else {
  //       await Clipboard.setStringAsync(fullCode);
  //     }
  //     Alert.alert('Deck Code copied to clipboard:', fullCode);
  //   } catch (err) {
  //     console.error('Clipboard write failed', err);
  //     Alert.alert(
  //       'Copy failed',
  //       '無法自動複製到剪貼簿，請手動長按並複製以下文字：\n\n' + fullCode
  //     );
  //   }
  // };

    const generateTeamCode = () => {
      console.log('▶️ generateTeamCode called, selectedDeck:', selectedDeck);
      if (!selectedDeck || !selectedDeck.members || selectedDeck.members.length === 0) {
        setTeamCode('');
        return;
      }

      // 統計每張卡數量
      const cardMap: Record<string, number> = {};
      selectedDeck.members.forEach(card => {
        //const cleanId = card.memberID.replace(/_p\d+$/i, '');
        const cleanId = card.memberID.split('_')[0];

        cardMap[cleanId] = (cardMap[cleanId] || 0) + card.memberCount;
      });

      // 排序並組成代碼
      const sortedIds = Object.keys(cardMap).sort(sortById);
      const memberCode = sortedIds.map(id => `${cardMap[id]}x${id}`).join('\n');
      const cleanLeaderId = selectedDeck.leaderID.split('_')[0];
      const leaderCode = `1x${cleanLeaderId}`;
      const fullCode = `${leaderCode}\n${memberCode}`;

      // 顯示在 TextInput，讓使用者手動複製
      console.log('✅ fullCode:', fullCode);
      
      setTeamCode(fullCode);
      setCodeModalVisible(true);
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
  
  const confirmDeleteDeck = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this deck?');
      if (confirmed) {
        deleteDeck();
      }
    } else {
      Alert.alert(
        'Delete Deck',
        'Are you sure you want to delete this deck?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: deleteDeck,
          },
        ]
      );
    }
  };
  
  const deleteDeck = () => {
    setFilteredList(prev => prev.filter(deck => deck.deckName !== selectedDeck.deckName));
    setSelectedDeck(null);
    alert('Deck deleted.');
  };


  const leaderCard = selectedDeck?.leaderID
    ? allCardData.find(c => c.id === selectedDeck.leaderID)
    : null;
  // 如果 color 字段可能是 "Red/Green"、"Yellow" 之类，就拆成数组
  const leaderColors = leaderCard? leaderCard.color.split('/').map(c => c.trim().toLowerCase()): [];
  
  



  // 然后在 JSX 的 Deck List 部分改成：
  {/* Deck List */}
  <FlatList
    data={filteredList}
    keyExtractor={(item, index) => `${item.deckName}_${index}`}
    renderItem={renderItem}
    numColumns={2}
    columnWrapperStyle={styles.deckRow}
  />
  {/* Paste Team function */}
  // const handleImportConfirm = () => {
  //   clearTeamList();//Clean teamlist first
  //   const lines = importText.split('\n');
  //   const newCards = [];
  
  //   for (const line of lines) {
  //     const match = line.trim().match(/(\d+)x([A-Z0-9\-]+)/);
  //     if (match) {
  //       const [, countStr, id] = match;
  //       const count = parseInt(countStr);
  //       const found = allCardData.find(card => card.id === id);
  //       if (found) {
  //         newCards.push({ ...found, count });
  //       }
  //     }
  //   }
  
  //   const mergedTeam = [...teamList];
  
  //   for (const card of newCards) {
  //     const existing = mergedTeam.find(item => item.id === card.id);
  //     if (existing) {
  //       existing.count = Math.min(existing.count + card.count, 4);
  //     } else {
  //       if (card.card_catalog === 'Leader' && mergedTeam.some(c => c.card_catalog === 'Leader')) continue;
  //       mergedTeam.push({ ...card, count: Math.min(card.count, 4) });
  //     }
  //   }
  //   setTeamList(newCards); // 直接覆蓋整個隊伍
  //   //setTeamList(mergedTeam);
  //   setIsImportModalVisible(false);
  //   setImportText('');
  // };

  const handleImportConfirm = () => {
  // 按行解析輸入文字
  const lines = importText.trim().split('\n');
  const importedCards: { memberID: string; memberCount: number }[] = [];

  for (const line of lines) {
    const match = line.match(/(\d+)x([A-Z0-9\-]+)/);
    if (match) {
      const [, countStr, id] = match;
      const count = parseInt(countStr, 10);
      const found = allCardData.find(card => card.id === id);
      if (found) {
        importedCards.push({
          memberID: id,
          memberCount: Math.min(count, 4), // 每張卡最多 4
        });
      }
    }
  }

  // 建立新的 Deck 物件
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  // 假設第一張 1x 當作 Leader
  const leaderEntry = importedCards.find(c => c.memberCount === 1);
  const newDeck = {
    leaderID: leaderEntry?.memberID || '',
    members: importedCards
      .filter(c => c.memberCount > 1)
      .map(c => ({ memberID: c.memberID, memberCount: c.memberCount })),
    deckDate: today,
    deckName: `Imported ${today}`,
  };

  // 加到 FlatList 資料源
  setFilteredList(prev => [...prev, newDeck]);
  setAllDecks(prev => [...prev, newDeck]);

  // 關閉 Import Modal 並清空輸入
  setIsImportModalVisible(false);
  setImportText('');
};




  {/* Paste Deck fuction */}
  const pasteDeckFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getStringAsync();
      if (!clipboardContent) {
        alert('Clipboard is empty!');
        return;
      }
  
      const lines = clipboardContent.trim().split('\n').map(line => line.trim());
      if (lines.length === 0) {
        alert('No valid data found!');
        return;
      }
  
      const newDeck = {
        leaderID: '',
        members: [],
        deckDate: new Date().toISOString().split('T')[0],
        deckColor: '',
        deckName: 'Pasted Deck',
      };
  
      lines.forEach(line => {
        const match = line.match(/^(\d+)x(.+)$/);
        if (match) {
          const count = parseInt(match[1], 10);
          const id = match[2].trim();
  
          if (count === 1 && !newDeck.leaderID) {
            // First line = Leader
            newDeck.leaderID = id;
          } else {
            newDeck.members.push({ memberID: id, memberCount: count });
          }
        }
      });
  
      if (!newDeck.leaderID) {
        alert('Invalid format: Missing Leader');
        return;
      }
  
      setSelectedDeck(newDeck);
    } catch (error) {
      console.error('Failed to paste deck:', error);
      alert('Failed to paste deck.');
    }
  };
  
  {/* count card fuction */}
  const totalMembersCount = selectedDeck?.members.reduce((sum, item) => sum + item.memberCount, 0) || 0;
  const totalCardsCount = totalMembersCount + (selectedDeck?.leaderID ? 1 : 0);

  {/* Json */}
  const exportDecksAsJSON = async () => {
    try {
      const jsonString = JSON.stringify(filteredList, null, 2);
  
      if (Platform.OS === 'web') {
        // Web 下載 JSON 檔
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'DeckList.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // 手機版 儲存檔案並分享
        const path = FileSystem.documentDirectory + 'DeckList.json';
        await FileSystem.writeAsStringAsync(path, jsonString, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(path);
      }
    } catch (error) {
      console.error('Export JSON Failed:', error);
      alert('Export Failed.');
    }
  };

  const importDecksFromJSON = async (event = null) => {
    try {
      let fileContent = '';
  
      if (Platform.OS === 'web') {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          fileContent = e.target.result;
          mergeDecks(fileContent);
        };
        reader.readAsText(file);
      } else {
        const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
        if (res.canceled === false && res.assets && res.assets.length > 0) {
          const fileUri = res.assets[0].uri;
          fileContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
          console.log('File Content (Mobile):', fileContent);  // Debug
          mergeDecks(fileContent);
        } else {
          console.log('Document Picker cancelled or failed:', res);
        }
      }
    } catch (error) {
      console.error('Import JSON Failed:', error);
      alert('Import Failed.');
    }
  };
  
  
  const mergeDecks = (jsonString) => {
    try {
      console.log('Merging decks from JSON:', jsonString); // Debug
  
      const importedDecks = JSON.parse(jsonString);
  
      if (!Array.isArray(importedDecks)) {
        alert('Invalid JSON Format: Expected an array.');
        return;
      }
  
      const validDecks = importedDecks.filter(deck => deck.deckName && deck.leaderID && Array.isArray(deck.members));
      console.log('Valid decks:', validDecks); // Debug
  
      const mergedDecks = [...filteredList];
  
      validDecks.forEach(importedDeck => {
        const index = mergedDecks.findIndex(deck => deck.deckName === importedDeck.deckName);
        if (index === -1) {
          mergedDecks.push(importedDeck);
        } else {
          mergedDecks[index] = importedDeck;
        }
      });
  
      setFilteredList(mergedDecks);  // ✅ 更新 filteredList
      alert(`Import Successful! Imported ${validDecks.length} deck(s).`);
    } catch (error) {
      console.error('Merge Error:', error);
      alert('Invalid JSON Format.');
    }
  };
  
  const renderCardItem = ({ item }) => (
    <TouchableOpacity
          style={[styles.cardContainer, { width: cardWidth, margin: cardMargin }]}
          onPress={() => handleAddCard(item)}
          onLongPress={() => setSelectedCard(item)}
        >
          <View style={{ position: 'relative', width: '100%', aspectRatio: 0.7 }}>
            <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="contain" />
            {(
              selectedDeck?.leaderID === item.id ||
              selectedDeck?.members.some(m => m.memberID === item.id)
            ) && (
              <View style={styles.checkIconOverlay}>
                <MaterialIcons name="check-circle" size={24} color={currentTheme.selectedButtonBackground} />
              </View>
            )}
          </View>
        </TouchableOpacity>


  );


  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Deck List */}
      {/* Search Bar */}
      <View style={styles.searchContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TextInput
          placeholder="Search..."
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor={currentTheme.secondaryText}
          style={[styles.searchInput, { color: currentTheme.text, borderColor: currentTheme.border, backgroundColor: currentTheme.background }]}
        />
        <TouchableOpacity  
          style={{ justifyContent: 'center', alignItems: 'center', width: 40, height: 40 }} onPress={() => setSearchText('')}
          >
        <MaterialIcons name="refresh" size={18} color={currentTheme.buttonText} />
        </TouchableOpacity>

        {/* Add Deck 按鈕 */}
        <TouchableOpacity 
          style={[styles.addDeckButton, { borderColor: currentTheme.border, backgroundColor: currentTheme.buttonBackground }]}
          onPress={() => {
            // ✅ 不立刻開啟 Modal，只是準備一個新的 Deck
            const today = new Date().toISOString().split('T')[0];
            const newDeck = {
              leaderID: '',
              members: [],
              deckDate: today,      
              deckColor: '',
              deckName: '',
            };
            setSelectedDeck(newDeck);
            setIsCardListModalVisible(true); // 👈 直接開啟選卡 modal
          }}
        >
          <MaterialIcons name="add-box" size={18} color={currentTheme.buttonText} />
        </TouchableOpacity>

        {/* Paste Team */}
        <TouchableOpacity
          style={[styles.addDeckButton, { borderColor: currentTheme.border, backgroundColor: currentTheme.buttonBackground }]}
          //onPress={pasteDeckFromClipboard}
          onPress={() => setIsImportModalVisible(true)}
        >
          <MaterialIcons name="content-paste" size={18} color={currentTheme.buttonText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.addDeckButton, { borderColor: currentTheme.border, backgroundColor: currentTheme.buttonBackground }]}
          onPress={exportDecksAsJSON}
        >
          <MaterialIcons name="file-download" size={18} color={currentTheme.buttonText} />
        </TouchableOpacity>

        {/* Import deck*/}
        <TouchableOpacity
          style={[styles.addDeckButton, { borderColor: currentTheme.border, backgroundColor: currentTheme.buttonBackground }]}
          onPress={importDecksFromJSON}
        >
          <MaterialIcons name="file-upload" size={18} color={currentTheme.buttonText} />
        </TouchableOpacity>

        </ScrollView>
      </View>
      

      {/* Deck List */}
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

          <TextInput
            placeholder="Enter Deck Name"
            value={deckNameInput}
            onChangeText={(text) => {
              setDeckNameInput(text);
              setSelectedDeck(prev => prev ? { ...prev, deckName: text } : prev);
            }}
            placeholderTextColor={currentTheme.secondaryText}
            style={[
              styles.deckNameInput,
              {
                color: currentTheme.text,
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.background,
              },
            ]}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
            {/* Total Cards: XX/51 */}
            <Text
              style={{
                color: totalCardsCount > 51 ? 'red' : currentTheme.text,
                fontSize: 16,
                textAlign: 'center',
                marginBottom: 10,
                fontWeight: totalCardsCount > 51 ? 'bold' : 'normal',
              }}
            >
              Total Cards: {totalCardsCount}/51
            </Text>
          </View>
          

          



          {/* Team List Scrollable Area */}
          <ScrollView contentContainerStyle={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'flex-start', paddingBottom: 20 }}>
            
            {/* Leader 卡片放最前 */}
            {selectedDeck?.leaderID ? (() => {
              const leaderCard = allCardData.find(c => c.id === selectedDeck.leaderID);
              return (
                <View
                  key={`leader_${selectedDeck.leaderID}`}
                  style={[styles.cardContainer, { width: cardWidth, borderColor: currentTheme.border, marginBottom: 12 }]}
                >
                  <TouchableOpacity 
                    onPress={() => setSelectedCard(leaderCard)}
                    onLongPress={() => setSelectedCard(leaderCard)}  // 長按同樣進詳情
                   >
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: leaderCard?.image_url }} style={styles.cardImage} />
                      <View style={[styles.countOverlay, { backgroundColor: 'blue' }]}>
                        <Text style={styles.countText}>1</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Text style={{ color: currentTheme.text, textAlign: 'center', marginTop: 4 }}>{leaderCard?.id}</Text>

                  {/* 刪除 Leader 按鈕 */}
                  <TouchableOpacity
                    style={{ marginTop: 6, paddingVertical: 4, alignItems: 'center' }}
                    onPress={() => setSelectedDeck(prev => ({ ...prev, leaderID: null }))}
                  >
                    <MaterialIcons name="delete" size={18} color={currentTheme.buttonText} />
                  </TouchableOpacity>
                </View>
              );
            })() : null}

            {/* 其他 Members */}
            {selectedDeck?.members.map((item, index) => {
              const cardInfo = allCardData.find(c => c.id === item.memberID);
              return (
                <View
                  key={`${item.memberID}_${index}`}
                  style={[styles.cardContainer, { width: cardWidth, borderColor: currentTheme.border, marginBottom: 12 }]}
                >
                  {/* 圖片區域 */}
                  <TouchableOpacity
                   onPress={() => setSelectedCard(cardInfo)}
                   onLongPress={() => setSelectedCard(cardInfo)}  // 加上長按也開詳情
                   >
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: cardInfo?.image_url }} style={styles.cardImage} />
                      <View style={styles.countOverlay}>
                        <Text style={styles.countText}>{item.memberCount}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {/* ID 文字 */}
                  <Text style={{ color: currentTheme.text, textAlign: 'center', marginTop: 4 }}>{cardInfo?.id}</Text>

                  {/* + - 按鈕 */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
                    <TouchableOpacity
                      style={{ paddingHorizontal: 8 }}
                      onPress={() => {
                        if (item.memberCount <= 1) {
                          const updatedMembers = selectedDeck.members.filter(m => m.memberID !== item.memberID);
                          setSelectedDeck(prev => ({ ...prev, members: updatedMembers }));
                        } else {
                          const updatedMembers = selectedDeck.members.map(m =>
                            m.memberID === item.memberID ? { ...m, memberCount: m.memberCount - 1 } : m
                          );
                          setSelectedDeck(prev => ({ ...prev, members: updatedMembers }));
                        }
                      }}
                    >
                      <Text style={{ color: currentTheme.text, fontSize: 20 }}>➖</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ paddingHorizontal: 8 }}
                      onPress={() => {
                        if (item.memberCount < 4) {
                          const updatedMembers = selectedDeck.members.map(m =>
                            m.memberID === item.memberID ? { ...m, memberCount: m.memberCount + 1 } : m
                          );
                          setSelectedDeck(prev => ({ ...prev, members: updatedMembers }));
                        } 
                      }}
                    >
                      <Text style={{ color: currentTheme.text, fontSize: 20 }}>➕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

          </ScrollView>


          {/* 🔹 Fixed Buttons at Bottom 🔹 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>


            {/* Add deck */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: currentTheme.genCodeButton,
                  flex: 1,
                  marginHorizontal: 5,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
              onPress={() => setIsCardListModalVisible(true)}
            >
              <MaterialIcons name="add" size={18} color={currentTheme.buttonText} />
              {/*<Text style={{ color: '#fff', textAlign: 'center' }}>+ Add Card</Text>*/}
            </TouchableOpacity>


            {/* Save */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: currentTheme.genCodeButton,
                  flex: 1,
                  marginHorizontal: 5,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
              onPress={() => {
                // 1. 必要校验
                if (!validateDeck()) return;
                const name = deckNameInput.trim();
                if (!name) {
                  alert('Please enter a deck name!');
                  return;
                }

                // 2. 构造要保存的对象
                const today = new Date().toISOString().split('T')[0];
                const baseDeck = {
                  ...selectedDeck,
                  deckName: name,
                  deckDate: selectedDeck?.deckDate || today,
                };
                // 如果是更新操作，给它加上 updatedAt
                const deckToSave = selectedDeckIndex !== null
                  ? { ...baseDeck, updatedAt: today }
                  : baseDeck;

                // 3. 根据 selectedDeckIndex 决定「新建」还是「更新」
                if (selectedDeckIndex !== null) {
                  // 更新已有 team
                  setFilteredList(prev => {
                    const copy = [...prev];
                    copy[selectedDeckIndex] = deckToSave;
                    return copy;
                  });
                  setAllDecks(prev => {
                    const copy = [...prev];
                    copy[selectedDeckIndex] = deckToSave;
                    return copy;
                  });
                  alert('Team updated!');
                } else {
                  // 新建 team
                  setFilteredList(prev => [...prev, deckToSave]);
                  setAllDecks(prev => [...prev, deckToSave]);
                  alert('Team saved!');
                }

                // 4. 关闭 Modal，重置状态
                setSelectedDeck(null);
                //setIsModalVisible(false);
              }}
            >
              <MaterialIcons name="save" size={18} color={currentTheme.buttonText} />
            </TouchableOpacity>

            {/* Gen Code */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.genCodeButton, flex: 1, marginHorizontal: 5 }]}
              onPress={generateTeamCode}
            >
              <MaterialIcons name="code" size={18} color={currentTheme.buttonText} />
              {/*<Text style={{ color: '#fff', textAlign: 'center' }}>Gen Code</Text>*/}
            </TouchableOpacity>

            {/* Delete Deck */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.clearButton, flex: 1, marginHorizontal: 5 }]}
              onPress={confirmDeleteDeck}
              >
              <MaterialIcons name="delete" size={18} color={currentTheme.buttonText} />
            </TouchableOpacity>




            {/* Share Image */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: currentTheme.saveButton, flex: 1, marginHorizontal: 5 }]}
              onPress={() => setScreenshotModalVisible(true)}
            >
              <MaterialIcons name="image" size={18} color={currentTheme.buttonText} />
              {/*<Text style={{ color: '#fff', textAlign: 'center' }}>Share</Text>*/}
            </TouchableOpacity>

            {/* Close */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: currentTheme.deleteButton,
                  flex: 1,
                  marginHorizontal: 5,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
              onPress={() => setSelectedDeck(null)}
            >
              <MaterialIcons name="close" size={18} color={currentTheme.buttonText} />
              {/*<Text style={{ color: '#fff', textAlign: 'center' }}>Close</Text>*/}
            </TouchableOpacity>

          </View>

          {/* 🔹 Ads Placeholder 加在這裡 🔹 */}
          {/* Ads Placeholder */}
          <View style={[styles.adsContainer, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.adsText, { color: currentTheme.text }]}>[Ad Placeholder]</Text>
          </View>

        </View>
      </Modal>


      {/* Card List Modal */}
      <Modal visible={isCardListModalVisible} animationType="slide" transparent={false} onRequestClose={() => setIsCardListModalVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Choose Card</Text>

          
          {/* 搜尋欄位 */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search cards..."
              value={cardSearchText}
              onChangeText={setCardSearchText}
              placeholderTextColor={currentTheme.secondaryText}
              style={[styles.searchInput,{width: 20, color: currentTheme.text, borderColor: currentTheme.border, backgroundColor: currentTheme.background }]}
            />
            {/* Reset button */}
            <TouchableOpacity 
              style={{ justifyContent: 'center', alignItems: 'center', width: 40, height: 40 }}
              onPress={() => setCardSearchText('')}>
              <MaterialIcons name="refresh" size={18} color={currentTheme.buttonText} />
            </TouchableOpacity>


            {/* Done button */}
            <TouchableOpacity
              style={{ justifyContent: 'center', alignItems: 'center', width: 40, height: 40 }}
              onPress={() => setIsCardListModalVisible(false)}
            >
              <MaterialIcons name="done" size={18} color={currentTheme.buttonText} />
              {/*<Text style={{ color: currentTheme.buttonText, marginLeft: 5 }}>Done</Text>*/}
            </TouchableOpacity>


          </View>

          {/* 卡片清單 */}
          <FlatList
            data={allCardData.filter(card => {
                // 先做搜尋過濾
                const matchSearch =
                  card.card_name.toLowerCase().includes(cardSearchText.toLowerCase()) ||
                  card.id.toLowerCase().includes(cardSearchText.toLowerCase())||
                  card.color.toLowerCase().includes(cardSearchText.toLowerCase())||
                  card.card_catalog.toLowerCase().includes(cardSearchText.toLowerCase())||
                  card.text.toLowerCase().includes(cardSearchText.toLowerCase())||
                  card.feature.toLowerCase().includes(cardSearchText.toLowerCase())||
                  card.life.toLowerCase().includes(cardSearchText.toLowerCase())||
                  card.power.toLowerCase().includes(cardSearchText.toLowerCase())||
                  card.attribute.toLowerCase().includes(cardSearchText.toLowerCase())||
                  card.get_info.toLowerCase().includes(cardSearchText.toLowerCase())
                
                ;
                if (!matchSearch) return false;

              // 再根据是否已有 Leader 决定要不要显示 Leader 卡
              if (!selectedDeck?.leaderID) {
                // 没有 Leader：只显示 Leader 卡
                return card.card_catalog === 'Leader';
              } else {
                // 已有 Leader：排除所有 Leader 卡
                return (
                  card.card_catalog !== 'Leader' &&
                  leaderColors.includes(card.color.toLowerCase())
                );
              }
            })}
            
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={renderCardItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />

          {/* 🔹 Ads Placeholder 加在這裡 🔹 */}
          <View style={[styles.adsContainer, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.adsText, { color: currentTheme.text }]}>[Ad Placeholder]</Text>
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
          <Text style={[styles.title, { color: currentTheme.text }]}>TCGKraken.com</Text>

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

      {/* Gen Team code Modal */}
      <Modal
       visible={codeModalVisible}
       animationType="slide"
       transparent={true}
       onRequestClose={() => setCodeModalVisible(false)}
     >
        <View style={[styles.modalContainer, { backgroundColor: currentTheme.background, flex: 1 }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>TCGKraken.com</Text>
          <Text style={[styles.adsText, { color: currentTheme.text }]}>* For OPTCG SIM</Text>

          <View style={styles.searchContainer}>
            <TextInput
            style={[styles.codeInput, { color: currentTheme.text }]}
            value={teamCode}
            multiline
            editable={false}
            selectTextOnFocus
            />
          </View>

          <TouchableOpacity 
            onPress={() => setCodeModalVisible(false)} 
            style={[styles.saveButton, { backgroundColor: currentTheme.saveButton, flex: 0.2, marginHorizontal: 2 }]}
          >
            <MaterialIcons name="done" size={18} color={currentTheme.buttonText} />
          </TouchableOpacity>
        </View>

         {/* Ads Placeholder */}
        <View style={[styles.adsContainer, { backgroundColor: currentTheme.background }]}>
          <Text style={[styles.adsText, { color: currentTheme.text }]}>[Ad Placeholder]</Text>
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
  doneButton: '#2196F3',
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
  doneButton: '#2196F3',
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
    width: '100%',
  },
  codeInput: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    width: '100%',
    minHeight: 300,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
    aspectRatio: 0.7,
    borderRadius: 4,
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
  doneButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center', // 垂直置中
    borderRadius: 6,
    marginTop: 10,
  },

  addDeckButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    marginLeft: 8,
    justifyContent: 'center', // 垂直置中
    alignItems: 'center',     // 水平置中
  },

  saveButton: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center', // 垂直置中
    // 如果需要边框：
    // borderWidth: 1,
    // borderColor: '#ccc',
  },
  
  deckNameInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    height: 36,
    marginBottom: 10,
  },
    // 打勾标记的样式
  checkIconOverlay: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  
  
  
 
  

});
