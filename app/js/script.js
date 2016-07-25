// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

$(() => {
  let
    emojis = null,
    messages = null,
    firstDay = null,
    lastDay = null,
    involvementRatioChart = null,
    mostUsedEmojisChart = null,
    frequencyPerYearChart = null,
    frequencyPerMonthChart = null

  const
    wrapperEl = $('.wrapper'),
    spinnerEl = $('.spinner'),
    introEl = $('.intro'),
    resultsEl = $('.results'),
    involvementRatioEl = resultsEl.find('.involvement-ratio'),
    mostUsedEmojisEl = resultsEl.find('.most-used-emojis'),
    frequencyPerYearEl = resultsEl.find('.frequency-per-year'),
    frequencyPerMonthEl = resultsEl.find('.frequency-per-month'),
    messageHeaderREx = /((?:[0-9]{2}\.){2}[0-9]{2}, (?:[0-9]{2}:){3}) (.*?): /g,
    timeREx = /([0-9]{2})\.([0-9]{2})\.([0-9]{2}), ([0-9]{2}):([0-9]{2}):([0-9]{2}):/g
    // emojiREx = /[\u{1F601}-\u{1F64F}]/gu

  // Initialize zip.js
  zip.workerScriptsPath = 'js/zipjs/'

  reqwest('js/emoji.json', (resp) => {
    emojis = JSON.parse(resp.response)
  })

  // Converts HSV to RGB
  // http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
  const hsvToRgb = (h, s, v) => {
    let r, g, b, i, f, p, q, t

    if (arguments.length === 1) {
      s = h.s
      v = h.v
      h = h.h
    }

    i = Math.floor(h * 6)
    f = h * 6 - i
    p = v * (1 - s)
    q = v * (1 - f * s)
    t = v * (1 - (1 - f) * s)

    switch (i % 6) {
      case 0:
        r = v
        g = t
        b = p
        break

      case 1:
        r = q
        g = v
        b = p
        break

      case 2:
        r = p
        g = v
        b = t
        break

      case 3:
        r = p
        g = q
        b = v
        break
      case 4:
        r = t
        g = p
        b = v
        break

      case 5:
        r = v
        g = p
        b = q
        break
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }

  // Resets the applications
  const resetApp = () => {
    if (involvementRatioChart !== null) {
      involvementRatioChart.destroy()
    }

    if (mostUsedEmojisChart !== null) {
      mostUsedEmojisChart.destroy()
    }

    if (frequencyPerYearChart !== null) {
      frequencyPerYearChart.destroy()
    }

    if (frequencyPerMonthChart !== null) {
      frequencyPerMonthChart.destroy()
    }
  }

  // Parses a chat
  const parseChat = (chatText) => {
    let
      dataSplitted,
      messages = [],
      mi = 0,
      dsi = 0,
      timeSplitted

    // Split messages and their informations into an array
    dataSplitted = chatText.split(messageHeaderREx)

    // First element is empty
    dataSplitted.splice(0, 1)

    mi = 0
    for (dsi = 0; dsi < dataSplitted.length; dsi++) {
      switch (dsi % 3) {
        case 0:
          messages.push({
            time: new Date(),
            person: null,
            message: null
          })

          timeSplitted = dataSplitted[dsi].split(timeREx)

          messages[mi].time.setFullYear(2000 + parseInt(timeSplitted[3]))
          messages[mi].time.setMonth(parseInt(timeSplitted[2]))
          messages[mi].time.setDate(parseInt(timeSplitted[1]))
          messages[mi].time.setHours(parseInt(timeSplitted[4]))
          messages[mi].time.setMinutes(parseInt(timeSplitted[5]))
          messages[mi].time.setSeconds(parseInt(timeSplitted[6]))
          messages[mi].time.setMilliseconds(0)
          break

        case 1:
          messages[mi].person = dataSplitted[dsi]
          break

        default:
          messages[mi].message = dataSplitted[dsi]
          mi++
          break
      }
    }

    return messages
  }

  // Analyzes the chat and show the results
  const analyzeChat = (chat) => {
    messages = parseChat(chat)

    showResults(() => {
      resetApp()
      updateData()
      spinnerEl.css('display', 'none')
    })
  }

  // Updates all statistics
  const updateData = () => {
    firstDay = messages[0].time
    lastDay = messages[messages.length - 1].time

    updateInvolvementRatio()
    updateMostUsedEmojis()
    updateFrequencyPerYear()
    updateFrequencyPerMonth()
  }

  const updateInvolvementRatio = () => {
    let
      data = {
        labels: [],
        values: [],
        colors: []
      },
      involvementData = {},
      i,
      person,
      colorDifference = 0,
      color,
      colorText

    for (i = 0; i < messages.length; i++) {
      if (involvementData.hasOwnProperty(messages[i].person)) {
        involvementData[messages[i].person]++
      } else {
        involvementData[messages[i].person] = 1
      }
    }

    for (person in involvementData) {
      data.labels.push(person)
      data.values.push(involvementData[person])
    }

    colorDifference = 1 / data.values.length

    for (i = 0; i < data.values.length; i++) {
      color = hsvToRgb(
        (i + 1) * colorDifference,
        0.77,
        0.922
      )

      colorText = 'rgba(' + color.r;
      colorText += ',' + color.g;
      colorText += ',' + color.b;
      colorText += ',' + 1 + ')';

      data.colors.push(colorText)
    }

    involvementRatioChart = new Chart(involvementRatioEl.find('.chart'), {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Number of messages',
          data: data.values,
          backgroundColor: data.colors
        }]
      },
    })
  }

  const updateMostUsedEmojis = () => {
    let
      i,
      j,
      numbersOfEmojis = {},
      data = {
        labels: [],
        values: [],
        colors: []
      },
      regexp,
      matches,
      topEmojis = [],
      colorDifference = 0,
      color,
      colorText,
      chat = ""

    for (i = 0; i < messages.length; i++) {
      chat += messages[i].message
    }

    for (i = 0; i < emojis.length; i++) {
      regexp = new RegExp(emojis[i], 'gu')
      matches = chat.match(regexp)

      if (matches) {
        numbersOfEmojis[emojis[i]] = matches.length

        if (topEmojis.length < 10) {
          topEmojis.push(emojis[i])
        } else {
          for (j = 0; j < topEmojis.length; j++) {
            if (numbersOfEmojis[topEmojis[j]] < matches.length) {
              topEmojis[j] = emojis[i]
              break
            }
          }
        }
      }
    }

    // console.log(data.labels)

    data.labels = topEmojis


    for (i = 0; i < topEmojis.length; i++) {
      data.values.push(numbersOfEmojis[topEmojis[i]])
    }

    colorDifference = 1 / data.values.length

    for (i = 0; i < data.values.length; i++) {
      color = hsvToRgb(
        (i + 1) * colorDifference,
        0.77,
        0.922
      )

      colorText = 'rgba(' + color.r;
      colorText += ',' + color.g;
      colorText += ',' + color.b;
      colorText += ',' + 1 + ')';

      data.colors.push(colorText)
    }

    mostUsedEmojisChart = new Chart(mostUsedEmojisEl.find('.chart'), {
      type: 'polarArea',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Number of messages',
          data: data.values,
          backgroundColor: data.colors
        }]
      },
    })
  }

  const updateFrequencyPerYear = () => {
    let
      data,
      i,
      chart

    // Initialize data structure
    data = {
      labels: [],
      values: []
    }
    for (i = firstDay.getFullYear(); i <= lastDay.getFullYear(); i++) {
      data.labels.push(i)
      data.values.push(0)
    }

    // Order messages
    for (i = 0; i < messages.length; i++) {
      let
        time = messages[i].time

      data.values[time.getFullYear() - firstDay.getFullYear()]++
    }

    frequencyPerYearChart = new Chart(frequencyPerYearEl.find('.chart'), {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Number of messages',
          data: data.values,
          backgroundColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    })
  }

  const updateFrequencyPerMonth = () => {
    let
      frequencyPerMonth,
      colorDifference,
      color,
      i

    // Initialize data structure
    frequencyPerMonth = []
    for (i = firstDay.getFullYear(); i <= lastDay.getFullYear(); i++) {
      frequencyPerMonth.push({
        label: i,
        data: Array(12).fill(0),
        borderWidth: 1
      })
    }

    colorDifference = 1.0 / frequencyPerMonth.length

    for (i = 0; i < frequencyPerMonth.length; i++) {
      color = hsvToRgb(
        (i + 1) * colorDifference,
        0.77,
        0.922
      )

      frequencyPerMonth[i].backgroundColor = 'rgba(' + color.r;
      frequencyPerMonth[i].backgroundColor += ',' + color.g;
      frequencyPerMonth[i].backgroundColor += ',' + color.b;
      frequencyPerMonth[i].backgroundColor += ',' + 0.2 + ')';

      frequencyPerMonth[i].borderColor = 'rgba(' + color.r;
      frequencyPerMonth[i].borderColor += ',' + color.g;
      frequencyPerMonth[i].borderColor += ',' + color.b;
      frequencyPerMonth[i].borderColor += ',' + 1 + ')';
    }

    // Order messages
    for (i = 0; i < messages.length; i++) {
      let
        time = messages[i].time

      let yi = time.getFullYear() - firstDay.getFullYear()
      frequencyPerMonth[yi].data[time.getMonth()]++
    }

    frequencyPerMonthChart = new Chart(frequencyPerMonthEl.find('.chart'), {
      type: 'line',
      data: {
        labels: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec'
        ],
        datasets: frequencyPerMonth
      },
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    })
  }

  // Shows the results-wrapper
  const showResults = (callback) => {
    // Hide dragndrop
    Velocity(introEl, {
      opacity: 0
    }, {
      duration: 500,
      complete: () => {
        introEl.css('display', 'none')

        // Show results
        Velocity(resultsEl, {
          opacity: 1
        }, {
          duration: 500,
          begin: () => {
            resultsEl.css('display', 'block')
            callback()
          }
        })
      }
    })
  }

  // Prevents the default drop action
  const handleDragOver = (event) => {
    event.preventDefault()
    return false
  }

  // Reads the dropped file
  const readDroppedFile = (event) => {
    event.preventDefault()

    const
      file = event.dataTransfer.files[0]

    spinnerEl.css('display', 'block')

    if (file.name === '_chat.txt') {
      const reader = new FileReader()

      reader.readAsText(file)

      reader.onload = (event) => {
        analyzeChat(event.target.result)
      }
    } else if (file.type === 'application/zip') {
      zip.createReader(new zip.BlobReader(file), (reader) => {
        reader.getEntries((entries) => {
          let
            file = null,
            i

          for (i = 0; i < entries.length; i++) {
            if (entries[i].filename === '_chat.txt') {
              file = entries[i]
              break
            }
          }

          if (file !== null) {
            file.getData(new zip.TextWriter(), (chat) => {
              analyzeChat(chat)
            })
          } else {
            alert('Couldn\'t open the zip. May you want to open it by yourself and drag \'_chat.txt\' in the window.')
            spinnerEl.css('display', 'none')
          }
        })
      }, (error) => {
        alert('Couldn\'t open the zip. May you want to open it by yourself and drag \'_chat.txt\' in the window.')
        spinnerEl.css('display', 'none')
      })
    } else {
      alert('Can\'t read this type of file.')
      spinnerEl.css('display', 'none')
    }

    return false
  }

  // Setups event listeners
  document.addEventListener('dragover', handleDragOver)
  document.addEventListener('drop', readDroppedFile)
})
