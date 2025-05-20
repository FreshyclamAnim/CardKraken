import React from 'react';
import { Platform, Dimensions } from 'react-native';
import TopdeckScreenWeb from '../../components/onepiece/TopdeckWeb';
import TopdeckScreenMobile from '../../components/onepiece/TopdeckMobile';

const screenWidth = Dimensions.get('window').width;

export default function TopdeckScreen() {
  // 你可以改為只根據 screenWidth 切換，避免 Tablet 被誤判成 Web
  const isMobile = Platform.OS !== 'web' || screenWidth < 600;

  return isMobile ? <TopdeckScreenMobile /> : <TopdeckScreenWeb />;
}