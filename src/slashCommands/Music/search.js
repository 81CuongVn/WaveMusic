const { MessageEmbed, MessageButton, MessageActionRow, Permissions, Client, CommandInteraction } = require("discord.js");

const { convertTime } = require("../../utils/convert");

module.exports = {
    name: "search",
    description: "search for a song from youtube",
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

    const query = interaction.options.getString("input");
    if(!interaction.guild.me.permissions.has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return interaction.editReply({embeds: [new MessageEmbed().setColor(client.embedColor).setDescription(`I don't have enough permissions to execute this command! please give me permission \`CONNECT\` or \`SPEAK\`.`)]});
    const { channel } = interaction.member.voice;
    if(!interaction.guild.me.permissionsIn(channel).has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])) return interaction.editReply({embeds: [new MessageEmbed().setColor(client.embedColor).setDescription(`I don't have enough permissions connect your vc please give me permission \`CONNECT\` or \`SPEAK\`.`)]});
    if(!interaction.member.voice.channel) return interaction.editReply({embeds: [new MessageEmbed ().setColor(client.embedColor).setDescription("You are not connect in vc")]});
    if(interaction.guild.me.voice.channel && interaction.guild.me.voice.channelId !== interaction.member.voice.channelId) return interaction.editReply({embeds: [new MessageEmbed ().setColor(client.embedColor).setDescription(`You are not connected to <#${interaction.guild.me.voice.channelId}> to use this command.`)]});

    let player = interaction.client.manager.get(interaction.guildId);
    if(!player)
     player = interaction.client.manager.create({
        guild: interaction.guildId,
        voiceChannel: channel.id,
        textChannel: interaction.channelId,
        volume: 100,
        selfDeafen: true,
      }) 
      if(player && player.state !== "CONNECTED") player.connect();
  
    const but = new MessageButton().setCustomId("s_one").setLabel("1").setStyle("PRIMARY");
    const but2 = new MessageButton().setCustomId("s_two").setLabel("2").setStyle("PRIMARY");
    const but3 = new MessageButton().setCustomId("s_three").setLabel("3").setStyle("PRIMARY");
    const row = new MessageActionRow().addComponents(but, but2, but3);

    const emojiplaylist = client.emoji.playlist;
 
    let s = await player.search(query, interaction.author);
    switch (s.loadType) {
        case "TRACK_LOADED":
            player.queue.add(s.tracks[0]);
            const embed = new MessageEmbed()
             .setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri}) To The Queue.`)
             .setColor(client.embedColor)

            interaction.editReply({ embeds: [embed] });
            if (!player.playing) player.play()
            break;
         case "SEARCH_RESULT":
             let index = 1;
             const tracks = s.tracks.slice(0, 3);
             const results = s.tracks.slice(0, 3).map(x => `> \`[ ${index++} ]\`[${x.title}](${x.uri}) \`[ ${convertTime(x.duration)} ]\``)
                    .join("\n");
                    const searched = new MessageEmbed()
                        .setTitle("Select the track that you want")
                        .setColor(client.embedColor)
                        .setDescription(results);

                    await interaction.editReply({embeds: [searched], components: [row] });
                    const search = new MessageEmbed()
                    .setColor(client.embedColor);

            const collector = interaction.channel.createMessageComponentCollector({
                filter: (f) => f.userId === interaction.authorId ? true : false && f.deferUpdate(),
                max: 1,
                time: 60000,
                idle: 60000/2
            });
            collector.on("end", async (collected) => {
                await interaction.editReply({ components: [new MessageActionRow().addComponents(but.setDisabled(true), but2.setDisabled(true), but3.setDisabled(true))] })
                                    
            });
            collector.on("collect", async (b) => {
                if(!b.deferred) await  b.deferUpdate();
                if(!player && !collector.ended) return collector.stop();
                if(player.state !== "CONNECTED") player.connect();

                if(b.customId === "s_one") {
                    player.queue.add(s.tracks[0]);
                    if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();
 
                    await interaction.editReply({embeds: [search.setDescription(`Added [${s.tracks[0].title}](${s.tracks[0].uri})To The Queue.`) ]})
                } else if(b.customId === "s_two") {
                    player.queue.add(s.tracks[1]);
                    if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                    await interaction.editReply({embeds: [search.setDescription(`Added [${s.tracks[1].title}](${s.tracks[1].uri})To The Queue.`) ]})
            
                } else if(b.customId === "s_three") {
                    player.queue.add(s.tracks[2]);
                    if(player && player.state === "CONNECTED" && !player.playing && !player.paused && !player.queue.size) await player.play();

                        await interaction.editReply({embeds: [search.setDescription(`Added [${s.tracks[2].title}](${s.tracks[2].uri})To The Queue.`) ]})
                
                } 
 
            });

        }
        
    }
}

