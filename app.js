
//--------------------------------------------------------------------------//
// Node.js bot for serve maintenancers, developers and hosts of BYOND SS13 servers
// Original version taken from «White Dream»
// Original author: Valtos, modder of original: Gesugao-san
// Use wisely and report bugs if you find any.
//--------------------------------------------------------------------------//

process.chdir('/home/ubuntu/wdbot/');
const os_config_path = './config.json';

// message consoles colors
mclr = {
  Rst:        "\x1b[0m", FgBlack:   "\x1b[30m",
  Bright:     "\x1b[1m", FgRed:     "\x1b[31m",
  Dim:        "\x1b[2m", FgGreen:   "\x1b[32m",
  Underscore: "\x1b[4m", FgYellow:  "\x1b[33m",
  Blink:      "\x1b[5m", FgBlue:    "\x1b[34m",
  Reverse:    "\x1b[7m", FgMagenta: "\x1b[35m",
  Hidden:     "\x1b[8m", FgCyan:    "\x1b[36m",
  FgWhite:                          "\x1b[37m",
};

stat_msg = {
  //blank:    mclr.Rst   + "______" + mclr.Rst,
  boot:      mclr.FgMagenta + " BOOT " + mclr.Rst, // FgMagenta
  load:      mclr.FgMagenta + " LOAD " + mclr.Rst, // FgMagenta
  command:   mclr.FgYellow  + " CMND " + mclr.Rst, // FgYellow
  not_cmd:   mclr.Rst       + "NOTCMD" + mclr.Rst, // FgYellow

  ok:      mclr.FgGreen  + "  OK  " + mclr.Rst, // JOB_DONE
  failed:  mclr.FgRed    + "FAILED" + mclr.Rst, // JOB_FAILED
  info:    mclr.Rst      + " INFO " + mclr.Rst, // JOB_SKIPPED
  warning: mclr.FgYellow + "WARNIN" + mclr.FgYellow, // WARNING  // JOB_TIMEOUT

  /* dependency:  mclr.FgYellow  + "DEPEND" + mclr.Rst, // JOB_DEPENDENCY
  assert:      mclr.FgYellow  + "ASSERT" + mclr.Rst, // JOB_ASSERT
  unsupported: mclr.FgYellow  + "UNSUPP" + mclr.Rst, // JOB_UNSUPPORTED
  colleced:    mclr.Rst       + "COLECT" + mclr.Rst, // JOB_COLLECTED
  once:        mclr.FgRed     + " ONCE " + mclr.Rst, // JOB_ONCE */
};

console.log(`${mclr.Rst}[____-__-__T__:__:__.___Z] [${stat_msg.boot}] Script started. Trying to check elevated privileges...`);

/*
const isRoot = require('is-root');

if isRoot() {
  console.log(`${mclr.Rst}[____-__-__T__:__:__.___Z] [${stat_msg.ok}] Elevated privileges confirmed. Trying to import modules...`);
} else {
  console.log(`${mclr.Rst}[____-__-__T__:__:__.___Z] [${stat_msg.warning}] Elevated privileges is NOT confirmed. Launch as root. Exiting...`);
  return;
};*/

const Discord  = require('discord.js');
const shell    = require('shelljs');
const fs       = require('fs');
const chokidar = require('chokidar');
require('log-timestamp');

console.log(`[${stat_msg.info}] This platform is: ${process.platform}`);

console.log(`[${stat_msg.load}] Importing modules done. Trying to load config files...`);
const cfg = JSON.parse(fs.readFileSync(os_config_path, 'utf8'));

console.log(`[${stat_msg.ok}] Configs loaded, help command: ${cfg.general.cmd_prefix}${cfg.commands.general.help}. Trying to load localization files...`);
if ((cfg.general.OUTPUT_LANGUAGE == "ENG") || (typeof(cfg.general.OUTPUT_LANGUAGE) != String))  {
  console.log(`[${stat_msg.load}] According to configuration file, trying to loading file of language: English...`);
  const lang = require(cfg.directories.LOC_ENG);
  console.log(`[${stat_msg.ok}] Localization file file required.`);
} else {
  console.log(`[${stat_msg.loading}] According to configuration, trying to loading file of language: Russian...`);
  const lang = require(cfg.directories.LOC_RUS);
  console.log(`[${stat_msg.ok}] Localization file file required.`);
};

console.log(`[${stat_msg.ok}] ${lang.select_lang} ${lang.language_name}. ${lang.select_lang2}`);

