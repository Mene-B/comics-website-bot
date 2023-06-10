const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle} = require("discord.js");
const {JSDOM} = require("jsdom");
const {pagesBuilder} = require("../util.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("serieslist")
    .setDescription("Use this command to get the list of all the issues of a series")
    .addStringOption(option=>{
        return option
        .setName("seriesname")
        .setDescription("Enter the series name")
        .setRequired(true)
    }),
    run : async function(interaction){
        await interaction.deferReply();
        const seriesName = interaction.options.getString("seriesname");
        const url = (string)=>{
            const url = "https://metron.cloud/series/search?q="
            return url+string.split(" ").join("+");
        }

        const document = new JSDOM(await(await fetch(url(seriesName))).text()).window.document;
        if(document.querySelector(".card") === null){
            return interaction.followUp("Sorry but we can't find what you are looking for...");
        }
        const issuesURL = "https://metron.cloud"+document.querySelector(".card-footer-item").href;
        const newDocument = new JSDOM(await(await fetch(issuesURL)).text()).window.document;
        const embedTitle = newDocument.querySelector(".title").textContent.trim();
        const pagesNumberWebsite = parseInt(Array.from(newDocument.querySelectorAll(".pagination-link"))?.at(-1)?.textContent?.trim()) || 1;
        const titles = [];
        for(let i =1; i<=pagesNumberWebsite; i++){
            const docu = new JSDOM(await(await fetch(issuesURL+"?page="+i.toString())).text()).window.document;
            docu.querySelectorAll(".card-header-title.is.is-centered").forEach(doc=>{
                titles.push(doc.textContent.trim())
            })
        }
        console.log(titles);
        let currentPage = 1;
        const pages = pagesBuilder(titles);
        const pagesNumber = pages.length;
        const pagesEmbed = pages.map((page,index)=>{
            return new EmbedBuilder()
            .setAuthor({name: embedTitle+`(${titles.length.toString()})`})
            .setThumbnail("https://i.goopics.net/jevyo7.png")
            .setDescription(page.join("\n\n"))
            .setFooter({text: `Page ${index+1}/${pagesNumber}`})
            .setColor("Red")
        });

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
        if (pagesNumber === 1){
            buttons[1].setDisabled(true);
        }
        const row = new ActionRowBuilder()
        .addComponents(buttons);
        const collector = (await interaction.followUp({embeds :[pagesEmbed[currentPage-1]], components:[row]})).createMessageComponentCollector({
            filter: ()=>true,
            time: 1000000
        });
        collector.on("collect",async(newInteraction) => {
            if(interaction.member.user.id !== newInteraction.member.user.id){
                return newInteraction.reply("Only the user that used this command is able to press those buttons");
            }
            if (newInteraction.customId === "previous"){
                currentPage -= 1;
                if(currentPage === 1){
                    newInteraction.message.components[0].components[0].data.disabled = true;
                }
                if(newInteraction.message.components[0].components[1].data.disabled === true){
                    newInteraction.message.components[0].components[1].data.disabled = false;
                }
                newInteraction.message.edit({
                    embeds: [pagesEmbed[currentPage-1]],
                    components: newInteraction.message.components
                })
            }
            if (newInteraction.customId === "next"){
                currentPage += 1;
                if(currentPage === pagesNumber){
                    newInteraction.message.components[0].components[1].data.disabled = true;
                }
                if(newInteraction.message.components[0].components[0].data.disabled === true){
                    newInteraction.message.components[0].components[0].data.disabled = false;
                }
                newInteraction.message.edit({
                    embeds: [pagesEmbed[currentPage-1]],
                    components: newInteraction.message.components
                })
            }


            newInteraction.deferUpdate();
        })
    }
}