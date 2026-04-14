import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Text, View } from 'react-native'

export default function VolunteerRadarSearch({
  size = 170,
  title = 'Finding Nearby Volunteers',
  subtitle = 'Scanning live 500m area around you',
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulseA = useRef(new Animated.Value(0)).current
  const pulseB = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const radarRotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )

    const pulseLoopA = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseA, {
          toValue: 1,
          duration: 1700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseA, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )

    const pulseLoopB = Animated.loop(
      Animated.sequence([
        Animated.delay(850),
        Animated.timing(pulseB, {
          toValue: 1,
          duration: 1700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseB, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    )

    radarRotateLoop.start()
    pulseLoopA.start()
    pulseLoopB.start()

    return () => {
      radarRotateLoop.stop()
      pulseLoopA.stop()
      pulseLoopB.stop()
    }
  }, [pulseA, pulseB, rotateAnim])

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const pulseAScale = pulseA.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.18],
  })

  const pulseAOpacity = pulseA.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0],
  })

  const pulseBScale = pulseB.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.18],
  })

  const pulseBOpacity = pulseB.interpolate({
    inputRange: [0, 1],
    outputRange: [0.24, 0],
  })

  const radarRadius = size / 2
  const lineHeight = radarRadius - 10

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radarRadius,
          borderWidth: 2,
          borderColor: '#fecaca',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff5f5',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: radarRadius,
            borderWidth: 2,
            borderColor: '#fca5a5',
            opacity: pulseAOpacity,
            transform: [{ scale: pulseAScale }],
          }}
        />

        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: radarRadius,
            borderWidth: 2,
            borderColor: '#f87171',
            opacity: pulseBOpacity,
            transform: [{ scale: pulseBScale }],
          }}
        />

        <View
          style={{
            position: 'absolute',
            width: size * 0.66,
            height: size * 0.66,
            borderRadius: (size * 0.66) / 2,
            borderWidth: 1,
            borderColor: '#fecaca',
          }}
        />

        <View
          style={{
            position: 'absolute',
            width: size * 0.38,
            height: size * 0.38,
            borderRadius: (size * 0.38) / 2,
            borderWidth: 1,
            borderColor: '#fecaca',
          }}
        />

        <Animated.View
          style={{
            position: 'absolute',
            width: 2,
            height: lineHeight,
            backgroundColor: '#dc2626',
            top: radarRadius - lineHeight,
            transform: [{ rotate: rotation }],
          }}
        />

        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#dc2626',
            borderWidth: 3,
            borderColor: '#fee2e2',
            zIndex: 5,
          }}
        />
      </View>

      <Text style={{ marginTop: 14, fontSize: 12, fontWeight: '900', letterSpacing: 0.9, color: '#991b1b', textTransform: 'uppercase' }}>
        {title}
      </Text>
      <Text style={{ marginTop: 5, fontSize: 12, fontWeight: '600', color: '#6b7280' }}>
        {subtitle}
      </Text>
    </View>
  )
}
