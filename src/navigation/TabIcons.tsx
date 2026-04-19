import React from 'react';
import {View, StyleSheet} from 'react-native';

// Minimal, editorial outline icons drawn with View primitives.
// No SVG library needed. Stroke-weighted with borders, hairline-consistent.

type Props = {color: string; size?: number};

export function HomeIcon({color, size = 22}: Props) {
  const stroke = 1.6;
  const roof = size * 0.52;
  const body = size * 0.5;
  return (
    <View style={{width: size, height: size, alignItems: 'center'}}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: roof / 2,
          borderRightWidth: roof / 2,
          borderBottomWidth: roof / 2,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          marginTop: size * 0.1,
        }}
      />
      <View
        style={{
          width: roof,
          height: body,
          borderLeftWidth: stroke,
          borderRightWidth: stroke,
          borderBottomWidth: stroke,
          borderColor: color,
          marginTop: -stroke / 2,
        }}
      />
    </View>
  );
}

export function WorkIcon({color, size = 22}: Props) {
  const stroke = 1.6;
  const w = size * 0.78;
  const h = size * 0.92;
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
      <View
        style={{
          position: 'absolute',
          width: w * 0.82,
          height: h * 0.82,
          borderWidth: stroke,
          borderColor: color,
          opacity: 0.55,
          top: 1,
          left: 1,
        }}
      />
      <View
        style={{
          width: w,
          height: h,
          borderWidth: stroke,
          borderColor: color,
          backgroundColor: 'transparent',
          justifyContent: 'flex-start',
          paddingHorizontal: w * 0.18,
          paddingVertical: h * 0.22,
          gap: h * 0.12,
        }}>
        <View style={{height: stroke, backgroundColor: color}} />
        <View style={{height: stroke, width: '60%', backgroundColor: color, opacity: 0.6}} />
      </View>
    </View>
  );
}

export function UserIcon({color, size = 22}: Props) {
  const stroke = 1.6;
  const head = size * 0.36;
  const shoulderW = size * 0.78;
  const shoulderH = size * 0.42;
  return (
    <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 1}}>
      <View
        style={{
          width: head,
          height: head,
          borderRadius: head / 2,
          borderWidth: stroke,
          borderColor: color,
          marginBottom: -stroke,
        }}
      />
      <View
        style={{
          width: shoulderW,
          height: shoulderH,
          borderTopLeftRadius: shoulderW / 2,
          borderTopRightRadius: shoulderW / 2,
          borderWidth: stroke,
          borderBottomWidth: 0,
          borderColor: color,
        }}
      />
    </View>
  );
}
