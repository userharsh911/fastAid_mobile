import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, Easing } from 'react-native';

export default function SplashScreen({ onFinish }) {
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.72)).current;
  const logoRotate = useRef(new Animated.Value(-10)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.8)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const splashAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          speed: 14,
          bounciness: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.62,
          duration: 340,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 1.15,
          duration: 540,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          speed: 16,
          bounciness: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleTranslateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(700),
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]);

    splashAnimation.start(({ finished }) => {
      if (finished && typeof onFinish === 'function') {
        onFinish();
      }
    });

    return () => {
      splashAnimation.stop();
    };
  }, [glowOpacity, glowScale, logoOpacity, logoRotate, logoScale, onFinish, screenOpacity, subtitleOpacity, subtitleTranslateY, titleOpacity, titleTranslateY]);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [-10, 0],
    outputRange: ['-10deg', '0deg'],
  });

  return (
    <Animated.View
      className='flex-1 items-center justify-center bg-slate-950'
      style={{ opacity: screenOpacity }}
    >
      <Animated.View
        className='absolute h-56 w-56 rounded-full bg-rose-500/20'
        style={{
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }}
      />

      <View className='items-center'>
        <Animated.View
          className='rounded-3xl border border-white/15 bg-white/5 p-4'
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }, { rotate: logoRotateInterpolate }],
          }}
        >
          <Image
            source={require('../assets/images/logo.png')}
            className='h-20 w-20'
            resizeMode='contain'
          />
        </Animated.View>

        <Animated.Text
          className='mt-5 text-4xl font-black tracking-tight text-white'
          style={{
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
          }}
        >
          FastAid
        </Animated.Text>

        <Animated.Text
          className='mt-2 text-xs font-bold uppercase tracking-widest text-rose-200'
          style={{
            opacity: subtitleOpacity,
            transform: [{ translateY: subtitleTranslateY }],
          }}
        >
          Emergency Help, Anytime
        </Animated.Text>
      </View>
    </Animated.View>
  );
}