console.log(`[${stat_msg.load}] ${lang.server1_settings_loading}`);
const Server1 = JSON.parse(fs.readFileSync(cfg.directories.S1_JSON, 'utf8'));
console.log(`[${stat_msg.load}] ${lang.server2_settings_loading}`);
const Server2 = JSON.parse(fs.readFileSync(cfg.directories.S2_JSON, 'utf8'));

console.log(`[${stat_msg.ok}] ${lang.servers_settings_loaded}`);
const client      = new Discord.Client();
const cmd_channel    = client.channels.cache.get(cfg.channels_id.COMMAND_LINE);
const endround_channel = client.channels.cache.get(cfg.channels_id.ENDROUND);

client.on('ready', () => {
  var client_is_ready = true;
  console.log(`[${stat_msg.info}] Logged in as «${client.user.tag}».`);
  console.log(`[${stat_msg.boot}] ${lang.greeting_log}${mclr.Rst}`)
  commandOutputEmbed = new Discord.RichEmbed()
    .setColor('#008000') // green
    .setAuthor(lang.greeting_print)
    .setTimestamp()
  client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(commandOutputEmbed);
  client.user.setActivity(lang.bot_status_playing);
});

setInterval(checkOnline, 5000); // refreshes data about servers every 5 seconds

// we use screens for DD and DM

async function checkOnline(server) {
  var s1_onlinestatus  = shell.exec(`[ "$(screen -ls | grep ${Server1.name}server)"  ] && echo ${lang.server_online} || echo ${lang.server_offline}`, { silent: true });
  var s1_compilestatus = shell.exec(`[ "$(screen -ls | grep ${Server1.name}compile)" ] && echo ${lang.server_build_compiling} || echo ${lang.server_build_not_compiling}`, { silent: true });

  var s2_onlinestatus  = shell.exec(`[ "$(screen -ls | grep ${Server2.name}server)"  ] && echo ${lang.server_online} || echo ${lang.server_offline}`, { silent: true });
  var s2_compilestatus = shell.exec(`[ "$(screen -ls | grep ${Server2.name}compile)" ] && echo ${lang.server_build_compiling} || echo ${lang.server_build_not_compiling}`, { silent: true });

  if (s1_compilestatus == lang.server_build_compiling) s1_onlinestatus = s1_compilestatus;
  if (s2_compilestatus == lang.server_build_compiling) s2_onlinestatus = s2_compilestatus;

 //if (typeof lastMinutes === 'undefined') var lastMinutes = today.getTime() - (1000 * 60 * 10) // 600 000 milisec - 10 minutes

 //if (Math.abs(today.getMinutes() - lastMinutes) >= 3) { // && (today.getMinutes()[-1] in [0, 5]
 //if ((today.getMinutes()[-1] == 1) || (today.getMinutes()[-1] == 3) || (today.getMinutes()[-1] == 6) || (today.getMinutes()[-1] == 9)) {

  var today = new Date();
  if (today.getMonth() < 9) var date = today.getFullYear() + '.0' + (today.getMonth() + 1) + '.' + today.getDate();
  var date = today.getFullYear() + '.' + (today.getMonth() + 1) + '.' + today.getDate();
  var time = today.getHours() + ":00"; //+ today.getMinutes();
  var dateTime = date + ', ' + time;

  client.channels.cache.get(cfg.channels_id.COMMAND_LINE).setTopic(` | ${cfg.servers.first.Discord_show_name}: ${s1_onlinestatus} | ${cfg.servers.second.Discord_show_name}: ${s2_onlinestatus} | Updated: ${dateTime} (1 hour)`);

};

if ((cfg.general.replays_avaliable) && (cfg.directories.DEMOS != "")) {
  chokidar.watch(cfg.directories.DEMOS, {ignoreInitial: true, interval: 15000}).on('addDir', (event, path) => { // every 15 seconds
    endround_channel.send(`${lang.endround_message}${event.slice(-4)} ${lang.endround_message2}${event.slice(-4)}`); // here is the channel where links to replays posted
  });
};

