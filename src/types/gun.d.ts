declare module 'gun/gun' {
  const Gun: any
  export default Gun
}

declare module 'gun' {
  import Gun from 'gun/gun'
  export default Gun
}

declare module 'gun/sea' {
  const SEA: any
  export default SEA
}

declare module 'gun/lib/mobile' {}

declare module 'gun/lib/radix' {}

declare module 'gun/lib/radisk' {}

declare module 'gun/lib/store' {}

declare module 'gun/lib/ras' {
  const asyncStore: (opts: { AsyncStorage: any }) => any
  export default asyncStore
}

declare module 'react-native-qrcode-svg' {
  import { Component } from 'react'
  interface QRCodeProps {
    value: string
    size?: number
    backgroundColor?: string
    color?: string
  }
  export default class QRCode extends Component<QRCodeProps> {}
}
