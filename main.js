const Discord = require('discord.js');
const client = new Discord.Client();
const { exec } = require('child_process');
const { config, stdout, stderr } = require('process');
const ytdl = require('ytdl-core');
const yts = require('yt-search'); 
const fs = require('fs');

var prefix = '-';
var save = '';

var servers = {};

var commands = [];
var actions = [];

client.on("message", message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    var args = message.content.replace('\n', ' ').slice(prefix.length).trim().split(/ +/);
    var cmd = args.shift();

    var trim = prefix.length + cmd.length + 1;

    switch (cmd) {
        case "debug":
            message.channel.send('beep boop');
            break;

        case "help":
            //send help
            break;

        case "eval":
            let result = eval(`try{${save}}catch{} `+message.content.slice(trim));
            if(!result) return;
            message.channel.send(result);
            break;

        case "save":
            save += message.content.slice(trim);
            break;

        case "clear":
            save = '';
            break;

        case 'get':
            try {
                message.channel.send("Success",  {files: [`${args[0]}`]});
            } catch {

            }
            break;

        case "exec":
            exec(message.content.slice(trim), (error, stdout, stderr) => {
                message.channel.send(`${stdout} ${stderr}`);
            });
            break;

        case "run":
            message.channel.messages.fetch(args[0]).then(run => {
                if(run.content.startsWith("```js")){
                    let result = eval(run.content.substring(5, run.content.length - 3));
                    message.channel.send(result);
                } else {
                    var extension = '';

                    if(run.content.startsWith("```python")){
                        extension = 'py';
                        fs.writeFile(`${message.id}.py`, run.content.substring(9, run.content.length - 3), (err) => {
                            exec(`pypy ${message.id}.py`, (error, stdout, stderr) => {
                                message.channel.send(`${stdout} ${stderr}`);
                            });
                        });
                    } else if(run.content.startsWith("```py")){
                        extension = 'py';
                        fs.writeFile(`${message.id}.py`, run.content.substring(5, run.content.length - 3), (err) => {
                            exec(`pypy ${message.id}.py`, (error, stdout, stderr) => {
                                message.channel.send(`${stdout} ${stderr}`);
                            });
                        });
                    } else if(run.content.startsWith("```c++") || run.content.startsWith("```cpp")){
                        extension = 'cpp';
                        fs.writeFile(`${message.id}.cpp`, run.content.substring(6, run.content.length - 3), (err) => {
                            exec(`g++ ${message.id}.cpp -o ${message.id}`, (error, stdout, stderr) => { //TODO: -O3
                                message.channel.send(`${stdout} ${stderr}`);
                                exec(`./${message.id}`, (error, stdout, stderr) => {
                                    message.channel.send(`${stdout} ${stderr}`);
                                });
                            });
                        });
                    } else if(run.content.startsWith("```csharp")) {
                        extension = 'cs';
                        fs.writeFile(`${message.id}.cs`, run.content.substring(9, run.content.length - 3), (err) => {
                            exec(`mcs -out:${message.id}.exe ${message.id}.cs`, (error, stdout, stderr) => {
                                message.channel.send(`${stdout} ${stderr}`);
                                exec(`mono ${message.id}.exe`, (error, stdout, stderr) => {
                                    message.channel.send(`${stdout} ${stderr}`);
                                });
                            });
                        });
                    } else if(run.content.startsWith("```cs")) {
                        extension = 'cs';
                        fs.writeFile(`${message.id}.cs`, run.content.substring(5, run.content.length - 3), (err) => {
                            exec(`mcs -out:${message.id}.exe ${message.id}.cs`, (error, stdout, stderr) => {
                                message.channel.send(`${stdout} ${stderr}`);
                                exec(`mono ${message.id}.exe`, (error, stdout, stderr) => {
                                    message.channel.send(`${stdout} ${stderr}`);
                                });
                            });
                        });
                    } else if(run.content.startsWith("```rs")){
                        extension = 'rs';
                        fs.writeFile(`${message.id}.rs`, run.content.substring(5, run.content.length - 3), (err) => {
                            exec(`rustc ${message.id}.rs`,  (error, stdout, stderr) => {
                                message.channel.send(`${stdout} ${stderr}`);
                                exec(`./${message.id}`, (error, stdout, stderr) => {
                                    message.channel.send(`${stdout} ${stderr}`);
                                });
                            }); 
                        });
                    } else if(run.content.startsWith("```rust")){
                        extension = 'rs';
                        fs.writeFile(`${message.id}.rs`, run.content.substring(7, run.content.length - 3), (err) => {
                            exec(`rustc ${message.id}.rs`,  (error, stdout, stderr) => {
                                message.channel.send(`${stdout} ${stderr}`);
                                exec(`./${message.id}`, (error, stdout, stderr) => {
                                    message.channel.send(`${stdout} ${stderr}`);
                                });
                            }); 
                        });
                    } else if(run.content.startsWith("```c")){
                        extension = 'c';
                        fs.writeFile(`${message.id}.c`, run.content.substring(4, run.content.length - 3), (err) => {
                            exec(`gcc ${message.id}.c -o ${message.id} -O3`, (error, stdout, stderr) => {
                                message.channel.send(`${stdout} ${stderr}`);
                                exec(`./${message.id}`, (error, stdout, stderr) => {
                                    message.channel.send(`${stdout} ${stderr}`);
                                });
                            });
                        });
                    }

                    setTimeout(() => exec(`rm ${message.id} ${message.id}.${extension}`, (error, stdout, stderr) => {}), 10000);
                }
            });
            break;

        case "write":
            try{
                var file = args.shift();
                fs.writeFile(`${file}`, `${message.content.slice(trim + file.length + 1)}`, (err) => message.channel.send(err));
            } catch {

            }
            break;

        case 'play':
            if(!args[0]) {
                message.channel.send('OK, playing NULL.');
                return;
            }
        
            if(!message.member.voice.channel) {
                msg.channel.send('ur not in a vc bruv');
                return;
            }

            if(!message.guild.voice){
                message.member.voice.channel.join().then(() => { message.member.voice.channel.leave(); });
            }

            if(!servers[message.guild.id]){
                servers[message.guild.id] ={
                    queue: [],
                    list: []
                };
            }

            var server = servers[message.guild.id];
        
            var q = '';
            args.forEach(element => q += element + ' ');

            var opts = { pages: 1 }
            yts({pages: 1, query: q}).then(r => {
                const video = r.videos.shift();

                server.queue.push(video.url);
                server.list.push(video.title);
                message.channel.send(`Added **${video.title}** to the queue`);
    
                if(!message.guild.voice.connection){
                    let voiceChannel = message.member.voice.channel;
                    voiceChannel.join().then(connection => {
                        server.loop = false;
                        server.volume = 1;
                        server.connection = connection;
                        play(message, connection);
                    });
                }
            });

            break;

            case 'disconnect':
                var server = servers[message.guild.id];
                if(!server) return;
                if(!server.connection) return;
                server.queue.splice(0, server.queue.length);
                server.list.splice(0, server.list.length);
                server.connection.disconnect();
                break;
    
            case 'skip':
                var server = servers[message.guild.id];
                if(!server) return;
                if(!server.dispatcher) return;
                if(server.loop) server.loop = false;
                server.dispatcher.end();
                break;
    
            case 'volume':
                var server = servers[message.guild.id];
                if(!server) return;
                if(!server.dispatcher) return;
                args[0] = Math.abs(args[0]) > 200 ? 200 : args[0];
                server.volume = args[0] / 100;
                server.dispatcher.setVolume(args[0] / 100);
                break;
    
            case 'resume':
                var server = servers[message.guild.id];
                if(!server) return;
                if(!server.dispatcher) return;
                server.dispatcher.resume();
                break;
            
            case 'pause':
                var server = servers[message.guild.id];
                if(!server) return;
                if(!server.dispatcher) return;
                server.dispatcher.pause();
                break;
            
            case 'loop':
                var server = servers[message.guild.id];
                if(!server) return;
                if(!server.loop) return;
                server.loop = !server.loop;
                message.channel.send("**Looping:** "+server.loop);
                break;
            
            case 'queue':
                var server = servers[message.guild.id];
                if(!server) return;
                if(!server.list) return;
                var queue = '';
                var i = 1;
                server.list.forEach(element => { queue += `${i}. ` + element + '\n'; i++; });
                message.channel.send('**``' + queue + '``**');
                break;
            
            case 'remove':
                var server = servers[message.guild.id];
                if(!server) return;
                if(!server.queue || !server.list) return;
                if(args[0] != 'all') {
                    server.queue.splice(args[0]-1, 1);
                    server.list.splice(args[0]-1, 1);
                } else {
                    server.queue.splice(1, server.queue.length);
                    server.list.splice(1, server.list.length);
                }
                break;
        
        case "program":
            commands.push(args[0]);
            message.channel.messages.fetch(args[1]).then(act => actions.push(act.content.substring(5, act.content.length - 3)));
            break;

        case "delete":
            //later
            break;

        case "reset":
            client.destroy();
            process.exit(1);
            break;

        case "how":
            message.channel.send(`${message.content.slice(args[0].length + args[1].length + trim + 2)} ${args[1]} %${Math.round(Math.random() * 100)} ${args[0]}`);
            break;
        
        default:
            for(var i = 0; i < commands.length; i++)
                if(cmd === commands[i]) eval(actions[i]);
            break;
    }
});

function play(msg, connection){
    var server = servers[msg.guild.id];

    msg.channel.send(`Now playing **${server.list[0]}**`);
    server.dispatcher = connection.play(ytdl(server.queue[0], {filter: 'audioonly'}));
    server.dispatcher.setVolume(server.volume);

    if(!server.loop) { server.queue.shift(); server.list.shift(); }

    server.dispatcher.on('finish', () => {
        if(server.queue[0]) play(msg, connection);
        else connection.disconnect();
    });
}

client.login(process.env.TOKEN);