client.on('message', message => {
  if (message.author.bot) return;
  if (message.channel != client.channels.cache.get(cfg.channels_id.COMMAND_LINE)) return;
  if (!message.content.startsWith(cfg.general.cmd_prefix)) {
    console.log(`[${stat_msg.not_cmd}] (${message.author.username}) {${message.channel.name}}: ${message.content}`);
    return;
  } else {
    console.log(`[${stat_msg.command}] (${message.author.username}) {${message.channel.name}}: ${message.content}`);
    commandOutputEmbed = new Discord.RichEmbed()
    .setColor('#FFFF00') // yellow
    .setAuthor('Сommand recognized, executing. If nothing printed, that can be error.')
  client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(commandOutputEmbed);
  };

  if (message.content.startsWith(cfg.general.cmd_prefix + cfg.commands.general.help)) {
    if (cfg.script_debug) console.log(stat_msg.info + " " + lang.cmd_recived_help);
    print_help();
    return;
  };

  if (message.content.startsWith(cfg.general.cmd_prefix + cfg.commands.nodejs.version)) {
    client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`Node.js version: ${process.version}`);
    return;
  };

  if (message.content.startsWith(cfg.general.cmd_prefix + cfg.commands.nodejs.uptime)) {
    client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`Current Node.js process uptime: ${process.uptime()}`);
    return;
  };

  if (message.content.startsWith(cfg.general.cmd_prefix + cfg.commands.general.whoisadmin) && message.author.id == cfg.general.HOST_USER_ID) {
    var msg = message.content.slice(cfg.general.cmd_prefix.length).split(' ');
    switch(msg[1]) {
    case Server1.name:
      client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${Server1.admins}`);
      break;
    case Server2.name:
      client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${Server2.admins}`);
      break;
    default:
      client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`No avaliable servers with entered name is not detected.`);
      client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.run_help_for_help);
      return;
    }
  };

  if (message.content.startsWith(cfg.general.cmd_prefix + cfg.commands.general.adduser) && message.author.id == cfg.general.HOST_USER_ID) {
    var msg = message.content.slice(cfg.general.cmd_prefix.length).split(' ');
    switch(msg[1]) {
    case Server1.name:
      var uid = Server1.admins.indexOf(msg[2]);
      if (uid == -1) {
        Server1.admins.push(msg[2]);
        fs.writeFileSync('./s1.json', JSON.stringify(Server1, null, 4));
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.contoller_added_to_server+msg[2]+lang.contoller_added_to_server2+msg[1]+lang.contoller_added_to_server3);
      } else {
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.contoller_already_added+msg[2]+lang.contoller_already_added2+msg[1]+lang.contoller_already_added3);
      }
      break;
    case Server2.name:
      var uid = Server2.admins.indexOf(msg[2]);
      if (uid == -1) {
        Server2.admins.push(msg[2]);
        fs.writeFileSync('./s2.json', JSON.stringify(Server2, null, 4));
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.contoller_added_to_server+msg[2]+lang.contoller_added_to_server2+msg[1]+lang.contoller_added_to_server3);
      } else {
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.contoller_already_added+msg[2]+lang.contoller_already_added2+msg[1]+lang.contoller_already_added3);
      }
      break;
    default:
      client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.run_help_for_help);
      return;
    }
  };

  if (message.content.startsWith(cfg.general.cmd_prefix + cfg.commands.general.remuser) && message.author.id == cfg.general.HOST_USER_ID) {
    var msg = message.content.slice(cfg.general.cmd_prefix.length).split(' ');
    switch(msg[1]) {
    case Server1.name:
      var uid = Server1.admins.indexOf(msg[2]);
      if (uid != -1) {
        Server1.admins.splice(Server1.admins.indexOf(msg[2]), 1);
        fs.writeFileSync('./s1.json', JSON.stringify(Server1, null, 4));
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.contoller_removed+msg[2]+lang.contoller_removed2+msg[1]+lang.contoller_removed3);
      } else {
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.contoller_to_remove_not_found+msg[2]+lang.contoller_to_remove_not_found2+msg[1]+lang.contoller_to_remove_not_found3);
      };
      break;
    case Server2.name:
      var uid = Server2.admins.indexOf(msg[2]);
      if (uid != -1) {
        Server2.admins.splice(Server2.admins.indexOf(msg[2]), 1);
        fs.writeFileSync('./s2.json', JSON.stringify(Server2, null, 4));
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.contoller_removed+msg[2]+lang.contoller_removed2+msg[1]+lang.contoller_removed3);
      } else {
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.contoller_to_remove_not_found+msg[2]+lang.contoller_to_remove_not_found2+msg[1]+lang.contoller_to_remove_not_found3);
      }
      break;
    default:
      client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.run_help_for_help);
      return;
    }
  };

  if (message.content.startsWith(cfg.general.cmd_prefix + Server1.name)) {
    cmd_to = message.content.slice(cfg.general.cmd_prefix.length).split(' ').slice(1).join(" ");
    issue_command(message.author.id, cmd_to, Server1.name);
  };

  if (message.content.startsWith(cfg.general.cmd_prefix + Server2.name)) {
    cmd_to = message.content.slice(cfg.general.cmd_prefix.length).split(' ').slice(1).join(" ");
    issue_command(message.author.id, cmd_to, Server2.name);
  };

});

