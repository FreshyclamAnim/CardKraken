// components/CardDetailModal.tsx
import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface Card {
  image_url: string;
  card_name: string;
  id: string;
  card_grade: string;
  life: string;
  power: string;
  color: string;
  attribute: string;
  counter: string;
  card_catalog: string;
  feature: string;
  text: string;
  get_info: string;
}

interface Props {
  visible: boolean;
  card: Card | null;
  index: number;
  total: number;
  isFavorite: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  onClose: () => void;
  theme: {
    background: string;
    text: string;
  };
}

export default function CardDetailModal({
  visible,
  card,
  index,
  total,
  isFavorite,
  onPrev,
  onNext,
  onToggleFavorite,
  onShare,
  onClose,
  theme,
}: Props) {
  if (!card) return null;

  const modalWidth = Math.min(screenWidth * 0.9, 800);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={[styles.cardBox, { width: modalWidth, backgroundColor: theme.background }]}>
            {/* 圖片 */}
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: card.image_url }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* 資訊 */}
            <View style={styles.infoWrapper}>
              <Text style={[styles.title, { color: theme.text }]}>{card.card_name}</Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="numbers" /> Id: {card.id}
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="star" /> Rare: {card.card_grade}
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="attach-money" /> Cost: {card.life}
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="flash-on" /> Power: {card.power}
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="palette" /> Color: {card.color}
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <FontAwesome5 name="fist-raised" /> Attribute: {card.attribute}
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <Entypo name="shield" /> Counter: {card.counter}
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="category" /> Type: {card.card_catalog}
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="book" /> Feature: {card.feature}
              </Text>

              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="notes" /> Effect:
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>{card.text}</Text>
              <Text style={styles.detail}>

              <Text style={[styles.detail, { color: theme.text }]}>
                <MaterialIcons name="notes" /> trigger:
              </Text>
              <Text style={[styles.detail, { color: theme.text }]}>{card.trigger}</Text>
              <Text style={styles.detail}></Text>
              
              
                <MaterialIcons name="collections-bookmark" /> Card Set(s): {card.get_info}
              </Text>

              {/* 按鈕列 */}
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onPrev} style={styles.navButton}>
                  <Text style={[styles.navText, { color: theme.text }]}>← Prev</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onNext} style={styles.navButton}>
                  <Text style={[styles.navText, { color: theme.text }]}>Next →</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onToggleFavorite} style={styles.navButton}>
                  <Text style={[styles.navText, { color: theme.text }]}>
                    {isFavorite ? '💖 Unfav' : '🤍 Fav'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onShare} style={styles.navButton}>
                  <Text style={[styles.navText, { color: theme.text }]}>📤 Share</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.navButton}>
                  <Text style={[styles.navText, { color: theme.text }]}>Close</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.pageIndicator, { color: theme.text }]}>
                {index + 1} / {total}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardBox: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'column',
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 400,
    borderRadius: 8,
  },
  infoWrapper: {
    width: '100%',
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  navButton: {
    margin: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  navText: {
    fontSize: 14,
  },
  pageIndicator: {
    textAlign: 'center',
    marginTop: 8,
  },
});
