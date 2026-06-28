import AsyncStorage from '@react-native-async-storage/async-storage'

export const readAdapter = (request: any, db: any) => {
  const key = request.get['#']
  AsyncStorage.getItem(key).then(data => {
    if (data) {
      db.on('in', { '@': request['#'], put: JSON.parse(data), '#': key })
    }
  })
}

export const writeAdapter = (request: any, db: any) => {
  const put = request.put
  Object.keys(put).forEach(key => {
    AsyncStorage.setItem(key, JSON.stringify(put[key]))
  })
}
