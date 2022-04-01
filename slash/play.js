const {SlashCommandBuilder}  = require('@discordjs/builders'); // Discord.js
const {MessageEmbed} = require('discord.js'); // Discord.js
const {QueryType} = require('discord-player'); // Discord-Player

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addSubcommand((subcommand)=> 
          subcommand.setName('song')
          .setDescription('Play a single song')
          .addStringOption((option)=>option.setName('url').setDescription('The url of the song').setRequired(true))
    )
    .addSubcommand((subcommand)=>
        subcommand.setName('playlist')
        .setDescription('Play a playlist')
        .addStringOption((option)=>option.setName('url').setDescription('The url of the playlist').setRequired(true))

    )
    .addSubcommand((subcommand)=>
        subcommand.setName('search')
        .setDescription('Search for a song')
        .addStringOption((option)=>option.setName('query').setDescription('The query to search for').setRequired(true))
    ),
    run: async ({client,interaction})  => {
      if(!interaction.member.voice.channel)
          return interaction.editReply('You must be in a voice channel to use this command');

      const queue = await client.player.createQueue(interaction.guild);
      //if(!queue.connection) await queue.connect(interaction.member.voice.channel);

      try {
        if(!queue.connection){
            await queue.connect(interaction.member.voice.channel)
        }
        //interaction.followUp({ content: `Playing ${songTitle}` });
    } catch (error) {
      try{
        queue.destroy()
        return
      }
      catch(err){
        console.log(err)
      }
        console.log(error)
    }

      let embed = new MessageEmbed()

      if(interaction.options.getSubcommand() == 'song'){
        let url = interaction.options.getString('url');
        const result = await client.player.search(url,{
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE_VIDEO
        })
        if(result.tracks.length === 0)
              return interaction.editReply('No results found');

        const song = result.tracks[0];
        await queue.addTrack(song);
        embed.setDescription(`**${song.title} ${song.url}** has been added to the queue`)
              .setThumbnail(song.thumbnail)
              .setFooter({text: `Duration: ${song.duration}`})

      }else if( interaction.options.getSubcommand() == 'playlist'){
        let url = interaction.options.getString('url');
        const result = await client.player.search(url,{
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE_PLAYLIST
        })
        if(result.tracks.length === 0)
              return interaction.editReply('No results found');

        const playlist = result.playlist;
        await queue.addTracks(result.tracks);
        embed.setDescription(`**${result.tracks.length} songs from ${playlist.title} ${playlist.url}** have been added to the queue`)
              .setThumbnail(playlist.thumbnail)

      }else if(interaction.options.getSubcommand() == 'search'){
        let url = interaction.options.getString('query');
        const result = await client.player.search(url,{
          requestedBy: interaction.user,
          searchEngine: QueryType.AUTO
        })
        if(result.tracks.length === 0)
              return interaction.editReply('No results found');

        const song = result.tracks[0];
        await queue.addTrack(song);
        embed.setDescription(`**${song.title} ${song.url}** has been added to the queue`)
              .setThumbnail(song.thumbnail)
              .setFooter({text: `Duration: ${song.duration}`})
      }

      if(!queue.playing) await queue.play();
      interaction.editReply({
        embeds: [embed]
      });

    }


}