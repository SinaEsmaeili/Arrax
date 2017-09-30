//  _____            ______              
// /  ___|           |  ___|             
// \ `--. _   _ _ __ | |_ _   _ _ __ ___ 
//  `--. \ | | | '_ \|  _| | | | '__/ _ \
// /\__/ / |_| | | | | | | |_| | | |  __/
// \____/ \__,_|_| |_\_|  \__, |_|  \___|
//                         __/ |         
//                        |___/          
//
//  © 2017 Sina HajiEsmaeili

const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require("fs");
const tokens = require("./api/api-keys.json");
const ytdl = require('ytdl-core');
var Youtube = require('youtube-node');

var youtube = new Youtube();
youtube.setKey(tokens.youtubeNode);

let audioObj = JSON.parse(fs.readFileSync("./audio-obj.json"));

client.on('ready', () => {
  console.log('I am ready!');
});

// Create an event listener for new guild members
client.on('guildMemberAdd', member => {
  channel.send(`Welcome to the server, ${member}`);
});

client.on('message', message => {

  // always ignore bots!
  if (message.author.bot) return;

  // Declaring voice channel member is in
  var voiceChannel = message.member.voiceChannel;

  if (message.content === '!help') {
    var text = "Simply type in any of the words below to play jokes\n---------------------------------------------------\n";

    var fileStrings = audioObj.files;
    text += "```\n" + fileStrings.join("\n") + "```" + "\n";

    text += "---------------------------------------------------\n";

    text += "**Youtube Streaming:** - `!stream` You can play the audio of any youtube video you want\n"
    text += "~ Example: !stream royal blood loose change\n"

    text += "---------------------------------------------------\n";

    text += "**Youtube Playing Videos:** - `!play` Search for Youtube videos in chat instead of finding the link manually in browser\n"
    text += "~ Example: !play breastplate stretcher\n"

    text += "---------------------------------------------------\n";

    text += "**Requests:** - `!request` You can ask for a request of anything you want and ill add it to the database later\n";
    text += "~ Example: !request add some aesthetic!\n";

    message.channel.send(text);

  } else if (message.content.startsWith('!request')) {
    var args = message.content.replace('!request ', '');
    var argsWithId = args + " - " + message.author.username;
    audioObj.requests.push(argsWithId);

    // Saving file changes to audio-obj.json
    fs.writeFile("./audio-obj.json", JSON.stringify(audioObj, null, 4), (err) => {
      if (err) {
        console.error(err)
      } else {
        message.reply("Your request '" + args + "' has been submitted!")
        console.log("Request submitted!");
      }
    });

    return;

  } else if (message.content.startsWith('!stream')) {
    let args = message.content.replace('!stream ', '');

    // Checks if it is a direct youtube link
    if (args.startsWith('http')) {
      playStream(args, voiceChannel);

    } else {

      // Searching query string on youtube
      youtube.search(args, 2, function (error, result) {
        if (error) {
          console.log(error);
        } else {

          // Making sure search didnt result in channel
          if (result.items[0].id.kind == 'youtube#channel') {
            message.reply("Be more specific!");

          } else {
            // Retreiving youtube tag from result json object
            ytTag = result.items[0].id.videoId
            var ytLink = 'https://www.youtube.com/watch?v=' + ytTag;
            playStream(ytLink, voiceChannel);
          }

        }
      });

    }

  } else if (message.content.startsWith('!play')) {
    var args = message.content.replace('!play ', '');

     youtube.search(args, 1, function (error, result) {
        if (error) {
          console.log(error);
        } else {

          // Making sure search didnt result in channel
          if (result.items[0].id.kind == 'youtube#channel') {
            message.reply("Be more specific!");

          } else {
            // Retreiving youtube tag from result json object
            ytTag = result.items[0].id.videoId
            var ytLink = 'https://www.youtube.com/watch?v=' + ytTag;
            message.reply(ytLink);
          }      

        }
      });

  } else {

    // Looping through files array in audio-obj.json
    for (var i in audioObj.files) {

      var fileName = audioObj.files[i];

      // Checking if a filename matches with the message content
      if (message.content.toLowerCase() === fileName) {
        var file = './audio/' + fileName + '.mp3';
        playAudio(file, voiceChannel);
        return;
      }

    }
  }



});

// Function for play pre existing mp3 files in /audio folder
function playAudio(audio, voiceChannel) {

  // Added exception handle to prevent crashing of program if user isnt in a channel
  try {
    voiceChannel.join().then(connection => {
      const dispatcher = connection.playFile(audio);

      dispatcher.on("end", end => {
        voiceChannel.leave();
      });

      console.log("Playing " + audio);
    }).catch(err => console.log(err));

  } catch (e) {
    console.log(e.message);
  }

}

// Function for playing youtube audio stream
function playStream(link, voiceChannel) {

  // Added exception handle to prevent crashing of program if user isnt in a channel
  try {

    voiceChannel.join().then(connection => {
      let stream = ytdl(link, {
        filter: 'audioonly',
      });
      // const dispatcher = connection.playFile(audio);
      const dispatcher = connection.playStream(stream);

      dispatcher.on("end", end => {
        voiceChannel.leave();
      });

      console.log("Playing " + link);
    }).catch(err => console.log(err));

  } catch (e) {
    console.log(e.message);
  }

}

client.login(tokens.discordToken);
