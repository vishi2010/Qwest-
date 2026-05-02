# Kwest IRL — React Native Frontend

Black. White. No noise.

## Stack
- React Native (Expo ~50)
- expo-image-picker (camera + gallery)
- @react-native-async-storage/async-storage (token persistence)
- Zero UI libraries — custom components only

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Point the app at your backend
#    Edit src/api.js line 2:
export const API_BASE = 'http://<YOUR_MACHINE_IP>:8000';
#    Use your machine's local IP (not localhost) when running on a physical device.

# 3. Start the backend
cd ../KwestIRL
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 4. Seed quests (optional)
python seed_quests.py

# 5. Start Expo
npx expo start
# Scan QR with Expo Go (iOS/Android) or press i/a for simulator
```

## Screens

| Screen      | Route key      | Notes                              |
|-------------|----------------|------------------------------------|
| Sign In     | `signin`       | Token persisted via AsyncStorage   |
| Register    | `register`     | Region quick-select chips          |
| Quests      | `quests`       | Grouped by difficulty, pull-to-refresh |
| Quest Detail| `detail`       | Camera + gallery upload, AI verify |
| Leaderboard | `leaderboard`  | Podium top 3, ranked list below    |

## Design System

- **Palette:** Pure black (`#000000`) / off-black surfaces / white text
- **No color difficulty coding** — luminance only (easy = dim, legendary = bright white)
- **Typography:** System heavy weights + Courier New for mono labels
- **Motion:** Fade-in on every screen mount, scale spring on button press, animated XP bar

## File Structure

```
App.js                  — Router + toast + session restore
src/
  api.js                — fetch wrappers (apiGet, apiPost, apiUpload)
  theme.js              — colors, fonts, spacing, radius, getTitle()
  components.js         — shared UI (FadeScreen, PrimaryButton, Field, DiffBadge, XPBar, Toast …)
  screens/
    SignInScreen.js
    RegisterScreen.js
    QuestsScreen.js
    QuestDetailScreen.js
    LeaderboardScreen.js
```
