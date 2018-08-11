import React, { Component } from 'react';
import spotifyLogo from './spotify-logo.svg';
import './App.css';
var Spotify = require('spotify-web-api-js');
var spotifyWebApi = new Spotify();
function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
class SpotifyAPIHandler extends Component {
  constructor(){
    super();
    this.spotifyAPICall.bind(this);
  }
  spotifyAPICall(callName, args, body){
    spotifyWebApi[callName](...args).then((response) => {body(response)})
  }
  render(){
    return (<App/>)
  }  
}
class App extends SpotifyAPIHandler {
  constructor(props) {
    super();
    const params = this.getHashParams();
    const token = params.access_token
    this.state = {
      loggedIn: token ? true : false,
      nowPlaying: {
        name: '',
        image: '',
        artist: '',
        album: ''
      },
      userId: '',
      playlists: [],
      newPlaylistId: '',
      numPlaylists: 5
    }
      this.getCurrentUser=this.getCurrentUser.bind(this);
      this.getNumberOfPlaylists=this.getNumberOfPlaylists.bind(this);
      this.getPlaylists=this.getPlaylists.bind(this);

    if (token){
      spotifyWebApi.setAccessToken(token)
    }
  }
  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }
  // spotifyAPICall(callName, args, body){
  //   spotifyWebApi[callName](...args).then((response) => {body(response)})
  // }
  getAll(){
    this.getCurrentUser()
    this.getNowPlaying()
  }
  getCurrentUser(){
    this.spotifyAPICall("getMe", [], (response) => 
      {this.setState({userId: response.id})}) 
  }
  getNumberOfPlaylists(){
    var num = document.getElementById("numberofplaylists").value;
    this.setState({numPlaylists: num});
  }
  getPlaylists(){
    let promiseWithThis = (t) => new Promise(function(resolve, reject){
      t.getCurrentUser();
      t.getNumberOfPlaylists();
      if(t.state.userId && t.state.numPlaylists){
        resolve([t.state.userId, t.state.numPlaylists]);
      }else{
        reject("Error");
      }
    })
    promiseWithThis(this).then(([id, numPlaylists])=>{this.spotifyAPICall("getUserPlaylists", [id, {limit: numPlaylists}], (response) => 
        {
          var arr = Object.keys(response.items)
                                      .map((key) => response.items[key].name)
                                      .reduce((acc,curr) => acc.concat(curr), [])
                                      .filter(entry => entry!==null)
                                      .slice(0, numPlaylists);
          console.log(arr);
          this.setState({playlists: arr})    
        })

      console.log("Retrieved " + numPlaylists + " playlists:")
    })
  }
  createPlaylist(id, name){
    this.spotifyAPICall("createPlaylist", [id, {name: name}], (response) => 
      {this.setState({newPlaylistId: response.id}); console.log("Playlist created.")}
    )
    console.log('Created playlist "'+name+'"')
  }
  addTrackToPlaylist(userId, playlistId, songURIs){
    this.spotifyAPICall("addTracksToPlaylist", [this.state.userId, playlistId, songURIs], () => {console.log("Tracks added.")});
  }
  displayInfo(types){
    const loggedIn=this.state.loggedIn;
    return (types.map((type, index) => <NameDisplayer key={type} loggedIn={loggedIn} item={this.state.nowPlaying[type]} simple={index}/>)
         .reduce((acc, curr) => acc.concat(curr), []).concat())
  }
  render() {
    return (
      <div className="App">
        <NowPlaying loggedIn={this.state.loggedIn}/>
        <br/>
        <br/>
        <div> Number of playlists to grab: 
          <input type="text" id="numberofplaylists"/>
          <button onClick={()=>this.getPlaylists()}>Clicky!</button>
        </div>
        <div>
          Recent Playlists: <PlaylistsRendered playlists={this.state.playlists} />
        </div>
        <div>
          <input type="text" id="textbox"/>
          <button onClick={() => this.createPlaylist(this.state.userId, document.getElementById("textbox").value)}>Create Playlist!</button>
        </div>
        <div>
          <input type="text" id="URIs"/>
          <button onClick={() => this.addTrackToPlaylist(this.state.userId, this.state.newPlaylistId,document.getElementById("URIs").value.split(","))}>Add tracks by URI!</button>
        </div>
      </div>
    );
  }
}


function NameDisplayer(props){
  if(props.simple){
      return (props.loggedIn ? <div>{props.item}</div> : null)
  }
  return( <div>{props.loggedIn ? (props.item ? props.item : "Updating feed...") : "Please Login!"} </div>)
}
function PlaylistsRendered(props){
  return (props.playlists.map((k,v) => <div key={k}>{k}</div>)
                              .reduce((acc,curr) => acc.concat(curr), []))
}

// class PlaylistHandler extends Component{
//   constructor(props){
//     super(props);
//     this.state = {
//       userId: props.userId,

//     }
//   }
// }

class NowPlaying extends Component {
  constructor(props){
    super(props);
    this.state = {
      loggedIn : props.loggedIn,
      nowPlaying: {}
    }
  }
  spotifyAPICall(callName, args, body){
    spotifyWebApi[callName](...args).then((response) => {body(response)})
  }
  getAuthorization(){
      return(<div>
              <a href="http://localhost:8888">
                <img src={spotifyLogo} height={40} width={40}/>
              </a>
              <div size={20}>Authorize Spotify</div>
              <br/>
            </div>)
  }
  updateInfo(){
    this.spotifyAPICall("getMyCurrentPlaybackState", [], (response) => 
      {
        if(response){this.setState({loggedIn: true})}
        response.item ? (this.setState({
                nowPlaying: {
                  name: response.item.name,
                  image: response.item.album.images[0].url,
                  artist: response.item.artists[0].name,
                  album: response.item.album.name
                }
            })) : (this.setState({
                nowPlaying: {
                  name: "No song playing",
                  image: '',
                  artist: '',
                  album: ''
                }
            }))
      }
    )
          if(!this.state.nowPlaying.album){this.setState({loggedIn: false})}

    console.log("Retrieved current playback state.")
  }
  displayInfo(types){
    const loggedIn=this.state.loggedIn;
    const imageDisplay =<div key={this.state.nowPlaying.image+"a"}><img src= {this.state.nowPlaying.image} style={{width: 200}}/></div> 
    return (types.map((type, index) => <NameDisplayer key={type} loggedIn={loggedIn} item={this.state.nowPlaying[type]} simple={index}/>)
         .reduce((acc, curr) => acc.concat(curr), []).concat([imageDisplay]))
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
      this.state.loggedIn ? <div>{this.displayInfo(["name", "artist", "album"])}</div>
                          : this.getAuthorization()

    )
  }
}





export default App;
