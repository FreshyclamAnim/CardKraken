import React from 'react';
import { Platform, useWindowDimensions  } from 'react-native';
import CardListWeb from '../../components/onepiece/CardListWeb';
import CardListMobile from '../../components/onepiece/CardListMobile';

//const screenWidth = Dimensions.get('window').width;
export default function CardListScreen() {
    // 动态响应窗口宽度，避免只在模块加载时读取一次
  const { width } = useWindowDimensions();
  // 只有在真正的“桌面 Web”并且宽度 ≥ 700 时才用 Web 版
  const isDesktopWeb = Platform.OS === 'web' && width >= 700;

  // // 你可以改為只根據 screenWidth 切換，避免 Tablet 被誤判成 Web
  // const isMobile = Platform.OS !== 'web' || screenWidth < 700;

  return isDesktopWeb
    ? <CardListWeb />    // 桌面浏览器
    : <CardListMobile /> // 手机浏览器
}