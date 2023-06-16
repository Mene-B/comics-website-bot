const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle} = require("discord.js");
const {JSDOM} = require("jsdom");
const {pagesBuilder} = require("../util.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("storyarcs")
    .setDescription("Use this command to get the list of all the issues of a series")
    .addStringOption(option=>{
        return option
        .setName("arcname")
        .setDescription("Enter the story arc name")
        .setRequired(true)
    }),
    run : async function(interaction){
        let arcNameURL = [];
        const arcName = interaction.options.getString("arcname").split("").filter((char)=>{
            return (char !== "." && char !== ":" && char !== "+" && char !== "=" && char!== "-");
        }).join("").toLowerCase().split(" ").join("-");
        arcName.split("").forEach((element, index) => {
            if((element === "-" && arcName[index-1] !== "-") || element !== "-"){
                arcNameURL.push(element);
            }
        });
        console.log(arcNameURL.join(""));

        const document = new JSDOM(await (await fetch('https://metron.cloud/arc/search?q='+arcNameURL.join(""))).text()).window.document;

        if(document.querySelector(".card") === null){
            return interaction.reply("Sorry but we can't find what you are looking for...")
        }
        const newDocURL = document.querySelectorAll("a.card-footer-item")[1].href;
        console.log(newDocURL);
        const newDoc = new JSDOM(await (await fetch("https://metron.cloud"+newDocURL)).text()).window.document;
        const issues = Array.from(newDoc.querySelector("ul").querySelectorAll("a")).map(element => {
            return element.textContent.trim();
        });
        console.log(issues);
        const pages = pagesBuilder(issues);
        const pagesNumber = pages.length;
        
        const pagesEmbeds = pages.map((page,index) => {
            return new EmbedBuilder()
            .setAuthor({name: newDoc.querySelector("p.title").textContent.trim()})
            .setDescription(page.join("\n\n"))
            .setColor("DarkAqua")
            .setFooter({text: `Page ${index+1}/${pages.length}`})
        });
        let currentPage= 1;
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
        if(pagesNumber === 1){
            buttons[1].setDisabled(true);
        }
        const row = new ActionRowBuilder()
        .addComponents(buttons);
        const collector = (await interaction.reply({embeds: [pagesEmbeds[currentPage-1]], components: [row]})).createMessageComponentCollector({
            filter: ()=>true, 
            time: 100000
        });

        collector.on("collect", newInteraction => {
            newInteraction.deferUpdate();
            if(newInteraction.customId === "previous"){
                currentPage -= 1;
                if(currentPage === 1){
                    newInteraction.message.components[0].components[0].data.disabled = true;
                }
                if(newInteraction.message.components[0].components[1].data.disabled === true){
                    newInteraction.message.components[0].components[1].data.disabled = false;
                }
                newInteraction.message.edit({
                    embeds: [pagesEmbeds[currentPage-1]],
                    components: newInteraction.message.components
                })
            }
            if(newInteraction.customId === "next"){
                currentPage += 1;
                if(currentPage === pagesNumber){
                    newInteraction.message.components[0].components[1].data.disabled = true;
                }
                if(newInteraction.message.components[0].components[0].data.disabled === true){
                    newInteraction.message.components[0].components[0].data.disabled = false;
                }
                newInteraction.message.edit({
                    embeds: [pagesEmbeds[currentPage-1]],
                    components: newInteraction.message.components
                })
            }
        })


    }
}