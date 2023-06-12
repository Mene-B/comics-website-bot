const {SlashCommandBuilder,EmbedBuilder} = require("discord.js");
const {JSDOM} = require("jsdom");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("comic")
    .setDescription("Get the informations about a comic")
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
        const html = await(await fetch(`https://metron.cloud/issue/search?series_name=${infos.series_name.split(" ").join("+")}&series_volume=${infos.series_volume}&series_type=&number=${infos.issue_number}&cover_year=${infos.cover_year}&cover_month=&cv_id=`)).text();
        const document = new JSDOM(html).window.document;
        if(document.querySelector(".card") === null){
            return interaction.reply("Sorry but we can't find what you are looking for...")
        }

        const cardTitle = document.querySelector(".card-header-title").textContent;
        const imageURL = document.querySelector(".card-image").querySelector("img").src;
        const infosLink = "https://metron.cloud"+document.querySelector(".card-footer").querySelector("a").href;
        const newDocument = new JSDOM(await(await fetch(infosLink)).text()).window.document;
        const summary = newDocument.querySelectorAll(".column")[1].querySelector("p").textContent;
        const issueInfosElement = Array.from(newDocument.querySelector(".column.is-one-fifth").querySelectorAll("p"));

        const rating = issueInfosElement.find(element => {
            return element.textContent.startsWith("Rating:")
        }).textContent.split("Rating: ")[1];
        const coverDate = issueInfosElement.find(element =>{
            return element.textContent.startsWith("Cover Date:")
        }).textContent.split(" ")[2];
        const UPC = issueInfosElement.find(element => {
            return element.textContent.startsWith("UPC:")
        })?.textContent?.split(" ")[1] || "None";
        const seriesName = issueInfosElement.find(element => {
            return element.textContent.startsWith("Series:")
        }).textContent.split("Series: ")[1];
        

        const storyArcs = (newDocument.querySelector(".column.is-one-fifth").querySelector(".content") !== null) ? "- "+Array.from(newDocument.querySelector(".column.is-one-fifth").querySelector(".content").querySelectorAll("li")).map(element => {
            return element.textContent;
        }).join("\n- ") : "None";


        const embed = new EmbedBuilder()
        .setAuthor({name: cardTitle})
        .setThumbnail(imageURL)
        .setDescription(
        `**Rating :** ${rating}
        **UPC :** ${UPC}
        **Cover date :** ${coverDate}
        **Series name :** ${seriesName}
        **Story acts :**
        ${storyArcs}\n
        **Summary :**
        ${summary}`)
        .setColor("Blurple")
        
        interaction.reply(imageURL);
        interaction.channel.send({embeds: [embed]});
        
        }
}