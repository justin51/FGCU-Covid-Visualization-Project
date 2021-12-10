import React from 'react';
import Plot from 'react-plotly.js';
import './App.css'

const _MONTHS = [  "January", "February", "March", "April", 
                  "May", "June", "July", "August", 
                  "September", "October", "November", "December" ];

class App extends React.Component {

  constructor(props) {
    super(props);

    const date = new Date();

    this.state = {
      month: [ (date.getMonth()-1) ],
      year: date.getFullYear(),
      compareFLData: false
    };
  }

  componentDidMount() {
    //console.log("Page Loaded: "+this.state.month+" "+ this.state.year);
    this.updateData(this.state.month, this.state.year, this.state.compareFLData);
  }

  async updateData(months, year, compare) {
    //console.log("Called Update");
    // console.log(months+" "+year);

    var monthrange = _MONTHS[months[0]];
    if (months.length > 1) {
      monthrange = _MONTHS[months[0]]+"-"+_MONTHS[months[months.length-1]];
    }

    var xData = [];
    var yData = [];
    var yCompareData = [];

    // console.log("TESTING: "+_MONTHS[month] + " : " + year);
    var data = await this.pingCovidAPI(monthrange, year, compare);
    // console.log("API response");
    // console.log(data);


    var errmonths = [];
    var stats = [[0, null, 0], [0, null, 0]];
    for (const source in data) {
      // console.log(source);
      for(const month in data[source]) {
        // console.log("\t"+month);

        // console.log(data[source][month] === "error");
        // console.log("current month: "+month);
        if (errmonths.includes(month)) continue;
        if(data[source][month] === "error" || data[source][month] === "no data") {
          errmonths.push(month);
          continue;
        }

        var keyString = Object.keys(data[source]).length > 1 ? (month+"/") : "";
        for(const day in data[source][month]) {
          if (source === "FGCU") {
            xData.push(keyString+day);
            var val = data[source][month][day] / (compare ? 15000 : 1);
            if (val > stats[0][0]) {
              stats[0][0] = val;
              stats[0][1] = month+"/"+day;
            }
            stats[0][2] += val;
            yData.push(val);
          } else if(source === "Florida") {
            var val = (data[source][month][day] / 21480000);
            if (val > stats[1][0]) {
              stats[1][0] = val;
              stats[1][1] = month+"/"+day;
            }
            stats[1][2] += val;
            yCompareData.push(val);
          }
        }
      }
    }


    this.setState({
      month: months,
      year: year,
      xData: xData,
      yData: yData,
      yCompareData: yCompareData,
      error: data == null,
      compareFLData: compare,
      stats: stats
    });
  }

  pingCovidAPI(month, year, compare) {
    return fetch("http://localhost:9000/covidAPI?month="+month+"&year="+year+"&compare="+compare)
    .then(res => res.text())
    .then(res => {
      var json = {};
      try {
        json = JSON.parse(res);
      } catch (err) {
        return null;
      }

      if(json["error"]) {
        //console.log("API ERROR");
        return null;
      }
      return json;
    });
  }

  selectMonth(m) {

    if(this.state.month.includes(m) && this.state.month.length == 1) return;

    var months = [ m ];
    if (this.state.month.length == 1) {
      // update months array with all months between currently selected month (state.month) and m
      if(m > this.state.month[0]) {
        months = [...Array(m - this.state.month[0]+1).keys()].map(x => x+this.state.month[0]);
      } else {
        months = [...Array(this.state.month[0]-m+1).keys()].map(x => x+m);
      }
    }

    this.updateData(months, this.state.year, this.state.compareFLData);
  }

  selectYear(y) {
    if(y === this.state.year) return;
    this.updateData(this.state.month, y, this.state.compareFLData);
  }

  handleCompareCheck = () => {
    this.updateData(this.state.month, this.state.year, !this.state.compareFLData);
  }

