const readFromStdin = (callback) => {
  const encoding = 'utf-8'
  let data
  data = ''
  process.stdin.setEncoding(encoding)
  process.stdin.on('readable', function () {
    const chunk = process.stdin.read()
    if (chunk !== null) {
      data += chunk
    }
  })
  process.stdin.on('end', function () {
    // There will be a trailing \n from the user hitting enter. Get rid of it.
    data = data.replace(/\n$/, '')
    callback(data)
  })
}

module.exports = {
  read: readFromStdin
}
