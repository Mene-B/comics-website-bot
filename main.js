const {JSDOM} = require("jsdom");
const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent
    ]
});

const fs = require('fs');
const config = require("./config.json");
const token = config.token;

client.login(token);

const commands = fs.readdirSync("./slash-commands").map(filrName => {
    const datas = require("./slash-commands/"+filrName);
    return {data: datas.data, run: datas.run};
});

client.on("interactionCreate", (interaction)=> {
    if (interaction.isCommand()){
        const command = commands.find(command =>{
            return command.data.name === interaction.commandName;
        });
        command.run(interaction);
    }
})


async function test(){
    const res = await fetch("https://metron.cloud/");
    const html = await res.text();
    const document = new JSDOM(html).window.document;
    const cards = document.querySelectorAll(".card");
    const cardsArray = Array.from(cards);
    cardsArray.forEach((cardDiv) => {
        const text = cardDiv.querySelector('.card-header-title').textContent;
        console.log(text);
    })
    console.log(cards[0]);
    console.log(cardsArray);

    return;
}

test();
