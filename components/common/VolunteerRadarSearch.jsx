import React, { useEffect, useRef } from 'react'
import { Animated, Easing, Text, View } from 'react-native'

const C = {
  bg: '#070e1a',
  ringDim: '#0d2a3a',
  ringMid: '#0f3d52',
  sweep: '#00e5a0',
  sweepTrail1: '#00b87a',
  sweepTrail2: '#007a52',
  blip: '#00e5a0',
  centerBg: '#001a12',
  textPrimary: '#00e5a0',
  textSecondary: '#4a8f78',
  outerBorder: '#1a4a3a',
  grid: '#0a2030',
}

function BlipDot({ x, y, delay, size = 5 }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.6,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.delay(1800 + Math.random() * 600),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [anim])

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1.3] })
  const opacity = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 0.55] })

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.blip,
        left: x - size / 2,
        top: y - size / 2,
        opacity,
        transform: [{ scale }],
        shadowColor: C.blip,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 5,
        elevation: 4,
      }}
    />
  )
}

export default function VolunteerRadarSearch({
  size = 210,
  title = 'Finding Nearby Volunteers',
  subtitle = 'Scanning 500m live area',
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current
  const pulseA = useRef(new Animated.Value(0)).current
  const pulseB = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseA, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseA, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start()

    Animated.loop(
      Animated.sequence([
        Animated.delay(1100),
        Animated.timing(pulseB, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseB, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start()
  }, [rotateAnim, pulseA, pulseB])

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const trail1Rot = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-22deg', '338deg'],
  })

  const trail2Rot = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-44deg', '316deg'],
  })

  const trail3Rot = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-66deg', '294deg'],
  })

  const pulseAScale = pulseA.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.35] })
  const pulseAOpacity = pulseA.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.45, 0.2, 0] })

  const pulseBScale = pulseB.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.35] })
  const pulseBOpacity = pulseB.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.3, 0.15, 0] })

  const r = size / 2
  const lineH = r - 10
  const cx = r

  const blips = [
    { x: cx + size * 0.24, y: cx - size * 0.16, delay: 900 },
    { x: cx - size * 0.27, y: cx - size * 0.08, delay: 450 },
    { x: cx + size * 0.09,  y: cx + size * 0.32, delay: 1800 },
    { x: cx - size * 0.14, y: cx + size * 0.24, delay: 300 },
    { x: cx + size * 0.33, y: cx + size * 0.12, delay: 1350 },
  ]

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>

      {/* Outer glow ring */}
      <View
        style={{
          position: 'absolute',
          width: size + 20,
          height: size + 20,
          borderRadius: (size + 20) / 2,
          borderWidth: 1,
          borderColor: '#00e5a022',
        }}
      />

      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          borderWidth: 1.5,
          borderColor: C.outerBorder,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: C.bg,
          overflow: 'hidden',
          shadowColor: C.sweep,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.18,
          shadowRadius: 22,
          elevation: 8,
        }}
      >
        {/* Pulse rings */}
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: r,
            borderWidth: 1,
            borderColor: C.sweep,
            opacity: pulseAOpacity,
            transform: [{ scale: pulseAScale }],
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: r,
            borderWidth: 1,
            borderColor: C.sweep,
            opacity: pulseBOpacity,
            transform: [{ scale: pulseBScale }],
          }}
        />

        {/* Static concentric rings */}
        {[0.72, 0.48, 0.26].map((ratio, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: size * ratio,
              height: size * ratio,
              borderRadius: (size * ratio) / 2,
              borderWidth: 1,
              borderColor: i === 0 ? C.ringMid : C.ringDim,
              borderStyle: i === 2 ? 'solid' : 'solid',
            }}
          />
        ))}

        {/* Crosshair */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: 1,
            backgroundColor: C.grid,
          }}
        />
        <View
          style={{
            position: 'absolute',
            width: 1,
            height: size,
            backgroundColor: C.grid,
          }}
        />

        {/* Sweep trail line 3 (faintest) */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 1.5,
            height: lineH,
            backgroundColor: C.sweepTrail2,
            opacity: 0.22,
            top: r - lineH,
            transform: [{ rotate: trail3Rot }],
          }}
        />

        {/* Sweep trail line 2 */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 1.5,
            height: lineH,
            backgroundColor: C.sweepTrail2,
            opacity: 0.42,
            top: r - lineH,
            transform: [{ rotate: trail2Rot }],
          }}
        />

        {/* Sweep trail line 1 */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 2,
            height: lineH,
            backgroundColor: C.sweepTrail1,
            opacity: 0.65,
            top: r - lineH,
            transform: [{ rotate: trail1Rot }],
          }}
        />

        {/* Main sweep line */}
        <Animated.View
          style={{
            position: 'absolute',
            width: 2,
            height: lineH,
            backgroundColor: C.sweep,
            top: r - lineH,
            transform: [{ rotate: rotation }],
            shadowColor: C.sweep,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 6,
          }}
        />

        {/* Blip dots */}
        {blips.map((b, i) => (
          <BlipDot key={i} {...b} />
        ))}

        {/* Center dot */}
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: C.sweep,
            borderWidth: 2,
            borderColor: C.centerBg,
            zIndex: 10,
            shadowColor: C.sweep,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 10,
            elevation: 6,
          }}
        />
      </View>

      {/* Labels */}
      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Scanning pulse dot */}
          <ScanningDot />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 2.2,
              color: C.textPrimary,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Text>
        </View>
        <Text
          style={{
            marginTop: 6,
            fontSize: 12,
            fontWeight: '400',
            color: C.textSecondary,
            letterSpacing: 0.5,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  )
}

function ScanningDot() {
  const anim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start()
  }, [anim])

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#00e5a0',
        opacity: anim,
        shadowColor: '#00e5a0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 4,
      }}
    />
  )
}