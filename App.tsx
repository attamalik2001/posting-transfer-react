import React from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { WebView } from 'react-native-webview'

export default function App() {
  const webUrl = Constants.manifest?.debuggerHost?.split(':')[0]
    ? `http://${Constants.manifest.debuggerHost.split(':')[0]}:5173`
    : 'https://your-deployed-app-url.com'

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: webUrl }}
        style={styles.webview}
        pullToRefreshEnabled
        startInLoadingState
        scalesPageToFit
        javaScriptEnabled
        domStorageEnabled
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  webview: {
    flex: 1,
  },
})