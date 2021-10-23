require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// ---------- LOGGIN FEATURES ----------
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', { flags: 'a' });
var log_stdout = process.stdout;

console.log = function (d) { //
	log_file.write(util.format(d) + '\n');
	log_stdout.write(util.format(d) + '\n');
};
// ---------- LOGGIN FEATURES END ----------

// ---------- FAST ANSWERS ----------
var fastAnswers = JSON.parse(fs.readFileSync('./answers.json', 'utf8'));
// ---------- FAST ANSWERS END ----------

console.log("[DEBUG] Bot is starting...");


bot.on('message', (msg) => {
	//bot.sendMessage(msg.chat.id, "Hello dear user"); 
	//console.log(msg);
	let date = new Date(msg.date * 1000);
	let timestamp = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + "@" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();


	let msgFromInfo = "";
	if (msg.chat.type == "private") {
		msgFromInfo = msg.from.first_name + "(" + msg.from.id + ")";
	} else if (msg.chat.type == "group") {
		msgFromInfo = msg.from.first_name + "(" + msg.from.id + "/" + msg.chat.title + ")";
	}

	console.log("[INFO](" + timestamp + ") Msg from " + msgFromInfo + ": " + msg.text);

	if (msg.text != null) {
		let mex = controlMessage(msg.text);
		if (mex != null) {
			//bot.sendMessage(msg.chat.id, mex);

			if (mex.type == "text") {
				bot.sendMessage(msg.chat.id, mex.reply, { "parse_mode": "HTML" });
			} else if (mex.type == "response") {
				bot.sendMessage(msg.chat.id, mex.reply, {
					"reply_to_message_id": msg.message_id,
					"parse_mode": "HTML"
				});
			} else if (mex.type == "image") {
				if (mex.reply.includes("gif")) {
					bot.sendVideo(msg.chat.id, mex.reply);
				} else {
					bot.sendPhoto(msg.chat.id, mex.reply);
				}
			} else if (mex.type == "audio") {
				bot.sendVoice(msg.chat.id, mex.reply);
			} else if (mex.type == "function") {
				//mex.reply(bot); //Future development
			}
		}
	}
});

function controlMessage(message) {

	let found = null;
	//TODO: Should substitute forEach with for (const [triggers, oneFastAnswer] of Object.entries(fastAnswers)), in order to use return inside the loop
	fastAnswers.forEach(function (fastAnswer) { //For every fast answer
		fastAnswer.triggers.forEach(function (trigger) { //Check among all triggers
			let regex = new RegExp("\\b" + trigger + "\\b", "gi");//Search global and case insenstive
			let regexResult = message.match(regex);

			//console.log("Regex result: " + regexResult);

			if ((regexResult != null) && !found) { //If RegEx matches and wasn't previously found
				let rnd = Math.floor((Math.random() * (fastAnswer.replies.length)) + 0);
				found = fastAnswer.replies[rnd];
				//return fastAnswer.replies[rnd]; //Can't do this with forEach (ahw man, that sucks), see comment above, substitute forEach with for
			}
		});
	});

	return found;
}