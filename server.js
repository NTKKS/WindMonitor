const express = require('express')
const fs = require('fs')
const fetch = require('node-fetch')
const parseString = require('xml2js').parseString
const app = express()

app.set('view engine', 'ejs')
app.set('views',__dirname + '/views')

app.get('/', (req, res) => {

    res.render('./index')
})

app.get('/data.json', (req,res)=>{
    res.json(data)
})

//date, time setup
const dateObj = new Date()
const day = dateObj.getDate()
const month = dateObj.getMonth()
const months = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro']
const year = dateObj.getFullYear()
const dayName = dateObj.getDay()
const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota']
const time = dateObj.toLocaleTimeString()
const customDate = (days[dayName]+" "+day+"/"+(month+1)+"/"+year)

//console.log(days[dayName],day+"/"+month+"/"+year,time)

var index = ""
var windData = []

const data = loadJSON('data.json')
const dataCount = data.days.length
//init fresh json file
if(data.days[dataCount-1].date==""){
    data.days[dataCount-1].date = customDate
    saveJSON('data.json', data)
//log into existing day
}else if(data.days[dataCount-1].date==customDate){
    index = (dataCount-1)
//start new day 
}else if(data.days[dataCount-1].date!=customDate){
    const newDay = {
        "date":customDate,"windSpeed":[],"time":[]
    }
    data.days.push(newDay)
    saveJSON('data.json', data)
    index = (dataCount-1)
}


//load function
function loadJSON(filename = ''){
    return JSON.parse(
        fs.existsSync(filename)
        ? fs.readFileSync(filename).toString()
        : '""'
    )
}
//save function
function saveJSON(filename = '', json = '""') {
    return fs.writeFileSync(
        filename,
        JSON.stringify(json)
    )
}


function logData(wind){
    //take existing data
    const data = loadJSON('data.json')
    //add new data
    data.days[index].windSpeed.push(wind)
    data.days[index].time.push(time)
    
    //save updated file
    saveJSON('data.json', data)
}

//setInterval(getWindSpeed,1000)
setInterval(getWindSpeedAverage,1000)

async function getWindSpeed() {
    await fetch('http://172.16.2.130/status.xml')
    .then(res => res.text())
    .then(body => 
        parseString(body, function (err, result) {
            wind = result.status.windspeed[0]
            logData(parseFloat(wind))
    }))
    .catch(err => console.error(err))
}

async function getWindSpeedAverage() {
    await fetch('http://172.16.2.130/status.xml')
    .then(res => res.text())
    .then(body => 
        parseString(body, function (err, result) {
            wind = result.status.windspeed[0]
            windData.push(parseFloat(wind))
            if(windData.length==10){
                var sum = 0.0
                for (let i = 0; i < windData.length; i++) {
                    sum += windData[i]                 
                }
                var result = (+(sum/10).toFixed(2))
                logData(result)
                sum = 0
                windData = []
            }
    }))
    .catch(err => console.error(err))
}

app.listen(process.env.PORT || 5000, () => {
    //console.log('Listening on port: 5000')
})