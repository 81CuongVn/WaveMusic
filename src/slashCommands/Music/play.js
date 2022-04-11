const { CommandInteraction, Client, MessageEmbed, Permissions } = require("discord.js");

const { convertTime } = require('../../utils/convert.js');
module.exports = {
  name: "play",
  description: "To play some song.",
  options: [
    {
      name: "input",
      description: "The search input (name/url)",
      required: true,
      type: "STRING"
    }
  ],

  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */

  run: async (client, interaction,) => {
    await interaction.deferReply({
      ephemeral: false
    });
    if (!interaction.guild.me.permissions.has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return interaction.editReply({ embeds: [new MessageEmbed().setColor(client.embedColor).setDescription(`I don't have enough permissions to execute this command! please give me permission \`CONNECT\` or \`SPEAK\`.`)] });
    const { channel } = interaction.member.voice;
    if (!interaction.guild.me.permissionsIn(channel).has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return interaction.editReply({ embeds: [new MessageEmbed().setColor(client.embedColor).setDescription(`I don't have enough permissions connect your vc please give me permission \`CONNECT\` or \`SPEAK\`.`)] });
    if (!interaction.member.voice.channel) return interaction.editReply({ embeds: [new MessageEmbed().setColor(client.embedColor).setDescription("You are not connect in vc")] });
    if (interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return interaction.editReply({ embeds: [new MessageEmbed().setColor(client.embedColor).setDescription(`You are not connected to <#${interaction.guild.me.voice.channelId}> to use this command.`)] });

    const emojiaddsong = client.emoji.addsong;
    const emojiplaylist = client.emoji.playlist;
    let search = interaction.options.getString("input");
    let res;

    let player = client.manager.create({
      guild: interaction.guildId,
      textChannel: interaction.channelId,
      voiceChannel: interaction.member.voice.channelId,
      selfDeafen: true,
      volume: 100
    });

    if (player.state != "CONNECTED") await player.connect();

    try {
      res = await player.search(search);
      if (res.loadType === "LOAD_FAILED") {
        if (!player.queue.current) player.destroy();
        return await interaction.editReply({ embeds: [new MessageEmbed().setColor(client.embedColor).setDescription(`:x: | **There was an error while searching**`)] });
      }
    } catch (err) {
      console.log(err)
    }
    switch (res.loadType) {
      case "NO_MATCHES":
        if (!player.queue.current) player.destroy();
        return await interaction.editReply({ embeds: [new MessageEmbed().setColor(client.embedColor).setDescription("❌ | **No results were found.**")] });
      case "TRACK_LOADED":
        player.queue.add(res.tracks[0], interaction.user);
        if (!player.playing && !player.paused && !player.queue.length)
          player.play();
        const trackload = new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(` Added [${res.tracks[0].title}](${res.tracks[0].uri}) - \`[${convertTime(res.tracks[0].duration)}]\` song to queue`);
        return await interaction.editReply({ embeds: [trackload] });
      case "PLAYLIST_LOADED":
        player.queue.add(res.tracks);
        await player.play();

        const playlistloadds = new MessageEmbed()
          .setColor(client.embedColor)
          .setDescription(` Added [${res.playlist.name}](${search}) - \`[${convertTime(res.playlist.duration)}]\` Playlist to queue`);
        return await interaction.editReply({ embeds: [playlistloadds] });
      case "SEARCH_RESULT":
        const track = res.tracks[0];
        player.queue.add(track);

        if (!player.playing && !player.paused && !player.queue.length) {
          const searchresult = new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(` Added [${track.title}](${track.uri}) - \`[${convertTime(track.duration)}]\` song to queue`);

          player.play();
          return await interaction.editReply({ embeds: [searchresult] });

        } else {
          const thing = new MessageEmbed()
            .setColor(client.embedColor)
            .setDescription(` Added [${track.title}](${track.uri}) - \`[${convertTime(track.duration)}]\` song to queue`);

          return await interaction.editReply({ embeds: [thing] });

        }
    }
  }
}

