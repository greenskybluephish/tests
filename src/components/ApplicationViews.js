import { Route, Redirect } from "react-router-dom";
import React, { Component } from "react";
import Home from "./home/Home";
import TopArtists from "./playlist/TopArtists";
import Login from "./authentication/Login";
import API from "../modules/APIManager";
import "./applicationviews.css";

export default class ApplicationViews extends Component {
  state = {
    isLoggedIn: false,
    allUsers: [],
    currentUser: [],
    userId: []
  };

  isAuthenticated = () => sessionStorage.getItem("access_token") !== null;

  componentDidMount() {
    const username = sessionStorage.getItem("username");
    const userId = sessionStorage.getItem("userId");
    if (username) {
      this.setState({
        currentUser: username,
        isLoggedIn: true,
        userId: userId
      });
    }
    if (!this.state.isLoggedIn) {
      API.get.JSONUsers().then(userArray => {
        this.setState({ allUsers: userArray });
      });
    }
  }

  authenticateUser = () => {
    window.OAuth.initialize("rKtNmq0HtvZws6tMLOJFcXiyypo");

    window.OAuth.popup("spotify", { cache: true }).done(spotify => {
      sessionStorage.setItem("access_token", spotify.access_token);
      // do some stuff with result
      spotify.me().then(data => {
        sessionStorage.setItem("username", data.name);

        this.setState({ currentUser: data.name, isLoggedIn: true });
        const registeredUser = this.state.allUsers.find(
          user => user.username === data.name
        );
        if (registeredUser) {
          this.setState({ userId: registeredUser.id });
          sessionStorage.setItem("userId", registeredUser.id);
        } else {
          API.get.spotifyTopArtists(spotify.access_token)
          .then(string => {
            const userList = {
              artistList: string,
              username: this.state.currentUser
            };
            API.post.toJSONServer("users", userList)
            .then(postData => {
                this.setState({ userId: postData.id });
                sessionStorage.setItem("userId", postData.id);
                return postData});
                return userList
              }) 
                .then(postData => {
                API.get.spotifyArtistsInfo(postData.artistList, spotify.access_token)
                .then(page => {
                  let artists = page.artists;
                  const artistDetailObject = artists.map(artist => {
                    return {
                      name: artist.name,
                      artistId: artist.id,
                      image: artist.images[1].url
                    };
                  });
                  return artistDetailObject;
                }).then(artistArray => {
                  let artistObject = {
                    userId: parseInt(sessionStorage.getItem("userId")),
                    artistDetail: artistArray
                  }
              API.post.toJSONServer("artists", artistObject)
            })
          })
        }
      });
    });
  };

  render() {
    return (
      <React.Fragment>
        <Route
          exact
          path="/"
          render={props => {
            if (!this.isAuthenticated()) {
              return <Redirect to="/login" />;
            } else {
              return <Redirect to="/home" />;
            }
          }}
        />
        <Route
          path="/home"
          render={() => {
            return <Home currentUser={this.state.currentUser} />;
          }}
        />
        <Route
          path="/login"
          render={() => {
            return <Login authenticateUser={this.authenticateUser} />;
          }}
        />

        <Route
          exact
          path="/topartists"
          render={() => {
            if (!this.isAuthenticated()) {
              return <Redirect to="/login" />;
            } else {
              return <TopArtists userId={this.state.userId} />;
            }
          }}
        />
      </React.Fragment>
    );
  }
}
