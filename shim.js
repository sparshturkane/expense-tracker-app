import 'react-native-get-random-values'
import { Buffer } from 'buffer'
import { TextEncoder, TextDecoder } from 'text-encoding'

global.Buffer = global.Buffer || Buffer
global.TextEncoder = global.TextEncoder || TextEncoder
global.TextDecoder = global.TextDecoder || TextDecoder
