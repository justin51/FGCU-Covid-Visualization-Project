var express = require('express');
var router = express.Router();
const fs = require('fs');
const _MONTHS = [  "January", "February", "March", "April", 
                  "May", "June", "July", "August", 
                  "September", "October", "November", "December" ];

function daysInMonth(month, year) {
    return new Date(year, getMonthFromString(month, year), 0).getDate();
}

function getMonthFromString(month, year){
    var d = Date.parse(month + "1, "+year);
    if(!isNaN(d)){
        return new Date(d).getMonth() + 1;
    }
    return -1;
}

const validYears = ["2020", "2021", "2022"];

router.get("/", function (req, res) {
    var month = String(req.query['month']);
    var year = String(req.query['year']);
    var compare = String(req.query['compare']) === "true";

    var start=getMonthFromString(month, year), end=start;
    if(month.includes("-")) {
        var range = month.split("-");
        start = getMonthFromString(range[0], year);
        end = getMonthFromString(range[1], year);
    }

    var returnData = {};
    if (start == -1 || end == -1) {
        returnData["error"] = "Month arg(s) error for "+month;
    } else if (!validYears.includes(year)) {
        returnData["error"] = "Year arg error for "+year+". Valid years = "+validYears;
    } else {
        returnData["FGCU"] = {};
        if (compare) returnData["Florida"] = {};
        for(var i = start;i <= end;i++) {
            console.log("getting month: "+i + " : " + _MONTHS[i-1]);
            var data = getMonthData(_MONTHS[i-1], year, "FGCU");
            returnData["FGCU"][String(i)] = data;

            if(compare) {
                data = getMonthData(_MONTHS[i-1], year, "Florida");
                returnData["Florida"][String(i)] = data;
            }
        }
    }

    console.log(returnData);
    res.send(returnData);
});

function getMonthData(month, year, source) {
    var path = './covid data/'+source+'/'+month+year+'.txt';
    console.log('Call to '+path);

    var monthData;
    try {
        monthData = fs.readFileSync(path, 'utf8')
    } catch (err) {
        console.error(err)
        console.log("Encountered error : return no data");
        return "error";
    }
    if (monthData == undefined || monthData === "{}") {
        return "no data";
    }

    // this parsing causes a little bit of overhead
    // should be moved to when the data is originally parsed from the source
    // like this for now should DB or Client implementation changes
    const data = JSON.parse(monthData);
    days = daysInMonth(month, year);
    var returnData = {};
    for(var i = 1;i < days+1;i++) {
        // console.log((data[String(i)]) + " : " + i);
        if(data[String(i)]) {
            // console.log(month+" " +i+" : "+data[String(i)]);
            // console.log(data[String(i)]);
            var dailyTotal = 0;
            for (var key in data[String(i)]) {
                dailyTotal += data[String(i)][key];
            }
            returnData[String(i)] = dailyTotal;
        } else {
            // console.log("No data for "+month+" "+i);
            returnData[String(i)] = 0;
        }

        // console.log(month+" "+i+ " : "+returnData[String(i)]);
    }
    return returnData;

    // returnData: {
    //     1: 0,
    //     2: 1,
    //     3: 1,
    //     4: 0,
    //     5: 5,
    //     ..
    //     ..
    //     ..
    //     all the way to [daysInMonth]
    // }
}

module.exports = router;