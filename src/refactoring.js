import React, { Component } from 'react';
import spotifyLogo from './spotify-logo.svg';
import './App.css';
var Spotify = require('spotify-web-api-js');
var spotifyWebApi = new Spotify();

const gizzURI = "spotify:artist:6XYvaoDGE0VmRt83Jss9Sn"
const gizzId = "6XYvaoDGE0VmRt83Jss9Sn"

Object.prototype.map = function(f){
  return Object.keys(this).map((index) => (this[index] ? f(this[index]) : null));
}

// (func) => Object.keys(this).map(func);


function getHashParams() {
  var hashParams = {};
  var e, r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
  while ( e = r.exec(q)) {
     hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}
function spotifyAPICall(callName, args, body, _callback){
  spotifyWebApi[callName](...args).then((response) => {body(response)});
  if(_callback){
    _callback();
  }
}
class App extends Component {
  constructor(props) {
      super();
      const params = getHashParams();
      const token = params.access_token;
      this.state = {
        loggedIn: token ? true : false,
        userId: '',
      }
      if (token){
        spotifyWebApi.setAccessToken(token)
      }
  }
  componentDidMount(){
    this.timerID = setInterval(
      () => this.checkLogin(), 3000)
  }
  componentWillUnmount(){
    clearInterval(this.timerID)
  }
  checkLogin(){
    const params = getHashParams();
    const token = params.access_token;
    if(!token){
      this.setState({loggedIn: false})
    }else if(token !== spotifyWebApi.getAccessToken()){
      spotifyWebApi.setAccessToken(token);
      this.setState({loggedIn: true});
    }
  }
  render(){
    return(
      <div className="App">
        <NowPlaying loggedIn={this.loggedIn}/>
        <div>{this.state.loggedIn ? <TopArtists loggedIn={this.loggedIn}/> : null}</div>
      </div>
    )
  }
}
class TopArtists extends Component {
  constructor(props){
    super(props);
    this.state = {
      artists: [],
      loggedIn: props.loggedIn
    }
  }
  updateInfo(){
    spotifyAPICall("getMyTopArtists", [], (response) => 
      {
        if(response) {this.setState({loggedIn: true})}
          // console.log(response);
      if(response.items){
        console.log(response.items);
        let artists = response.items.map((artist) =>
          {
            return({name: artist.name,
             artistId: artist.id,
             genres: artist.genres
            })
          })
      this.setState({artists: artists});
      clearInterval(this.timerID);
      }else{
        this.setState({artists: [{
          name: "Fetching artists...",
          artistId: "",
          genres: []
        }]})
      }
      }, ()=>console.log("hi"));
  }
  componentDidMount(){
    this.timerID = setInterval(
      () => this.updateInfo(), 3000)
  }
  componentWillUnmount(){
    clearInterval(this.timerID)
  }
  render(){
    // console.log(this.state.artists);
    return(<div>{this.state.artists.map((item) =>
        <InfoDisplayer key={item.name} loggedIn={this.state.loggedIn} types={["name", "artistId", "genres"]} data={item}/>
      )}</div>)
  }
}
class NowPlaying extends Component {
  constructor(props){
    super(props);
    this.state = {
      loggedIn : props.loggedIn,
      nowPlaying: {},
    }
  }
  updateInfo(){
    spotifyAPICall("getMyCurrentPlaybackState", [], (response) => 
      {
        if(response)
          {this.setState({loggedIn: true})}
          if(response.item){
        this.setState({
                  nowPlaying: {
                    name: response.item.name,
                    image: response.item.album.images[0].url,
                    artist: response.item.artists[0].name,
                    album: response.item.album.name
                  }
              })
          }else{
            this.setState({
              nowPlaying: {
                name: "No song playing",
                image: '',
                artist: '',
                album: ''
              }
            })
          }
      }, () => {
      if(!this.state.nowPlaying.album){this.setState({loggedIn: false})}
      console.log("Retrieved current playback state.")
    }
  )
  }
  componentDidMount(){
    this.timerID = setInterval(
      () => this.updateInfo(), 3000)
  }
  componentWillUnmount(){
    clearInterval(this.timerID)
  }
  render() {
    return (
      this.state.loggedIn ? <div><h1> Now Playing: </h1><InfoDisplayer loggedIn={this.state.loggedIn} types={["name", "artist", "album"]} data={this.state.nowPlaying}/></div>
                          : <NeedAuthorization />

    )
  }
}
function NeedAuthorization(){
  return(<div>
              <a href="http://localhost:8888">
                <img src={spotifyLogo} height={40} width={40}/>
              </a>
              <div size={20}>Authorize Spotify</div>
              <br/>
            </div>)
}
/*Takes in a single Object and the keys you'd like the data of, and produces HTML for that data.*/
function InfoDisplayer(props){
  const loggedIn = props.loggedIn;
  const types = props.types;
  const data = props.data;
  const imageDisplay =data.image ? <div key={data.image+"a"}><img src= {data.image} style={{width: 200}}/></div> : null
  const info = (types.map((type, index) => <NameDisplayer key={type} loggedIn={loggedIn} item={data[type]} simple={index}/>));
  return (
    <div>
    <div>{[imageDisplay].concat(info)}</div></div>
  )
}

function NameDisplayer(props){
  if(props.simple){
      return (props.loggedIn ? <div>{props.item}</div> : null)
  }
  return( <div>{props.loggedIn ? (props.item ? props.item : "Updating feed...") : "Please Login!"} </div>)
}
export default App;
