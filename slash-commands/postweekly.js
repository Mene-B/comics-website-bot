const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle} = require("discord.js");
const {JSDOM} = require("jsdom");
const {pagesBuilder} = require("../util.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("postweekly")
    .setDescription("Use this command to get the list of the post weekly releases")
    ,
    run: async function (interaction){
        const url = function(number){
            const url = "https://metron.cloud/issue/thisweek?page="+number.toString();
            return url;
        }
        const pagesNumberWebsite = new JSDOM(await(await fetch(url(1))).text()).window.document.querySelector(".pagination-list").querySelectorAll("li").length;
        const titles = [];
        let currentPage = 1;
        for(let i = 1; i<=pagesNumberWebsite; i++){
            Array.from(new JSDOM(await (await fetch(url(i))).text()).window.document.querySelectorAll(".column.is-one-quarter.has-text-centered")).forEach(docu => {
                titles.push(docu.querySelector(".card-header-title").textContent.trim());
                return;
            });
        };
        const title = new JSDOM(await(await fetch(url(1))).text()).window.document.querySelector("h1.title").textContent.trim();
        const pages = pagesBuilder(titles);
        const pagesNumber = pages.length;
        const pagesEmbed = pages.map((page,index)=>{
            return new EmbedBuilder()
            .setAuthor({name: title})
            .setThumbnail("https://i.goopics.net/jevyo7.png")
            .setDescription(page.join("\n\n"))
            .setColor("Navy")
            .setFooter({text:`Page ${index+1}/${pagesNumber}`})
    
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
        const collector = (await interaction.reply({embeds :[pagesEmbed[currentPage-1]], components:[row]})).createMessageComponentCollector({
            filter: ()=>true,
            time: 100000
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
        console.log(titles);
    }
}