async function issue_command(uid, cmd, server) {
  var sname;
  var admins;
  var devs;
  var port;
  switch(server) {
    case Server1.name:
      sname  = Server1.name;
      admins = Server1.admins;
      devs   = Server1.devs;
      port   = Server1.port;
      break;
    case Server2.name:
      sname  = Server2.name;
      admins = Server2.admins;
      devs   = Server2.devs;
      port   = Server2.port;
      break;
    default:
      client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(lang.run_help_for_help);
      return;
  };
  console.log(`${stat_msg.load} Trying to load OS shell servers control paths.`);
  os_cmds = {
    server_name:   `${cfg.directories.REPOS}server_${sname}`,
    server_repo:   `${cfg.directories.REPOS}repo_${sname}`,
    server_prod_name: `${cfg.directories.REPOS}server_${sname}`,
  };
  os_cmd_paths = {
    deploy:      `sh ${os_cmds.server_repo}/tools/deploy.sh ${cfg.directories.REPOS}server_${sname}`,
    compile:     `cd ${os_cmds.server_repo}/ && : > ../${sname}_compile.log && screen -dmS ${sname}compile -L -Logfile ../${sname}_compile.log DreamMaker tgstation.dme`,
    update_compile:  `cd ${os_cmds.server_repo}/ && : > ../${sname}_update.log && : > ../${sname}_compile.log && git pull > ../${sname}_update.log && screen -dmS ${sname}compile -L -Logfile ../${sname}_compile.log DreamMaker tgstation.dme`,
    update:      `cd ${os_cmds.server_repo}/ && : > ../${sname}_update.log && git pull > ../${sname}_update.log &`,
    send_compile_log: `cat ${cfg.directories.REPOS}${sname}_compile.log`,
    send_update_log: `cat ${cfg.directories.REPOS}${sname}_update.log`,
    dlog:       `cat ${cfg.directories.PROD}${sname}_dd.log`,
    ddlog:      `${cfg.directories.PROD}${sname}_dd.log`,
    start1:      `[ "$(screen -ls | grep ${sname}server)"  ] && echo 1 || echo 0`,
    start2:      `export LD_LIBRARY_PATH=${os_cmds.server_prod_name} && cd ${os_cmds.server_prod_name}/ && : > ../${sname}_dd.log && screen -dmS ${sname}server -L -Logfile ../${sname}_dd.log DreamDaemon tgstation.dmb -port ${port} -trusted -public -threads on -params config-directory=cfg`,
    stop:       `screen -X -S ${sname}server quit`
  };
  console.log(`${stat_msg.load} OS shell servers control paths loaded.`);
  if (admins.includes(uid)) {
    if (devs.includes(uid)) {
      switch (cmd) {
        case cfg.commands.build_control.deploy:
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to execute deploy build of server.`);
          shell.exec(os_cmd_paths.deploy, { silent: true });
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Deploy command executed.`);
          break;
        case cfg.commands.build_control.compile:
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to execute compile build of server.`);
          shell.exec(os_cmd_paths.compile, { silent: true });
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Compile command executed. Compiling in progress.`);
          break;
        case cfg.commands.build_control.update_compile:
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to execute bungle "auto+update+compile".`);
          shell.exec(os_cmd_paths.update_compile, { silent: true });
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Started Auto-update-compile.`);
          break;
        case cfg.commands.build_control.update:
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to execute update.`);
          shell.exec(os_cmd_paths.update, { silent: true });
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Update command executed.`);
          break;
        case cfg.commands.build_control.send_compile_log:
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to send compile log.`);
          var log = shell.exec(os_cmd_paths.send_compile_log, { silent: true });
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`\`\`\`${log}\`\`\``);
          break;
        case cfg.commands.build_control.send_update_log:
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to send update log.`);
          var log = shell.exec(os_cmd_paths.send_update_log, { silent: true });
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${log}`, { split: true });
          break;
        case cfg.commands.build_control.dlog:
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to send dd log via "cat".`);
          var log = shell.exec(os_cmd_paths.dlog, { silent: true });
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${log}`, { split: true });
          break;
        case cfg.commands.build_control.ddlog:
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to send dd log directly.`);
          if (fs.existsSync(os_cmd_paths.ddlog)) {
            client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send({ files: [os_cmd_paths.ddlog] });
          } else {
            client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`It seems that there is no required file, <@${mts.author.id}>.`);
          };
          break;
      };
    };
    switch (cmd) {
      case cfg.commands.work_control.restart:
      case cfg.commands.work_control.stop:
        if (cmd == cfg.commands.work_control.restart) client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Server emergency restart sequence engaged.`);
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to stop server.`);
        shell.exec(os_cmd_paths.stop, { silent: true });
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Stop command executed. Stopped.`); // Killed
        if (cmd == cfg.commands.work_control.restart) {
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to start server.`);
          shell.exec(os_cmd_paths.start2, { silent: true });
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Start command executed. Starting.`);
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Server emergency restart sequence finished.`);
        }
        break;
      case cfg.commands.work_control.start:
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to check server's pulse.`);
        if (shell.exec(os_cmd_paths.start1, { silent: true }) == "1\n") {
          client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Server is still online, starting not required.`); // Not dead yet.
          break;
        };
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Trying to start server.`);
        shell.exec(os_cmd_paths.start2, { silent: true });
        client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(`${sname}: Start command executed. Starting.`);
        break;
    };
  };
};