  render() {
    var graphTitle = this.state.month.length > 1 ? _MONTHS[this.state.month[0]]+'-'+_MONTHS[this.state.month[this.state.month.length-1]] : (this.state.month.length == 0 ? "NO MONTH?" : _MONTHS[this.state.month[0]]);
    graphTitle += ' '+this.state.year;
    var fixedLength = this.state.compareFLData ? 2 : 0;
    return (
      <div className="App">
        <h1>
          FGCU Covid Data Visualization
        </h1>
        <div className="Controller">
          <div>Select Month(s) and a Year to display <a href="https://www.fgcu.edu/coronaupdate/fgcucases">FGCU Covid Data</a> for that time frame</div>
          <br></br>
          <div className="MonthBox">
            <ul>
              {[...Array(_MONTHS.length).keys()].map(m => (
                <li id={'MonthItem'+m} key={'MonthItem'+m} className={(this.state.month.includes(m) ? 'active' : '')} onClick={() => this.selectMonth(m)}>{_MONTHS[m]}</li>
              ))}
            </ul>
          </div>
          <div className="YearBox">
            <ul>
              {["2020", "2021"].map(y => (
                <li id={'YearItem'+y} key={'YearItem'+y} className={(y === String(this.state.year) ? 'active' : '')} onClick={() => this.selectYear(y)}>{y}</li>
              ))}
            </ul>
          </div>
          <div className="CompareBox">
            <label>
              <input type="checkbox" 
                name="Compare against Florida data"
                checked = {this.state.compareFLData}
                onChange = {this.handleCompareCheck}
              />
              Compare against <a href="https://data.cdc.gov/Case-Surveillance/United-States-COVID-19-Cases-and-Deaths-by-State-o/9mfq-cb36">CDC's Florida Data</a>
            </label>
          </div>
        </div>
        {this.state.error ? <p>Error for {graphTitle}</p> : 
        <Plot // Plotly.react graph component
          data={
            this.state.compareFLData 
            ? [
              {
                type: 'line', 
                x: this.state.xData, // day values
                y: this.state.yData, // total case values
                name: "FGCU"
              },
              {
                type: 'line', 
                x: this.state.xData, // day values
                y: this.state.yCompareData, // total case values
                name: "Florida"
              }
            ]
            : [{
              type: 'bar', 
              x: this.state.xData, // day values
              y: this.state.yData, // total case values
              name: "FGCU"
            }]
          }
          layout={ 
            {
              width: 700, 
              height: 500, 
              title: graphTitle,
                  xaxis: {
                      title: { text: this.state.month.length > 1 ? "Month/Day" :"Day of Month" },
                      tickangle: this.state.month.length > 1 ? -40 : 0,
                      nticks: 12
                  },
              yaxis: {
                title:{text:"Covid Cases Reported"},
                tickformat: this.state.compareFLData ? "1%" : null
              }
            }
          }
        />}
        {!this.state.error ?
          this.state.stats ? 
          <div id="stats"> 
            Stats for {graphTitle}
            <div>
              <div className="LeftAlign">
                Highest reported cases
                <div>FGCU: {(this.state.stats[0][0]*(this.state.compareFLData ? 100 : 1)).toFixed(fixedLength)}{this.state.compareFLData ? "%":null} on {this.state.stats[0][1]}</div>
                {this.state.compareFLData ? <div>Florida: {(this.state.stats[1][0]*100).toFixed(fixedLength)}% on {this.state.stats[1][1]}</div> : null}
              </div> 
              <div className="RightAlign">
                Total reported cases
                <div>FGCU: {(this.state.stats[0][2]*(this.state.compareFLData?100:1)).toFixed(fixedLength)}{this.state.compareFLData?"%":null}</div>
                {this.state.compareFLData ? <div>Florida: {(this.state.stats[1][2]*100).toFixed(fixedLength)}%</div> : null}
              </div>    
            </div>
          </div>
          : null
        : null}
        <br></br>
        <br></br>
        <div class="flex-container">
          <div class="flex-boxes"><h2>The Team</h2>
          <p class ="flex-text">Justin Kenney<br></br>Maximilien Latura</p><p class ="flex-text">We are students at FGCU studying Software Engineering.</p></div>
          <div class="flex-boxes"><h2 class = "flex-text">The Project</h2>
          <p class="flex-text">The Covid Data Visualization project was developed to create a more thorough understanding of FGCU's covid statsitics. We created these graphs, and added comparison data to hopefully put covid into context.</p><p class="flex-text">Covid has affected every community throughout the world, directly or indirectly, it's important for the future to understand this impact. By putting covid data into a local perspective we can create a more emotional appeal and at the same time compare it to the bigger picture of the state level.</p></div>
          <div class="flex-boxes"><h2>Sources</h2>
          <p class="flex-text">
            <a href='https://www.fgcu.edu/coronaupdate/fgcucases'>FGCU Covid Cases</a>
            <br></br>
            <a href='https://data.cdc.gov/Case-Surveillance/United-States-COVID-19-Cases-and-Deaths-by-State-o/9mfq-cb36'>CDC Florida Data</a>
            <br></br>
            <a href='https://nodejs.org/en/'>Node.js</a>
            <br></br>
            <a href='https://expressjs.com/'>Express</a>
            <br></br>
            <a href='https://reactjs.org/'>React.js</a>
            <br></br>
            <a href='https://plotly.com/javascript/'>Plotly</a>
            <br></br>
          </p>
          </div>
        </div>
      </div>
    );
  }

}

function getMonthFromString(month, year) {
  var d = Date.parse(month + "1, "+year);
  if (!isNaN(d)) {
      return new Date(d).getMonth() + 1;
  }
  return -1;
}

export default App;
