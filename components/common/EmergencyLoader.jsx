import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Text, View } from 'react-native'

const resolveSize = (size) => {
  if (typeof size === 'number' && Number.isFinite(size)) {
    return Math.max(24, size)
  }

  if (size === 'small') return 30
  if (size === 'large') return 64
  return 48
}

export default function EmergencyLoader({
  size = 'default',
  label = 'Loading...',
  color = '#dc2626',
  fullScreen = false,
}) {
  const baseSize = resolveSize(size)
  const ringSize = Math.round(baseSize * 1.8)
  const coreSize = Math.round(baseSize * 0.72)
  const dotSize = Math.max(6, Math.round(baseSize * 0.14))

  const ringScale = useRef(new Animated.Value(0.62)).current
  const ringOpacity = useRef(new Animated.Value(0.35)).current
  const dotAnims = useRef([
    new Animated.Value(0.35),
    new Animated.Value(0.35),
    new Animated.Value(0.35),
  ]).current

  useEffect(() => {
    const ringLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.35,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 0.62,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0.35,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    )

    const dotLoops = dotAnims.map((dotAnim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 140),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 340,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0.35,
            duration: 340,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(180),
        ])
      )
    )

    ringLoop.start()
    dotLoops.forEach((loop) => loop.start())

    return () => {
      ringLoop.stop()
      dotLoops.forEach((loop) => loop.stop())
    }
  }, [dotAnims, ringOpacity, ringScale])

  return (
    <View
      style={{
        flex: fullScreen ? 1 : 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: ringSize,
          height: ringSize,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 2,
            borderColor: color,
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          }}
        />

        <View
          style={{
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            backgroundColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: Math.round(baseSize * 0.22), fontWeight: '900', letterSpacing: 0.8 }}>
            SOS
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        {dotAnims.map((dotAnim, index) => {
          const dotTranslateY = dotAnim.interpolate({
            inputRange: [0.35, 1],
            outputRange: [0, -5],
          })

          return (
            <Animated.View
              key={`loader-dot-${index}`}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: color,
                marginHorizontal: 4,
                opacity: dotAnim,
                transform: [{ translateY: dotTranslateY }],
              }}
            />
          )
        })}
      </View>

      {label ? (
        <Text style={{ marginTop: 12, color: '#6b7280', fontSize: 12, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' }}>
          {label}
        </Text>
      ) : null}
    </View>
  )
}
