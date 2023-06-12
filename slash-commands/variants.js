const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle} = require("discord.js");
const {JSDOM} = require("jsdom");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("variants")
    .setDescription("Get the variants covers of a comic")
    .addStringOption((option) => {
        return option
        .setName("seriesname")
        .setDescription("Enter the series name of your comic")
        .setRequired(true)
    })
    .addStringOption((option) => {
        return option
        .setName("seriesvolumenumber")
        .setDescription("Enter the series volume number of your comic")
        .setRequired(false)
    })
    .addStringOption((option) => {
        return option
        .setName("issuenumber")
        .setDescription("Enter the issue number of your comic")
        .setRequired(false)
    })
    .addIntegerOption((option) => {
        return option
        .setName("coveryear")
        .setDescription("Enter the cover year of your comic (between 1939 and today)")
        .setRequired(false)
    })
    
    ,
    run : async (interaction)=>{
        const infos = {
            series_name: interaction.options.getString("seriesname"),
            series_volume: interaction.options.getString("seriesvolumenumber") || "",
            issue_number: interaction.options.getString("issuenumber") || "",
            cover_year: interaction.options.getInteger("coveryear") || ""
        }
        const document = new JSDOM(await(await fetch(`https://metron.cloud/issue/search?series_name=${infos.series_name.split(" ").join("+")}&series_volume=${infos.series_volume}&series_type=&number=${infos.issue_number}&cover_year=${infos.cover_year}&cover_month=&cv_id=`)).text()).window.document;
        const infosLink =(document.querySelector(".card-footer") !== null) ? "https://metron.cloud"+document.querySelector(".card-footer").querySelector("a").href : undefined;

        if(infosLink === undefined){
            return interaction.reply("Sorry but we can't find what you are looking for...")
        }

        const newDocument = new JSDOM(await(await fetch(infosLink)).text()).window.document;
        const images = [];
        const urlElements = newDocument.querySelector(".column.is-one-quarter").querySelectorAll("img");

        urlElements.forEach(element => {
            images.push(element.src)
        });
        let currentImage = 1;
        const imagesNumber = images.length;
        if(imagesNumber === 1){
            await interaction.channel.send("This comic only has one cover.");
            return interaction.reply(images[0]);
        }

        const buttons = [
            new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
            new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
        ]

        if(imagesNumber=== 1){
            buttons[1].setDisabled(true);
        }
        const row = new ActionRowBuilder()
        .addComponents(buttons);

        const collector = (await interaction.reply({content:images[currentImage-1], components: [row]})).createMessageComponentCollector({
            filter:()=>true,
            time: 100000
        });
        collector.on("collect", newInteraction => {
            if(interaction.user.id !== newInteraction.user.id){
                return newInteraction.reply("Only the user that used this command is able to press those buttons")
            }
            if (newInteraction.customId === "previous"){
                currentImage -= 1;
                if(currentImage === 1){
                    newInteraction.message.components[0].components[0].data.disabled = true;
                }
                if(newInteraction.message.components[0].components[1].data.disabled === true){
                    newInteraction.message.components[0].components[1].data.disabled = false;
                }
                newInteraction.message.edit({
                    content: images[currentImage-1],
                    components: newInteraction.message.components
                })
            }
            if (newInteraction.customId === "next"){
                currentImage += 1;
                if(currentImage === imagesNumber){
                    newInteraction.message.components[0].components[1].data.disabled = true;
                }
                if(newInteraction.message.components[0].components[0].data.disabled === true){
                    newInteraction.message.components[0].components[0].data.disabled = false;
                }
                newInteraction.message.edit({
                    content: images[currentImage-1],
                    components: newInteraction.message.components
                })
            }


            newInteraction.deferUpdate();

        })

    }
}