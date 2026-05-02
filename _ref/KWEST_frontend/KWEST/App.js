import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Platform, Animated } from 'react-native';
import { colors } from './src/theme';
import { Toast } from './src/components';
import { loadToken, clearToken, apiGet } from './src/api';

import SignInScreen     from './src/screens/SignInScreen';
import RegisterScreen   from './src/screens/RegisterScreen';
import QuestsScreen     from './src/screens/QuestsScreen';
import QuestDetailScreen from './src/screens/QuestDetailScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

// ─── Simple state-machine router ─────────────────────────────
// Screen names: 'loading' | 'signin' | 'register' | 'quests' | 'detail' | 'leaderboard'

export default function App() {
  const [screen, setScreen]   = useState('loading');
  const [params, setParams]   = useState({});
  const [toast, setToast]     = useState('');
  const toastTimer             = useRef(null);

  // Restore session on launch
  useEffect(() => {
    (async () => {
      try {
        const t = await loadToken();
        if (t) {
          const user = await apiGet('/auth/me', t);
          setParams({ token: t, user });
          setScreen('quests');
        } else {
          setScreen('signin');
        }
      } catch {
        await clearToken();
        setScreen('signin');
      }
    })();
  }, []);

  function navigate(screenName, newParams = {}) {
    setParams(prev => ({ ...prev, ...newParams }));
    setScreen(screenName);
  }

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3000);
  }

  async function handleSignOut() {
    await clearToken();
    setParams({});
    setScreen('signin');
  }

  const sharedProps = {
    navigate,
    token:   params.token,
    user:    params.user,
    quest:   params.quest,
    toast,
    setToast: showToast,
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.bg}
      />

      {/* Toast layer — above all screens */}
      <Toast message={toast} />

      {screen === 'loading'      && <LoadingScreen />}
      {screen === 'signin'       && <SignInScreen {...sharedProps} />}
      {screen === 'register'     && <RegisterScreen {...sharedProps} />}
      {screen === 'quests'       && (
        <QuestsScreen {...sharedProps} onSignOut={handleSignOut} />
      )}
      {screen === 'detail'       && (
        <QuestDetailScreen {...sharedProps} />
      )}
      {screen === 'leaderboard'  && (
        <LeaderboardScreen {...sharedProps} />
      )}
    </View>
  );
}

function LoadingScreen() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.loadingScreen}>
      <Animated.Text style={[styles.loadingText, { opacity }]}>K</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: 6,
  },
});
