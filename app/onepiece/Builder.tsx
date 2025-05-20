//Builder.tsx
import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import BuilderWeb from '../../components/onepiece/BuilderWeb';
import BuilderMobile from '../../components/onepiece/BuilderMobile';

export default function BuilderScreen() {
  const { width } = useWindowDimensions();
  // 只有在桌面 Web（Platform.OS==='web'）且宽度 ≥ 700 时才用 Web 版
  const isDesktopWeb = Platform.OS === 'web' && width >= 700;

  return isDesktopWeb
    ? <BuilderWeb />    // 桌面浏览器
    : <BuilderMobile /> // 原生 App 和手机浏览器都用移动端布局 :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
}
