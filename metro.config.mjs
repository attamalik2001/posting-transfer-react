import { getDefaultConfig } from '@expo/metro-config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const config = getDefaultConfig(__dirname)

config.resolver.sourceExts = ['tsx', 'ts', 'js', 'jsx', 'json']
config.watchFolders = [
  resolve(__dirname, './src'),
  resolve(__dirname, './node_modules'),
]

export default config