async function print_help() {
  if (cfg.script_debug) console.log(`${stat_msg.info} Function \"print_help\" called.`);
  //console.log(arguments.callee.name);

  var h =  `\`${cfg.general.cmd_prefix}${cfg.commands.general.adduser} SERVER_NAME UID\` — adds user to server\n`;
  h +=   `\`${cfg.general.cmd_prefix}${cfg.commands.general.remuser} SERVER_NAME UID\` — removes user from server\n`;
  h +=   `\`${cfg.general.cmd_prefix}${cfg.commands.general.whoisadmin} SERVER_NAME\` — list of users in server\n`;
  h +=   `\`${cfg.general.cmd_prefix}${cfg.commands.nodejs.version}\` — displays the Node.js version string.\n`;
  h +=   `\`${cfg.general.cmd_prefix}${cfg.commands.nodejs.uptime}\` — displays uptime in seconds of the current Node.js process running.\n`;

  var h2 = `\`${cfg.general.cmd_prefix}${cfg.commands.general.help}\` — displays this information\n`;
  h2 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.build_control.compile}\` — runs compilation in the repo dir\n`;
  h2 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.build_control.deploy}\` — moves compiled files and defined in «deploy.sh»\n`;
  h2 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.build_control.update}\` — updates local repo from master\n`;
  h2 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.build_control.send_compile_log}\` — sends compile log file\n`;
  h2 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.build_control.send_update_log}\` — sends update log file\n`;
  h2 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.build_control.dlog}\` — displays DreamDaemon log\n`;
  h2 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.build_control.ddlog}\` — retrieve dd.log file from the server\n`;

  var h3 = `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.work_control.start}\` — start server\n`;
  h3 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.work_control.stop}\` — stop server\n`;
  h3 +=   `\`${cfg.general.cmd_prefix}SERVER_NAME ${cfg.commands.work_control.restart}\` — restart server\n`;
 // inside a command, event listener, etc.
   commandOutputEmbed = new Discord.RichEmbed()
    .setColor('#0099ff')
    .setAuthor('Help contents:', 'https://i.imgur.com/wSTFkRM.png')
    .addField('• Host user privileges:', h)
    .addField('• Developer user privileges:', h2)
    .addField('• Regular user privileges:', h3)
    .setTimestamp()
    .setFooter('', 'https://i.imgur.com/wSTFkRM.png');
  client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send(commandOutputEmbed);
};

console.log(`[${stat_msg.boot}] Trying to login and start servicing...`);
client.login(cfg.general.BOT_ACCESS_TOKEN);

client.on("disconnect", () => client.console.warn("Bot is disconnecting..."))
  .on("reconnecting", () => client.console.log("Bot reconnecting..."))
  .on("error", err => client.console.error(err))
  .on("warn", info => client.console.warn(info));

//trap `[____-__-__T__:__:__.___Z] [${stat_msg.ok}] Interruption detected, shutting down... ; exit 1`;



console.log('Script body is initialized.');

//graceful shutdown
process.on('SIGINT', function() { console.log("Caught interrupt signal (CTRL-C)"); process.exit(1) });
process.on('SIGQUIT', function() { console.log("Caught interrupt signal (keyboard quit action)"); process.exit(1) });
process.on('SIGTERM', function() { console.log("Caught interrupt signal (operating system kill)"); process.exit(1) });

process.on('exit', code => {
  console.log (`Exiting. Exit code: ${code}`);
  // client.channels.cache.get(cfg.channels_id.COMMAND_LINE).send("Script stopping die external command.");
  // client.user.setStatus("offline");
  process.exit(1);
});